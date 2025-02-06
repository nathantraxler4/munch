import { Menu, Recipe } from 'generated-graphql';

export type Message = { author: string; message: string; menu?: Menu; recipes?: Recipe[] };
