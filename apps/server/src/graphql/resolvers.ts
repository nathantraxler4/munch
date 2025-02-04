import { MenuStream, Resolvers } from 'generated-graphql';
import * as menuService from '../services/menuService';
import * as recipeService from '../services/recipeService';

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
    }
};

export default resolvers;
