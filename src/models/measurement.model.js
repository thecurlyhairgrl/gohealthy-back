import { Schema, model } from 'mongoose';
const measurementSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true, default: Date.now },
        weightKg: { type: Number, required: true, min: 0 },
        waistCm: { type: Number, min: 0 },
        hipCm: { type: Number, min: 0 },
        armCm: { type: Number, min: 0 },
        bodyFatPct: { type: Number, min: 0, max: 100 },
        notes: { type: String, maxlength: 500 },
    },
    { timestamps: true, collection: 'measurements' }
);
measurementSchema.index({ patient: 1, date: -1 });
export const Measurement = model('Measurement', measurementSchema)