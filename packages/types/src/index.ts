import { Menu, Recipe } from 'generated-graphql';

export enum Author {
    USER = 'user',
    SOUS_CHEF = 'sous_chef'
}

export type Message = { id: number, author: Author; message: string; menu?: Menu; recipes?: Recipe[] };
