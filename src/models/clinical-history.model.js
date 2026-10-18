import { Schema, model } from 'mongoose';
const addressSchema = new Schema(
    {
        street: String,
        neighborhood: String,
        city: String,
        state: String,
        zipCode: String,
    },
    { _id: false }
);
const familyHistoryItemSchema = new Schema(
    {
        condition: { type: String, required: true, trim: true },
        relationship: { type: String, trim: true },
    },
    { _id: false }
);
const clinicalHistorySchema = new Schema(
    {
        patient: {
            type: Schema.Types.ObjectId, ref: 'User', required: true,
            unique: true
        },
        nutritionist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        identification: {
            birthDate: Date,
            sex: { type: String, enum: ['female', 'male'] },
            maritalStatus: String,
            occupation: String,
            education: String,
            address: addressSchema,
        },
        reasonForVisit: String,
        goals: [String],
        familyHistory: [familyHistoryItemSchema],
        pathologicalHistory: {
            diseases: [String],
            surgeries: [String],
            allergies: [String],
            medications: [String],
        },
        nonPathologicalHistory: {
            smoking: Boolean,
            alcoholConsumption: {
                type: String, enum: ['never', 'occasional',
                    'frequent']
            },
            physicalActivity: String,
            sleepHours: Number,
        },
        eatingHabits: {
            mealsPerDay: Number,
            eatsOut: Boolean,
            preferredFoods: [String],
            dislikedFoods: [String],
        },
        gynecoObstetricHistory: {
            pregnancies: Number,
            lastMenstrualPeriod: Date,
            contraceptiveMethod: String,
        },
    },
    { timestamps: true, collection: 'clinicalHistories' }
);
clinicalHistorySchema.index({ nutritionist: 1 });
export const ClinicalHistory = model('ClinicalHistory', clinicalHistorySchema);