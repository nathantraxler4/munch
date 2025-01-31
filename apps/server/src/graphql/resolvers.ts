import { MenuStream, Resolvers } from 'generated-graphql';
import { GraphQLError } from 'graphql';
import * as menuService from '../services/menuService';
import * as recipeService from '../services/recipeService';
import { formatError } from '../utils/errors';

import * as orchestrationService from '../services/orchestrationService';

const resolvers: Resolvers = {
    Query: {
        recipes: async () => await recipeService.getRecipes(),
        menus: async () => await menuService.getMenus()
    },
    Mutation: {
        addRecipes: async (_parent, args) => await recipeService.addRecipes(args.recipes),
        promptAgent: async (_parent, args) => await orchestrationService.respond(args.prompt)
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
