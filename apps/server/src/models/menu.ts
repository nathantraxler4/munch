import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: 'Menu' }
})
class MenuClass {
    @prop({ required: true })
    backgroundImage!: string;

    @prop({ required: true, type: () => CourseClass })
    courses!: CourseClass[];
}

class CourseClass {
    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    description!: string;

    @prop({ required: true })
    url!: string;
}

const MenuModel = getModelForClass(MenuClass);

export default MenuModel;
