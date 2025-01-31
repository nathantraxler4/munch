import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import * as llmService from './llmService';

type Message = { author: string; content: string };

const memory = new Map<number, Message[]>();
memory.set(1, []);

const ActionEnum = z.enum(['SUGGEST_RECIPES', 'BUILD_SHOPPING_LIST', 'GENERATE_MENU', 'MORE_INFO']);

const RouteResponseFormat = z.object({ action: ActionEnum });

type Action = z.infer<typeof ActionEnum>;

type RouteResponse = z.infer<typeof RouteResponseFormat>;

export async function respond(prompt: string) {
    const messages = memory.get(1) ?? [];
    const humanMessage: Message = { author: 'user', content: prompt };
    memory.set(1, [...messages, humanMessage]);
    let action = await routeRequest(memory.get(1) ?? []);
    action = await executeRoute(action);
    const aiMessage = { author: 'sous chef', content: action };
    memory.set(1, [...messages, aiMessage]);

    return action;
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

async function executeRoute(action: Action): Promise<Action> {
    switch (action) {
        case ActionEnum.enum.SUGGEST_RECIPES: {
            return action;
        }
        case ActionEnum.enum.BUILD_SHOPPING_LIST: {
            return action;
        }
        case ActionEnum.enum.GENERATE_MENU: {
            return action;
        }
        case ActionEnum.enum.MORE_INFO: {
            return action;
        }
    }
}
