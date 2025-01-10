import { GraphQLError } from 'graphql';
import logger from './logger';

export enum Errors {
    LLM_RESPONSE_MISSING_CONTENT,
    LLM_RESPONSE_PARSE_ERROR,
    LLM_API_ERROR,
    IMAGE_GEN_API_ERROR,
    MONGO_DB_ERROR,
    PINECONE_ERROR
}

/**
 *
 */
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
    throw new GraphQLError(errorMessage, { extensions: { code } });
}
