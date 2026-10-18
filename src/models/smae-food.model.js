import { Schema, model } from 'mongoose';
const smaeFoodSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        groupKey: { type: String, required: true, trim: true, lowercase: true },
        suggestedQuantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, trim: true },
        grossWeightG: { type: Number, min: 0 },
        netWeightG: { type: Number, min: 0 },
        energyKcal: { type: Number, required: true, min: 0 },
        proteinG: { type: Number, required: true, min: 0 },
        lipidsG: { type: Number, required: true, min: 0 },
        carbohydratesG: { type: Number, required: true, min: 0 },
        fiberG: { type: Number, min: 0 },
        sodiumMg: { type: Number, min: 0 },
    },
    { collection: 'smaeFoods' }
);
smaeFoodSchema.index({ name: 'text' }, { default_language: 'spanish' });
smaeFoodSchema.index({ groupKey: 1, name: 1 });
export const SmaeFood = model('SmaeFood', smaeFoodSchema);