import { EmbeddingsList, Index, QueryResponse } from '@pinecone-database/pinecone';
import { RecipeInput } from 'generated-graphql';
import { GraphQLError } from 'graphql';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import RecipeModel from '../models/recipe';
import * as llmService from '../services/llmService';
import pc from '../setup/pinecone';
import { Message, PineconeMetaData } from '../types';
import { Errors, logAndThrowError } from '../utils/errors';
import logger from '../utils/logger';

const INDEX_NAME = 'recipes';
const INDEX_HOST = 'https://recipes-xx1tt13.svc.aped-4627-b74a.pinecone.io';
const EMBEDDING_MODEL = 'multilingual-e5-large';

const index: Index = pc.index<PineconeMetaData>(INDEX_NAME, INDEX_HOST);

const RecipeFormat = z.object({
    name: z.string(),
    ingredients: z.string(),
    directions: z.string()
});
const RecipeResponseFormat = z.object({
    recipes: z.array(RecipeFormat)
});

type Recipe = z.infer<typeof RecipeFormat>;
type RecipeResponse = z.infer<typeof RecipeResponseFormat>;

export async function getRecipes(): Promise<Recipe[]> {
    let recipes;
    try {
        recipes = await RecipeModel.find({});
    } catch (error) {
        logger.error(error);
        throw error;
    }
    return recipes;
}

export async function addRecipes(recipes: RecipeInput[]): Promise<Recipe[]> {
    let insertedRecipes;
    try {
        insertedRecipes = await RecipeModel.insertMany(recipes);
    } catch (error) {
        logger.error(error);
        throw error;
    }
    return insertedRecipes;
}

export async function suggestRecipes(messages: Message[]): Promise<PineconeMetaData[]> {
    const recipesResponse = await llmService.invokeStructuredCompletionAPI<RecipeResponse>({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                        You are a recipe suggestor. Based on the conversation history you will generate 3-7 recipes
                        that are most likely to please the user. Include name, ingredients, and instructions. 
                        Please be as concise as possible.
                    `
            },
            {
                role: 'user',
                content: JSON.stringify(messages)
            }
        ],
        response_format: zodResponseFormat(RecipeResponseFormat, 'recipes')
    });

    let pineconeRecipes: PineconeMetaData[] = [];
    for (const pineconeRecipe of recipesResponse.recipes) {
        pineconeRecipes = [
            ...pineconeRecipes,
            ...(await fetchMostSimilarRecipesFromPinecone(pineconeRecipe))
        ];
    }

    return pineconeRecipes;
}

async function fetchMostSimilarRecipesFromPinecone(recipe: Recipe): Promise<PineconeMetaData[]> {
    const vector = await getEmbedding(JSON.stringify(recipe));
    const queryResponse = await queryPinecone(index, vector);
    validateQueryResponse(queryResponse);
    const recipes: PineconeMetaData[] = queryResponse.matches.map(
        (m) => m.metadata
    ) as PineconeMetaData[];
    return recipes;
}

function validateQueryResponse(queryResponse: QueryResponse) {
    for (const match of queryResponse.matches) {
        if (!match.metadata) {
            logAndThrowError({
                message: `Pinecone record missing metadata: ${match}.`,
                code: Errors.PINECONE_ERROR
            });
        }
    }
}

async function queryPinecone(index: Index, vector: number[]): Promise<QueryResponse> {
    try {
        const queryResponse: QueryResponse = await index.query({
            topK: 1,
            vector: vector,
            includeValues: false,
            includeMetadata: true
        });

        logger.debug('Pinecone query response.', { queryResponse });

        return queryResponse;
    } catch (error) {
        logAndThrowError({
            message: 'Error occurred querying pinecone.',
            error: error,
            code: Errors.PINECONE_ERROR
        });
    }
}

async function getEmbedding(prompt: string): Promise<number[]> {
    let embeddings: EmbeddingsList;
    try {
        embeddings = await pc.inference.embed(EMBEDDING_MODEL, [prompt], { inputType: 'query' });

        if (!embeddings[0].values) {
            throw new GraphQLError('Query did not return values for embedding.', {
                extensions: { code: Errors.PINECONE_ERROR }
            });
        }

        logger.debug('Embedding generated successfully.', { embeddings });

        return embeddings[0].values;
    } catch (error) {
        logAndThrowError({
            message: 'Error occurred embedding the prompt.',
            error: error,
            code: Errors.PINECONE_ERROR
        });
    }
}
