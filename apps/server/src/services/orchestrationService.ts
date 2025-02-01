import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import type { Message } from '../types';
import * as humanService from './humanService';
import * as llmService from './llmService';
import * as recipeService from './recipeService';

const memory = new Map<number, Message[]>();

const ActionEnum = z.enum(['SUGGEST_RECIPES', 'BUILD_SHOPPING_LIST', 'GENERATE_MENU', 'MORE_INFO']);
const RouteResponseFormat = z.object({ action: ActionEnum });

type Action = z.infer<typeof ActionEnum>;
type RouteResponse = z.infer<typeof RouteResponseFormat>;

export async function respond(prompt: string) {
    const messages = memory.get(1) ?? [];
    const humanMessage: Message = { author: 'user', content: prompt };
    memory.set(1, [...messages, humanMessage]);
    const action = await routeRequest(memory.get(1) ?? []);
    const response = await executeAction(action);
    const aiMessage = { author: 'sous chef', content: response };
    memory.set(1, [...messages, aiMessage]);

    return response;
}

async function routeRequest(messages: Message[]): Promise<Action> {
    const routeResponse = await llmService.invokeStructuredCompletionAPI<RouteResponse>({
        model: process.env.GENERATE_RECIPE_MODEL ?? 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                        You are a message router. Based on the conversation history you will route the request to
                        the appropriate best next action.
                    `
            },
            {
                role: 'user',
                content: JSON.stringify(messages)
            }
        ],
        response_format: zodResponseFormat(RouteResponseFormat, 'action')
    });
    return routeResponse.action;
}

async function executeAction(action: Action): Promise<string> {
    switch (action) {
        case ActionEnum.enum.SUGGEST_RECIPES: {
            return JSON.stringify(await recipeService.suggestRecipes(memory.get(1) ?? []));
        }
        case ActionEnum.enum.BUILD_SHOPPING_LIST: {
            return action;
        }
        case ActionEnum.enum.GENERATE_MENU: {
            return action;
        }
        case ActionEnum.enum.MORE_INFO: {
            const query = await humanService.generateQuery(memory.get(1) ?? []);
            return query;
        }
    }
}
