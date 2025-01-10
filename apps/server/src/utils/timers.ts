import logger from '../utils/logger';

/**
 * @param fn the function that will be timed
 * @returns the same value returned by fn
 */
export function timedFunction<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    logger.info(`The function took: ${end - start} milliseconds`);

    return result;
}

/**
 * @param fn the function that will be timed
 * @returns the same value returned by fn
 */
export async function timedAsyncFunction<T>(fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    logger.info(`The function took: ${end - start} milliseconds`);

    return result;
}
