import OpenAI from 'openai';
import type { PineconeMetaData } from '../types';

import type { EmbeddingsList, Index, QueryResponse } from '@pinecone-database/pinecone';
import { Course, Menu, Recipe, RecipeInput } from 'generated-graphql';
import { GraphQLError } from 'graphql';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ParsedChatCompletion } from 'openai/resources/beta/chat/completions';
import { z } from 'zod';
import MenuModel from '../models/menu';
import openai from '../setup/openai';
import pc from '../setup/pinecone';
import { Errors, logAndThrowError } from '../utils/errors';
import logger from '../utils/logger';

const GeneratedRecipes = z.object({
    recipes: z.array(
        z.object({
            name: z.string(),
            ingredients: z.string(),
            directions: z.string()
        })
    )
});
type GeneratedRecipesType = z.infer<typeof GeneratedRecipes>;

const GeneratedDescriptions = z.object({
    descriptions: z.array(z.string())
});

type GeneratedDescriptionsType = z.infer<typeof GeneratedDescriptions>;

const INDEX_NAME = 'recipes';
const INDEX_HOST = 'https://recipes-xx1tt13.svc.aped-4627-b74a.pinecone.io';
const EMBEDDING_MODEL = 'multilingual-e5-large';

export async function getMenus() {
    logger.info('Getting menus');
    let menus;
    try {
        menus = await MenuModel.find({});
    } catch (error) {
        logger.error(error);
        throw error;
    }
    logger.info(`Fetched ${menus.length} menus from the DB.`);
    return menus;
}

export async function* generateMenuFromPromptStream(
    prompt: string
): AsyncGenerator<string | Course[], void, unknown> {
    logger.info('Generating menu from prompt.', { prompt });
    const index: Index = pc.index<PineconeMetaData>(INDEX_NAME, INDEX_HOST);
    const generatedRecipes = await _generatePotentialRecipes(prompt);
    logger.info('Generated recipes:', { generatedRecipes });
    const promises = [];
    for (const recipe of generatedRecipes) {
        promises.push(fetchMostSimilarRecipesFromPinecone(index, recipe));
    }
    const recipes = await Promise.all(promises);
    for await (const partialResult of generateMenuStream(recipes.flat())) {
        yield partialResult;
    }
}

async function fetchMostSimilarRecipesFromPinecone(
    index: Index,
    recipe: string | Recipe
): Promise<PineconeMetaData[]> {
    if (typeof recipe == 'object') recipe = JSON.stringify(recipe);
    const vector = await getEmbedding(recipe);
    const queryResponse = await queryPinecone(index, vector);
    validateQueryResponse(queryResponse);
    const recipes: PineconeMetaData[] = queryResponse.matches.map(
        (m) => m.metadata!
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

export async function* generateMenuStream(
    recipes: RecipeInput[] | PineconeMetaData[]
): AsyncGenerator<string | Course[], void, unknown> {
    logger.info('Generating menu from recipes.', { recipes });
    const descriptions = await _generateDescriptions(recipes);
    const names = recipes.map((r) => r.name);
    const urls = recipes.map((r) => r.url);
    const courses = _constructCourses(names, descriptions, urls);
    yield courses;
    const imageGenPromptCompletion = await _generateImageGenPrompt(recipes);
    const imageGenPrompt = _getContentFromCompletion(imageGenPromptCompletion);
    const imageResponse = await _generateBackgroundImage(imageGenPrompt);
    const imageUrl = imageResponse.data[0].url || ''; // TO DO: Add more robust error handling
    const menu = { courses, backgroundImage: imageUrl };
    await insertMenus([menu]);
    yield imageUrl;
}

function _getContentFromCompletion(completion: OpenAI.Chat.Completions.ChatCompletion) {
    if (!completion?.choices?.[0]?.message?.content) {
        logAndThrowError({
            message: 'LLM response has no content.',
            code: Errors.LLM_RESPONSE_PARSE_ERROR
        });
    }

    const content = completion.choices[0].message.content;
    return content;
}

function _constructCourses(names: string[], descriptions: string[], urls: string[]): Course[] {
    const courses = descriptions.map((content: string, i: number) => {
        return {
            name: names[i],
            description: content,
            url: urls[i]
        };
    });
    return courses;
}

export async function insertMenus(menus: Menu[]) {
    logger.info('Inserting menus to DB', { menus });
    try {
        await MenuModel.insertMany(menus);
    } catch (error) {
        logAndThrowError({
            message: `Failed to insert menus into MongoDB. Menus: "${menus}"`,
            error: error,
            code: Errors.MONGO_DB_ERROR
        });
    }
    logger.info('Menus succesfully inserted!');
}

async function _generateImageGenPrompt(recipes: RecipeInput[] | PineconeMetaData[]) {
    logger.info('Requesting LLM to generate image gen prompt...');
    const completion = await invokeCompletionAPI({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                    You will be presented a list of recipes. You are tasked with generating a prompt to be used with an image generation model. 
                    The image will be used as a background for displaying a menu. The center should be mostly plain and 
                    take up about 90% of the image to ensure legibility of overlaying text. Ensure the image matches the mood 
                    set by this cuisine in this menu.
                `
            },
            {
                role: 'user',
                content: JSON.stringify(recipes)
            }
        ]
    });
    return completion;
}

async function _generateDescriptions(recipes: RecipeInput[] | PineconeMetaData[]) {
    logger.info('Requesting LLM to generate descriptions...');
    const completion = await invokeStructuredCompletionAPI<GeneratedDescriptionsType>({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                    You are a master chef preparing a menu. 
                    Pick out the 3-7 most important ingredients of each recipe presented to you formatted as a comma separated string.
                    Please revise the name of each ingredient so it sounds as appetizing as possible. For example, if the recipe calls for 
                    "frozen berries" revise the name to "berries". Please order the ingredients by their importance to the dish starting with most important. 
                    Please use a JSON Array to hold a list of the generated strings.  
                `
            },
            {
                role: 'user',
                content: JSON.stringify(recipes)
            }
        ],
        response_format: zodResponseFormat(GeneratedDescriptions, 'generatedDescriptions')
    });
    if (!completion.choices[0].message.parsed) {
        logAndThrowError({
            message: 'Parsed message is nullish.',
            code: Errors.LLM_API_ERROR
        });
    }

    return completion.choices[0].message.parsed.descriptions;
}

