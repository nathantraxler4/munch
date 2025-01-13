import './setup/config';

import { readFileSync } from 'fs';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import resolvers from './graphql/resolvers';
import mongoose from 'mongoose';
import logger from './utils/logger';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';


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
    // 2. Start the Apollo Server
    await server.start();

    // 3. Create an Express app
    const app = express();

    // 4. Configure your custom CORS options here
    //    For example, allow only http://localhost:3000
    app.use(
        '/graphql',
        cors({
            origin: 'http://localhost:3000', // Or your domain(s)
            credentials: true,
        }),
        bodyParser.json(),
        // 5. Attach Apollo's middleware (graphql endpoint)
        expressMiddleware(server),
    );

    // 6. Start the Express server
    const PORT = 4000;
    const url = `http://localhost:${PORT}/graphql`;
    app.listen(PORT, () => {
        logger.info(`🚀 Server is running on ${url}`);
    });

})();
