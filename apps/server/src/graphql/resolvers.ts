import * as menuService from '../services/menuService';
import * as recipeService from '../services/recipeService';
import { Resolvers } from '../__generated__/types';

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
    Subscription: {
        time: {
            subscribe: async function* () {
                while (true) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    yield { time: new Date().toISOString() };
                }
            }
        }
    }
};

export default resolvers;
