import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({
    schemaOptions: { timestamps: true, collection: 'Recipes' },
    options: { customName: 'Recipe' }
})
class RecipeClass {
    @prop({ required: true })
    name!: string;

    @prop({ required: true, type: () => [String] })
    ingredients!: string[];

    @prop({ required: true, type: () => [String] })
    instructions!: string[];

    @prop({ required: true })
    url!: string;
}

const RecipeModel = getModelForClass(RecipeClass);

export default RecipeModel;
