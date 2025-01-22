import { Recipe, RecipeInput } from 'generated-graphql';
import RecipeModel from '../models/recipe';
import logger from '../utils/logger';

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
