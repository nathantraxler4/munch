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
            },
            beta: {
                chat: {
                    completions: {
                        parse: jest.fn(() => Promise.resolve())
                    }
                }
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
const mockParse = openai.beta.chat.completions.parse as jest.Mock;

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

const mockParseResponse = (response: object | null) => {
    mockParse.mockImplementation(() =>
        Promise.resolve({
            choices: [{ message: { parsed: response } }]
        })
    );
};

describe('generateMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('WHEN calling generate recipe with one recipe', () => {
        test('THEN a menu object is returned', async () => {
            mockChatResponse('some chat response');
            mockParseResponse({ descriptions: ['some description 1'] });
            mockImageResponse('some url.');

            const expectedMenu = {
                backgroundImage: 'some url.',
                courses: [{ description: 'some description 1', name: 'name1', url: 'some/url1' }]
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
            mockParseResponse({ descriptions: ['some description 1'] });

            await expect(() => menuService.generateMenu(recipes)).rejects.toThrow(
                'LLM did not respond with appropriate number of recipe descriptions.'
            );
            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN calling generate recipe with 3 recipes and LLM responds with 3 descriptions.', () => {
        test('THEN a menu is inserted', async () => {
            mockChatResponse('["some description1", "some description2", "some description3"]');
            mockParseResponse({
                descriptions: ['some description1', 'some description2', 'some description3']
            });

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

    describe('WHEN LLM responds with null parsed content.', () => {
        test('THEN an error is thrown', async () => {
            mockChatResponse('[]');
            mockImageResponse('');
            mockParseResponse(null);

            await expect(menuService.generateMenu(recipes)).rejects.toThrow(
                'Parsed message is nullish.'
            );

            expect(mockCreate).toHaveBeenCalled();
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

            await expect(menuService.generateMenu(recipes)).rejects.toThrow('API Error');

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN the Image Generation API request fails', () => {
        test('THEN an is thrown', async () => {
            mockChatResponse('[]');
            mockParseResponse({
                descriptions: ['some description1', 'some description2', 'some description3']
            });
            mockImageGenerate.mockImplementation(() => Promise.reject(new Error('API Error')));

            await expect(menuService.generateMenu(recipes)).rejects.toThrow('API Error');

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).not.toHaveBeenCalled();
        });
    });

    describe('WHEN saving the menu to DB fails', () => {
        test('THEN a DATABASE_ERROR is thrown.', async () => {
            mockChatResponse('["some description1"]');
            mockImageResponse('some url.');
            mockParseResponse({
                descriptions: ['some description1']
            });
            mockInsertMany.mockImplementation(() => Promise.reject(new Error('DB Error')));

            await expect(menuService.generateMenu([recipes[0]])).rejects.toThrow('DB Error');

            expect(mockCreate).toHaveBeenCalled();
            expect(mockInsertMany).toHaveBeenCalled();
        });
    });
});
