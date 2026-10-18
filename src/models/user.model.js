import { Schema, model } from 'mongoose';
export const ROLES = ['nutritionist', 'patient'];
const passwordResetSchema = new Schema(
    {
        otpHash: String,
        expiresAt: Date,
        attempts: { type: Number, default: 0 },
    },
    { _id: false }
);
const userSchema = new Schema(
    {
        firstName: { type: String, required: true, trim: true },
        paternalLastName: { type: String, required: true, trim: true },
        maternalLastName: { type: String, trim: true },
        email: {
            type: String, required: true, unique: true, lowercase: true, trim:
                true
        },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ROLES, required: true },
        phone: { type: String, trim: true },
        professionalLicense: { type: String, trim: true },
        nutritionist: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: function () {
                return this.role === 'patient';
            },
        },
        mustChangePassword: { type: Boolean, default: false },
        onboardingCompleted: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
        passwordReset: { type: passwordResetSchema, select: false },
    },
    { timestamps: true, collection: 'users' }
);
userSchema.index({ nutritionist: 1, paternalLastName: 1 });
export const User = model('User', userSchema);
