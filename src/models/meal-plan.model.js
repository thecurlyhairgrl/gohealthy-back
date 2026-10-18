import { Schema, model } from 'mongoose';
export const MEAL_TIMES = ['breakfast', 'morning-snack', 'lunch', 'afternoonsnack', 'dinner'];
export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'];
const equivalentSchema = new Schema(
    {
        groupKey: { type: String, required: true, trim: true, lowercase: true },
        quantity: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);
const distributionSchema = new Schema(
    {
        mealTime: { type: String, enum: MEAL_TIMES, required: true },
        equivalents: [equivalentSchema],
    },
    { _id: false }
);
const menuFoodSchema = new Schema(
    {
        food: { type: Schema.Types.ObjectId, ref: 'SmaeFood' },
        name: { type: String, required: true, trim: true },
        groupKey: { type: String, trim: true, lowercase: true },
        equivalents: { type: Number, min: 0 },
        quantity: { type: Number, min: 0 },
        unit: { type: String, trim: true },
    },
    { _id: false }
);
const mealSchema = new Schema(
    {
        mealTime: { type: String, enum: MEAL_TIMES, required: true },
        foods: [menuFoodSchema],
        preparation: String,
    },
    { _id: false }
);
const daySchema = new Schema(
    {
        day: { type: String, enum: WEEK_DAYS, required: true },
        meals: [mealSchema],
    },
    { _id: false }
);
const mealPlanSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        nutritionist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, trim: true },
        active: { type: Boolean, default: true },
        version: { type: Number, default: 1, min: 1 },
        startDate: { type: Date, default: Date.now },
        targetKcal: { type: Number, min: 0 },
        distribution: [distributionSchema],
        menu: [daySchema],
        notes: String,
    },
    { timestamps: true, collection: 'mealPlans' }
);
mealPlanSchema.index({ patient: 1 }, {
    unique: true, partialFilterExpression: {
        active: true
    }
});
mealPlanSchema.index({ patient: 1, createdAt: -1 });
export const MealPlan = model('MealPlan', mealPlanSchema);
