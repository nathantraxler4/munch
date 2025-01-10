import './setup/config';

import { readFileSync } from 'fs';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import resolvers from './graphql/resolvers';
import mongoose from 'mongoose';
import logger from './utils/logger';

(async () => {
    const graphqlSchemaPath =
        process.env.NODE_ENV == 'LOCAL'
            ? './src/graphql/schema.graphql'
            : './dist/graphql/schema.graphql';

    const typeDefs = readFileSync(graphqlSchemaPath, {
        encoding: 'utf-8'
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface MyContext {
        // Define context shared across all resolvers and plugins
    }

    const requestLogPlugin: ApolloServerPlugin<MyContext> = {
        async requestDidStart(requestContext) {
            if (requestContext.request.operationName != 'IntrospectionQuery') {
                logger.info(`Request started!`, { request: requestContext.request });
            }
        }
    };

    // The ApolloServer constructor requires two parameters: your schema
    // definition and your set of resolvers.
    const server = new ApolloServer<MyContext>({
        typeDefs,
        resolvers,
        plugins: [requestLogPlugin],
        status400ForVariableCoercionErrors: true // Fixes bug introduced in Apollo Server 4
    });

    mongoose.connect('mongodb://127.0.0.1:27017/test');

    // Passing an ApolloServer instance to the `startStandaloneServer` function:
    //  1. creates an Express app
    //  2. installs your ApolloServer instance as middleware
    //  3. prepares your app to handle incoming requests
    const { url } = await startStandaloneServer(server, {
        listen: { port: 4000 }
    });

    logger.info(`🚀  Server ready at: ${url}`);
})();
