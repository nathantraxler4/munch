// eslint-disable-next-line no-undef
module.exports = {
    overwrite: true,
    schema: './src/graphql/schema.graphql',
    generates: {
        'src/__generated__/types.ts': {
            plugins: ['typescript', 'typescript-resolvers']
        }
    }
};
