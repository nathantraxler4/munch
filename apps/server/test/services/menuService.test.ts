import '../../src/setup/config';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as menuService from '../../src/services/menuService';
import openai from '../../src/setup/openai';
import MenuModel from '../../src/models/menu';
import { recipes } from '../mocks/recipes';

// Mock the OpenAI client
jest.mock('../../src/setup/openai', () => {
    return {
        __esModule: true,
        default: {
            chat: {
                completions: {
                    create: jest.fn(() => Promise.resolve())
                }
            },
            images: {
                generate: jest.fn(() => Promise.resolve())
            }
        }
    };
});

// Mock the Mongoose Model
jest.mock('../../src/models/menu', () => {
    return {
        __esModule: true,
        default: {
            insertMany: jest.fn(() => Promise.resolve())
        }
    };
});

const mockCreate = openai.chat.completions.create as jest.Mock;
const mockInsertMany = MenuModel.insertMany as jest.Mock;
const mockImageGenerate = openai.images.generate as jest.Mock;

function mockChatResponse(response: string) {
    mockCreate.mockImplementation(() =>
        Promise.resolve({
            choices: [{ message: { content: response } }]
        })
    );
}

const mockImageResponse = (url: string) => {
    mockImageGenerate.mockImplementation(() =>
        Promise.resolve({
            data: [{ url }]
        })
    );
};

describe('generateMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('WHEN calling generate recipe with one recipe', () => {
        test('THEN a menu object is returned', async () => {
            mockChatResponse('["some description1"]');
            mockImageResponse('some url.');

            const expectedMenu = {
                backgroundImage: 'some url.',
                courses: [{ description: 'some description1', name: 'name1', url: 'some/url1' }]
            };

            const menu = await menuService.generateMenu([recipes[0]]);

            expect(menu).toMatchObject(expectedMenu);
            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).toHaveBeenCalledWith([expectedMenu]);
        });
    });

    describe('WHEN calling generate recipe with 3 recipes and LLM only response with 1 description.', () => {
        test('THEN an error is thrown', async () => {
            mockChatResponse('["some description1"]');

            await expect(() => menuService.generateMenu(recipes)).rejects.toThrow(
                'LLM did not respond with appropriate number of recipe descriptions.'
            );
            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN calling generate recipe with 3 recipes and LLM responds with 3 descriptions.', () => {
        test('THEN an error is thrown', async () => {
            mockChatResponse('["some description1", "some description2", "some description3"]');

            const expectedMenu = {
                backgroundImage: 'some url.',
                courses: [
                    { description: 'some description1', name: 'name1', url: 'some/url1' },
                    { description: 'some description2', name: 'name2', url: 'some/url2' },
                    { description: 'some description3', name: 'name3', url: 'some/url3' }
                ]
            };

            const menu = await menuService.generateMenu(recipes);

            expect(menu).toMatchObject(expectedMenu);
            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).toHaveBeenCalledWith([expectedMenu]);
        });
    });

    describe('WHEN the recipe input is empty', () => {
        test('THEN an empty menu is returned', async () => {
            mockChatResponse('[]');
            mockImageResponse('');

            const menu = await menuService.generateMenu([]);

            expect(menu).toMatchObject({
                courses: [],
                backgroundImage: ''
            });

            expect(mockCreate).toHaveBeenCalled();
        });
    });

    describe('WHEN the LLM responds with malformed JSON', () => {
        test('THEN an LLM_RESPONSE_PARSE_ERROR is thrown', async () => {
            mockChatResponse('Not a JSON string');

            await expect(menuService.generateMenu(recipes)).rejects.toThrow(
                'Content does not contain a valid JSON array. Content received: "Not a JSON string"'
            );

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN the LLM responds with array that is not valid JSON', () => {
        test('THEN an LLM_RESPONSE_PARSE_ERROR is thrown', async () => {
            mockChatResponse('[this is not json]');

            await expect(menuService.generateMenu(recipes)).rejects.toThrow(
                'Failed to parse LLM Response as JSON. Content received: "[this is not json]"'
            );

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN the chat completion does not have content', () => {
        test('THEN an LLM_RESPONSE_PARSE_ERROR is thrown', async () => {
            mockCreate.mockImplementation(() =>
                Promise.resolve({
                    choices: [
                        {
                            message: {}
                        }
                    ]
                })
            );

            await expect(menuService.generateMenu(recipes)).rejects.toThrow(
                'LLM response has no content.'
            );

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN the LLM API request fails', () => {
        test('THEN an LLM_API_ERROR is thrown', async () => {
            mockCreate.mockImplementation(() => Promise.reject(new Error('API Error')));

            await expect(menuService.generateMenu(recipes)).rejects.toThrow(
                'An error occurred requesting LLM API. Error: Error: API Error'
            );

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN the Image Generation API request fails', () => {
        test('THEN an is thrown', async () => {
            mockChatResponse('[]');
            mockImageGenerate.mockImplementation(() => Promise.reject(new Error('API Error')));

            await expect(menuService.generateMenu(recipes)).rejects.toThrow(
                'An error occurred requesting Text-to-Image API.'
            );

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN saving the menu to DB fails', () => {
        test('THEN a DATABASE_ERROR is thrown.', async () => {
            mockChatResponse('["some description1"]');
            mockImageResponse('some url.');
            mockInsertMany.mockImplementation(() => Promise.reject(new Error('DB Error')));

            await expect(menuService.generateMenu([recipes[0]])).rejects.toThrow(
                `Failed to insert menus into MongoDB. Menus: "${[recipes[0]]}" Error: Error: DB Error`
            );

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).toHaveBeenCalled();
        });
    });
});
