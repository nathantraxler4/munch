import * as menuService from '../services/menuService';
import * as recipeService from '../services/recipeService';
import { MenuStream, Resolvers } from '../__generated__/types';
import { formatError } from '../utils/errors';
import { GraphQLError } from 'graphql';

const resolvers: Resolvers = {
    Query: {
        recipes: async () => await recipeService.getRecipes(),
        menus: async () => await menuService.getMenus(),
        generateMenu: async (_parent, args) => {
            return await menuService.generateMenu(args.recipes);
        }
    },
    Mutation: {
        addRecipes: async (_parent, args) => await recipeService.addRecipes(args.recipes),
        generateMenuFromPrompt: async (_parent, args) => {
            const menu = await menuService.generateMenuFromPrompt(args.prompt);
            return menu;
        }
    },
    MenuStream: {
        __resolveType(obj: MenuStream) {
            if ('courses' in obj || 'backgroundImage' in obj) {
                return 'PartialMenu';
            }
            if ('message' in obj) {
                return 'StreamError';
            }
            return null; // GraphQLError is thrown
        }
    },
    Subscription: {
        generateMenuFromPrompt: {
            subscribe: async function* (_parent, args) {
                const { prompt } = args;
                try {
                    for await (const partialResult of menuService.generateMenuFromPromptStream(
                        prompt
                    )) {
                        if (typeof partialResult === 'string') {
                            yield {
                                generateMenuFromPrompt: {
                                    backgroundImage: partialResult
                                }
                            };
                        } else {
                            yield {
                                generateMenuFromPrompt: {
                                    courses: partialResult
                                }
                            };
                        }
                    }
                    return;
                } catch (error: unknown) {
                    // Have to yield an error message to the client to know that the connection has been terminate.
                    // Throwing errors in this websocket connection will not propagate to the client the same way as queries and mutations.
                    const { message, extensions } = formatError(error as GraphQLError);
                    yield {
                        generateMenuFromPrompt: {
                            message: message,
                            code: extensions?.code
                        }
                    };
                    // End the stream after yielding the error
                    return;
                }
            }
        }
    }
};

export default resolvers;
