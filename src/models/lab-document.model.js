import { Schema, model } from 'mongoose';
export const DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg',
    'image/png'];
const labDocumentSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        originalName: { type: String, required: true, trim: true },
        storedName: { type: String, required: true, unique: true },
        mimeType: { type: String, required: true, enum: DOCUMENT_MIME_TYPES },
        sizeBytes: { type: Number, required: true, min: 0, max: 10 * 1024 * 1024 },
        description: { type: String, maxlength: 300 },
        studyDate: Date,
    },
    { timestamps: true, collection: 'labDocuments' }
);
labDocumentSchema.index({ patient: 1, createdAt: -1 });
export const LabDocument = model('LabDocument', labDocumentSchema);

