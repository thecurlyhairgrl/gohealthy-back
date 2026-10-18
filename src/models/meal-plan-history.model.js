import { Schema, model } from 'mongoose';
const mealPlanHistorySchema = new Schema(
    {
        mealPlan: { type: Schema.Types.ObjectId, ref: 'MealPlan', required: true },
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        version: { type: Number, required: true, min: 1 },
        snapshot: { type: Schema.Types.Mixed, required: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reason: String,
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, collection:
            'mealPlanHistory'
    }
);
mealPlanHistorySchema.index({ mealPlan: 1, version: -1 });
export const MealPlanHistory = model('MealPlanHistory', mealPlanHistorySchema);
