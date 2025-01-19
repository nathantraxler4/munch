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
        generateMenuFromPrompt: {
          subscribe: async function* (_parent, args) {
            const { prompt } = args;            
            for await (const partialResult of menuService.generateMenuFromPromptStream(prompt)) {
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
          }
        }
    }
};
    


export default resolvers;
