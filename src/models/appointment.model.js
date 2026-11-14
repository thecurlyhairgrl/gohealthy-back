import { Schema, model } from 'mongoose';
export const APPOINTMENT_MODALITIES = ['in-person', 'video-call'];
// 'requested': el paciente la solicitó y el nutriólogo aún no la acepta
export const APPOINTMENT_STATUSES = ['requested', 'scheduled', 'rescheduled', 'cancelled',
    'completed'];
const appointmentSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        nutritionist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        dateTime: { type: Date, required: true },
        durationMin: { type: Number, default: 60, min: 15 },
        status: { type: String, enum: APPOINTMENT_STATUSES, default: 'scheduled' },
        modality: { type: String, enum: APPOINTMENT_MODALITIES, default: 'in-person' },
        reason: { type: String, trim: true },
        notes: String,
        consultation: { type: Schema.Types.ObjectId, ref: 'Consultation' },
    },
    { timestamps: true, collection: 'appointments' }
);
appointmentSchema.index({ nutritionist: 1, dateTime: 1 });
appointmentSchema.index({ patient: 1, dateTime: -1 });
export const Appointment = model('Appointment', appointmentSchema);