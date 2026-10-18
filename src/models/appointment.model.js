import { Schema, model } from 'mongoose';
export const APPOINTMENT_STATUSES = ['scheduled', 'rescheduled', 'cancelled',
    'completed'];
const appointmentSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        nutritionist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        dateTime: { type: Date, required: true },
        durationMin: { type: Number, default: 60, min: 15 },
        status: { type: String, enum: APPOINTMENT_STATUSES, default: 'scheduled' },
        reason: { type: String, trim: true },
        notes: String,
        consultation: { type: Schema.Types.ObjectId, ref: 'Consultation' },
    },
    { timestamps: true, collection: 'appointments' }
);
appointmentSchema.index({ nutritionist: 1, dateTime: 1 });
appointmentSchema.index({ patient: 1, dateTime: -1 });
export const Appointment = model('Appointment', appointmentSchema);