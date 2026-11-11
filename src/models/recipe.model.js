import { Schema, model } from 'mongoose';
import { MEAL_TIMES, menuFoodSchema } from './meal-plan.model.js';

const recipeSchema = new Schema(
    {
        // Sin nutriólogo, la receta es compartida (biblioteca inicial)
        nutritionist: { type: Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true, trim: true },
        imageUrl: String,
        mealTimes: [{ type: String, enum: MEAL_TIMES }],
        prepMinutes: { type: Number, min: 0 },
        ingredients: {
            type: [menuFoodSchema],
            validate: {
                validator: (ingredients) =>
                    ingredients.length > 0 &&
                    ingredients.every((item) => item.groupKey && item.equivalents !== undefined),
                message: 'La receta necesita ingredientes con groupKey y equivalents',
            },
        },
        steps: {
            type: [{ type: String, trim: true }],
            validate: {
                validator: (steps) => steps.length > 0 && steps.every((step) => step !== ''),
                message: 'La receta necesita al menos un paso',
            },
        },
    },
    { timestamps: true, collection: 'recipes' }
);
recipeSchema.index({ nutritionist: 1, name: 1 });
export const Recipe = model('Recipe', recipeSchema);
