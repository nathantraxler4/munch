// eslint-disable-next-line no-undef
module.exports = {
    overwrite: true,
    schema: './src/graphql/schema.graphql',
    generates: {
        '../../packages/generated-graphql/src/types.ts': {
            plugins: ['typescript', 'typescript-resolvers']
        }
    }
};
