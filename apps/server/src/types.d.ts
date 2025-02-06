import { Menu, Recipe } from 'generated-graphql';

export type Nullable<T> = T | null | undefined;

export type PineconeMetaData = { name: string; passage: string; url: string };

export type Message = {
    author: string;
    message: string;
    menu?: Menu;
    recipes?: Recipe[];
};

export type GenerateMenuResponse = {
    message: string;
    menu: Menu;
};

export type SuggestRecipesResponse = {
    message: string;
    recipes: Recipe[];
};
