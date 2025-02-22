import { Menu, Recipe } from 'generated-graphql';

export type Message = { id: number, author: string; message: string; menu?: Menu; recipes?: Recipe[] };
