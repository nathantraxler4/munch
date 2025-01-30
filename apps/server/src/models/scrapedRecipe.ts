import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
class Publisher {
    @prop({ required: true })
    name!: string;

    @prop()
    url?: string;

    @prop()
    brand?: string;

    @prop()
    publishingPrinciples?: string;

    @prop({ type: () => [String] })
    sameAs?: string[];
}

@modelOptions({ schemaOptions: { _id: false } })
class AggregateRating {
    @prop()
    ratingValue?: string;

    @prop()
    ratingCount?: string;
}

@modelOptions({ schemaOptions: { _id: false } })
class NutritionInformation {
    @prop()
    calories?: string;

    @prop()
    carbohydrateContent?: string;

    @prop()
    cholesterolContent?: string;

    @prop()
    fiberContent?: string;

    @prop()
    proteinContent?: string;

    @prop()
    saturatedFatContent?: string;

    @prop()
    sodiumContent?: string;

    @prop()
    sugarContent?: string;

    @prop()
    fatContent?: string;

    @prop()
    unsaturatedFatContent?: string;
}

@modelOptions({ schemaOptions: { _id: false } })
class HowToStep {
    @prop({ required: true })
    text!: string;
}

// Main Recipe Model
@modelOptions({ schemaOptions: { collection: 'ScrapedRecipes' } })
class ScrapedRecipe {
    @prop({ required: true })
    headline!: string;

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    url!: string;

    @prop({ required: true, type: () => [String] })
    recipeIngredient!: string[];

    @prop({ required: true, type: () => [HowToStep] })
    recipeInstructions!: HowToStep[];

    @prop()
    datePublished?: string;

    @prop()
    dateModified?: string;

    @prop({ type: () => Publisher })
    publisher?: Publisher;

    @prop({ type: () => AggregateRating })
    aggregateRating?: AggregateRating;

    @prop()
    cookTime?: string;

    @prop({ type: () => NutritionInformation })
    nutrition?: NutritionInformation;

    @prop()
    prepTime?: string;

    @prop({ type: () => [String] })
    recipeCategory?: string[];

    @prop({ type: () => [String] })
    recipeCuisine?: string[];

    @prop({ type: () => [String] })
    recipeYield?: string[];

    @prop()
    totalTime?: string;
}

// Create the model
const ScrapedRecipeModel = getModelForClass(ScrapedRecipe);

// Export the model
export default ScrapedRecipeModel;
