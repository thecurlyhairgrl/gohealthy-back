import { Schema, model } from 'mongoose';
export const SMAE_CATEGORIES = [
    'vegetables',
    'fruits',
    'cereals',
    'legumes',
    'animal-products',
    'milk',
    'fats',
    'sugars',
    'free-foods',
    'alcohol',
];
const smaeGroupSchema = new Schema(
    {
        key: {
            type: String, required: true, unique: true, trim: true, lowercase:
                true
        },
        category: { type: String, required: true, enum: SMAE_CATEGORIES },
        name: { type: String, required: true, trim: true },
        subgroup: { type: String, trim: true },
        energyKcal: { type: Number, required: true, min: 0 },
        proteinG: { type: Number, required: true, min: 0 },
        lipidsG: { type: Number, required: true, min: 0 },
        carbohydratesG: { type: Number, required: true, min: 0 },
    },
    { collection: 'smaeGroups' }
);
export const SmaeGroup = model('SmaeGroup', smaeGroupSchema);
