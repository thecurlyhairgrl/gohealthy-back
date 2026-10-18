import { Schema, model } from 'mongoose';
const consultationMeasurementsSchema = new Schema(
    {
        weightKg: { type: Number, min: 0 },
        heightCm: { type: Number, min: 0 },
        bmi: { type: Number, min: 0 },
        waistCm: { type: Number, min: 0 },
        hipCm: { type: Number, min: 0 },
        bodyFatPct: { type: Number, min: 0, max: 100 },
        systolicPressure: { type: Number, min: 0 },
        diastolicPressure: { type: Number, min: 0 },
    },
    { _id: false }
);
const energyCalculationSchema = new Schema(
    {
        formula: {
            type: String, enum: ['harris-benedict', 'mifflin-st-jeor'],
            default: 'harris-benedict'
        },
        activityFactor: { type: Number, min: 1 },
        basalEnergyExpenditure: { type: Number, min: 0 },
        totalEnergyExpenditure: { type: Number, min: 0 },
        targetKcal: { type: Number, min: 0 },
    },
    { _id: false }
);
const consultationSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        nutritionist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        date: { type: Date, required: true, default: Date.now },
        measurements: consultationMeasurementsSchema,
        energyCalculation: energyCalculationSchema,
        diagnosis: String,
        prognosis: String,
        instructions: String,
        notes: String,
    },
    { timestamps: true, collection: 'consultations' }
);
consultationSchema.index({ patient: 1, date: -1 });
export const Consultation = model('Consultation', consultationSchema);
