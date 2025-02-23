import './setup/config';

import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import mongoose from 'mongoose';
import resolvers from './graphql/resolvers';
import { formatError } from './utils/errors';
import logger from './utils/logger';

(async () => {
    const graphqlPath = '/graphql';

    const app = express();
    const httpServer = createServer(app);

    const graphqlSchemaPath =
        process.env.NODE_ENV === 'LOCAL'
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

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // Create Apollo Server
    const server = new ApolloServer<MyContext>({
        schema,
        plugins: [requestLogPlugin, ApolloServerPluginDrainHttpServer({ httpServer })],
        status400ForVariableCoercionErrors: true, // Fixes bug introduced in Apollo Server 4
        formatError: formatError
    });

    await mongoose.connect('mongodb://127.0.0.1:27017/test');

    await server.start();

    app.use(
        graphqlPath,
        cors({ origin: 'http://localhost:3000', credentials: true }),
        bodyParser.json(),
        expressMiddleware(server)
    );

    const PORT = 4000;
    httpServer.listen(PORT, () => {
        logger.info(`🚀 Server ready at http://localhost:${PORT}${graphqlPath}`);
    });
})();
