import { Schema, model } from 'mongoose';
const wellnessSurveySchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        mood: { type: Number, required: true, min: 1, max: 5 },
        sleepHours: { type: Number, required: true, min: 0, max: 24 },
        waterGlasses: { type: Number, required: true, min: 0, max: 30 },
        activityMinutes: { type: Number, required: true, min: 0, max: 1440 },
        planAdherence: { type: Number, required: true, min: 0, max: 100 },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true, collection: 'wellnessSurveys' }
);
wellnessSurveySchema.index({ patient: 1, date: 1 }, { unique: true });
export const WellnessSurvey = model('WellnessSurvey', wellnessSurveySchema);