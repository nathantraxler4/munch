import type { Message } from 'types';
import * as llmService from './llmService';

export async function generateQuery(messages: Message[]) {
    const query = await llmService.invokeCompletionAPI({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                    You are an information gatherer. Based on the conversation history you will construct a query
                    to present to the user that will request any necessary information to help the RECIPE_SUGGESTOR,
                    MENU_GENERATOR, or SHOPPING_LIST_BUILDER complete its action.
                `
            },
            ...llmService.separateAssistantAndUserMessages(messages)
        ]
    });
    return { message: query };
}
