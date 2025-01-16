import './setup/config';
import { readFileSync } from 'fs';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { Errors } from './utils/errors';
import resolvers from './graphql/resolvers';
import mongoose from 'mongoose';
import logger from './utils/logger';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

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
        formatError: (formattedError) => {
            // Custom error formatting
            if (
                formattedError?.extensions?.code === ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED
            ) {
                return {
                    ...formattedError,
                    message: "Your query doesn't match the schema. Try double-checking it!"
                };
            }

            if (formattedError?.extensions?.code === Errors.LLM_RESPONSE_PARSE_ERROR) {
                return {
                    ...formattedError,
                    message: 'The AI had trouble with that one. Please try again!'
                };
            }

            if (
                [
                    Errors.LLM_API_ERROR,
                    Errors.IMAGE_GEN_API_ERROR,
                    Errors.MONGO_DB_ERROR,
                    Errors.PINECONE_ERROR
                ].includes(formattedError?.extensions?.code as Errors)
            ) {
                return {
                    ...formattedError,
                    message: 'Something went wrong on our end. Please try again later.'
                };
            }

            return formattedError;
        }
    });

    await mongoose.connect('mongodb://127.0.0.1:27017/test');

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: graphqlPath // <— same path as HTTP
    });

    const serverCleanup = useServer({ schema }, wsServer);

    server.addPlugin({
        async serverWillStart() {
            return {
                async drainServer() {
                    await serverCleanup.dispose();
                }
            };
        }
    });

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
        logger.info(`🚀 Subscriptions ready at ws://localhost:${PORT}${graphqlPath}`);
    });
})();
