import { Resolvers } from 'generated-graphql';
import * as menuService from '../services/menuService';

import * as orchestrationService from '../services/orchestrationService';

const resolvers: Resolvers = {
    Query: {
        menus: async () => await menuService.getMenus()
    },
    Mutation: {
        promptAgent: async (_parent, args) => await orchestrationService.respond(args.prompt)
    }
};

export default resolvers;
