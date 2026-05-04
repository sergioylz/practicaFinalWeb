import mongoose from 'mongoose';

const deliveryNoteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    format: { type: String, enum: ['material', 'hours'], required: true },
    description: { type: String },
    workDate: { type: Date, required: true },
    material: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    hours: { type: Number },
    workers: [{ name: String, hours: Number }],
    signed: { type: Boolean, default: false },
    signedAt: { type: Date },
    signatureUrl: { type: String },
    pdfUrl: { type: String },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('DeliveryNote', deliveryNoteSchema);