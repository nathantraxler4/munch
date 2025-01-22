import { GraphQLError, GraphQLFormattedError } from 'graphql';
import logger from './logger';

export enum Errors {
    LLM_RESPONSE_PARSE_ERROR = 'LLM_RESPONSE_PARSE_ERROR',
    LLM_API_ERROR = 'LLM_API_ERROR',
    IMAGE_GEN_API_ERROR = 'IMAGE_GEN_API_ERROR',
    MONGO_DB_ERROR = 'MONGO_DB_ERROR',
    PINECONE_ERROR = 'PINECONE_ERROR'
}

export function logAndThrowError({
    message,
    error,
    code
}: {
    message: string;
    error?: unknown;
    code: Errors;
}): never {
    const errorMessage = `${message}${error ? ` Error: ${error}` : ''}`;
    logger.error(errorMessage);
    if (error) throw error;
    throw new GraphQLError(errorMessage, { extensions: { code } });
}

export function formatError(error: GraphQLFormattedError) {
    // Custom error formatting
    if (error?.extensions?.code === 'GRAPHQL_VALIDATION_FAILED') {
        return {
            ...error,
            message: "Your query doesn't match the schema. Try double-checking it!"
        };
    }

    if (error?.extensions?.code === Errors.LLM_RESPONSE_PARSE_ERROR) {
        return {
            ...error,
            message: 'The AI had trouble with that one. Please try again!'
        };
    }

    if (
        [
            Errors.LLM_API_ERROR,
            Errors.IMAGE_GEN_API_ERROR,
            Errors.MONGO_DB_ERROR,
            Errors.PINECONE_ERROR
        ].includes(error?.extensions?.code as Errors)
    ) {
        return {
            ...error,
            message: 'Something went wrong on our end. Please try again later.'
        };
    }

    return error;
}
