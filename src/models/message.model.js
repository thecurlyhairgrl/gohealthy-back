import { Schema, model } from 'mongoose';
const messageSchema = new Schema(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        subject: { type: String, trim: true, maxlength: 150 },
        body: { type: String, required: true, maxlength: 5000 },
        read: { type: Boolean, default: false },
        readAt: Date,
    },
    { timestamps: true, collection: 'messages' }
);
messageSchema.index({ patient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });
export const Message = model('Message', messageSchema);