async function _generatePotentialRecipes(prompt: string) {
    logger.info('Requesting LLM to generate recipes...');
    const completion = await invokeStructuredCompletionAPI<GeneratedRecipesType>({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                    You are a recipe generator. Always respond with a valid JSON array of recipe objects, and nothing else. Each recipe object must have exactly three string fields:
                        "name"
                        "ingredients"
                        "instructions"
                    No other keys or text should be present. Do not include any commentary, explanations, or additional formatting outside of the JSON array. Be concise.
                `
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        response_format: zodResponseFormat(GeneratedRecipes, 'generatedRecipes')
    });
    if (!completion.choices[0].message.parsed || !completion.choices[0].message.parsed.recipes) {
        logAndThrowError({
            message: 'Parsed message is nullish.',
            code: Errors.LLM_API_ERROR
        });
    }
    return completion.choices[0].message.parsed.recipes;
}

async function invokeCompletionAPI(
    config: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
) {
    let completion;
    try {
        completion = await openai.chat.completions.create(config);
    } catch (error) {
        logAndThrowError({
            message: 'An error occurred requesting LLM API.',
            error,
            code: Errors.LLM_API_ERROR
        });
    }
    return completion;
}

async function invokeStructuredCompletionAPI<T>(
    config: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
): Promise<ParsedChatCompletion<T | null>> {
    let completion;
    try {
        completion = await openai.beta.chat.completions.parse(config);
        if (completion.choices[0].finish_reason === 'length') {
            // Handle the case where the model did not return a complete response
            logAndThrowError({
                message: 'Model did not return a complete response.',
                code: Errors.LLM_API_ERROR
            });
        }

        const recipesResponse = completion.choices[0].message;

        if (recipesResponse.refusal) {
            logAndThrowError({
                message: 'The LLM refused to answer that prompt.',
                code: Errors.LLM_API_ERROR
            });
        }
    } catch (error) {
        logAndThrowError({
            message: 'An error occurred requesting LLM API.',
            error,
            code: Errors.LLM_API_ERROR
        });
    }
    return completion;
}

async function _generateBackgroundImage(prompt: string) {
    if (process.env.MOCK_IMAGE_GENERATION) {
        logger.info('Mocking Text-To-Image response without calling model...');
        return { data: [{ url: 'This is a fake URL.' }] };
    }

    logger.info('Requesting Text-To-Image model to generate background image...');
    let image;

    try {
        image = await openai.images.generate({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'hd',
            style: 'vivid'
        });
    } catch (error) {
        logAndThrowError({
            message: 'An error occurred requesting Text-to-Image API.',
            error,
            code: Errors.IMAGE_GEN_API_ERROR
        });
    }

    return image;
}
