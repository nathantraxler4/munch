import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: 'Recipe' }
})
class RecipeClass {
    @prop({ required: true })
    name!: string;

    @prop()
    ingredients!: string;

    @prop()
    directions!: string;
}

const RecipeModel = getModelForClass(RecipeClass);

export default RecipeModel;
