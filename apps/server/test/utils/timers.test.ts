import { describe, expect, jest, test } from '@jest/globals';
import logger from '../../src/utils/logger';
import { timedAsyncFunction, timedFunction } from '../../src/utils/timers';

// Mock the logger to test log outputs
jest.mock('../../src/utils/logger');

describe('timedFunction', () => {
    test('should return the correct result from the provided function', () => {
        const mockFn = jest.fn(() => 42); // Mock synchronous function
        const result = timedFunction(mockFn);
        expect(result).toBe(42); // Ensure it returns the correct value
        expect(mockFn).toHaveBeenCalled(); // Ensure the function was called
    });

    test('should log the time taken for the function to execute', () => {
        const mockFn = jest.fn(() => 42); // Mock synchronous function
        timedFunction(mockFn);
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringMatching(/The function took: \d+(\.\d+)? milliseconds/)
        );
    });
});

describe('timedAsyncFunction', () => {
    test('should return the correct result from the provided async function', async () => {
        const mockAsyncFn = jest.fn(async () => 'Hello, async!'); // Mock asynchronous function
        const result = await timedAsyncFunction(mockAsyncFn);
        expect(result).toBe('Hello, async!'); // Ensure it returns the correct value
        expect(mockAsyncFn).toHaveBeenCalled(); // Ensure the function was called
    });

    test('should log the time taken for the async function to execute', async () => {
        const mockAsyncFn = jest.fn(async () => 'Hello, async!'); // Mock asynchronous function
        await timedAsyncFunction(mockAsyncFn);
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringMatching(/The function took: \d+(\.\d+)? milliseconds/)
        );
    });
});
