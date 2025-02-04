import OpenAI from 'openai';
import openai from '../setup/openai';
import { Errors, logAndThrowError } from '../utils/errors';

export async function invokeCompletionAPI(
    config: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
): Promise<string> {
    let content: string;
    try {
        const completion = await openai.chat.completions.create(config);

        if (!completion.choices[0].message.content) {
            logAndThrowError({
                message: 'Completion message does not have content.',
                code: Errors.LLM_API_ERROR
            });
        }

        if (completion.choices[0].message.refusal) {
            logAndThrowError({
                message: 'The LLM refused to answer that prompt.',
                code: Errors.LLM_API_ERROR
            });
        }

        content = completion.choices[0].message.content;
    } catch (error) {
        logAndThrowError({
            message: 'An error occurred requesting LLM API.',
            error,
            code: Errors.LLM_API_ERROR
        });
    }
    return content;
}

export async function invokeStructuredCompletionAPI<T>(
    config: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
): Promise<T> {
    let structuredResponse: T;
    try {
        const completion = await openai.beta.chat.completions.parse(config);
        if (completion.choices[0].finish_reason === 'length') {
            // Handle the case where the model did not return a complete response
            logAndThrowError({
                message: 'Model did not return a complete response.',
                code: Errors.LLM_API_ERROR
            });
        }

        if (!completion.choices[0].message.parsed) {
            logAndThrowError({
                message: 'Structured message returned null.',
                code: Errors.LLM_API_ERROR
            });
        }

        if (completion.choices[0].message.refusal) {
            logAndThrowError({
                message: 'The LLM refused to answer that prompt.',
                code: Errors.LLM_API_ERROR
            });
        }

        structuredResponse = completion.choices[0].message.parsed;
    } catch (error) {
        logAndThrowError({
            message: 'An error occurred requesting LLM API.',
            error,
            code: Errors.LLM_API_ERROR
        });
    }
    return structuredResponse;
}
