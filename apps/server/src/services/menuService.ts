import type { Message } from '../types';

import { Menu } from 'generated-graphql';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import MenuModel from '../models/menu';
import openai from '../setup/openai';
import { Errors, logAndThrowError } from '../utils/errors';
import logger from '../utils/logger';
import * as llmService from './llmService';

const GeneratedMenuCourses = z.object({
    response: z.string(),
    courses: z.array(z.object({ name: z.string(), description: z.string(), url: z.string() }))
});
type GeneratedMenuCoursesType = z.infer<typeof GeneratedMenuCourses>;

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

/**
 * Service method used to generate a menu.
 */
export async function generateMenu(messages: Message[]): Promise<{ response: string; menu: Menu }> {
    logger.info('Generating menu...');
    const imageGenPrompt = await _generateImageGenPrompt(messages);
    const [coursesResponse, imageResponse] = await Promise.all([
        _generateCourses(messages),
        _generateBackgroundImage(imageGenPrompt)
    ]);
    const imageUrl = imageResponse.data[0].url || ''; // TO DO: Add more robust error handling
    const menu = { courses: coursesResponse.courses, backgroundImage: imageUrl };
    await insertMenus([menu]);
    return { response: coursesResponse.response, menu };
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

async function _generateImageGenPrompt(messages: Message[]) {
    logger.info('Requesting LLM to generate image gen prompt...');
    const imageGenPrompt = await llmService.invokeCompletionAPI({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                    You are a menu background image describer. Based on the conversation history you will 
                    describe a background image that will be used for the menu that best matches what the
                    user is looking for.
                `
            },
            ...llmService.separateAssistantAndUserMessages(messages)
        ]
    });
    return imageGenPrompt;
}

async function _generateCourses(messages: Message[]): Promise<GeneratedMenuCoursesType> {
    logger.info('Requesting LLM to generate descriptions...');
    const generatedCourses =
        await llmService.invokeStructuredCompletionAPI<GeneratedMenuCoursesType>({
            model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `
                    You are a master chef preparing a menu. Given the conversation history determine 
                    which recipes are meant to be included in the menu. For each recipes gather the course name, 
                    description and url. For the description pick out the 3-7 most important ingredients 
                    of each recipe formatted as a comma separated string. Please revise the name of each ingredient 
                    so it sounds as appetizing as possible. For example, if the recipe calls for "frozen berries" 
                    revise the name to "berries". Please order the ingredients by their importance to the dish 
                    starting with most important. Include a message for the user in the response.
                `
                },
                ...llmService.separateAssistantAndUserMessages(messages)
            ],
            response_format: zodResponseFormat(GeneratedMenuCourses, 'generatedMenuCourses')
        });

    return generatedCourses;
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
