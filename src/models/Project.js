import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    client:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    name:        { type: String, required: true },
    projectCode: { type: String, required: true },
    address: {
        street:   { type: String },
        number:   { type: String },
        postal:   { type: String },
        city:     { type: String },
        province: { type: String }
    },
    email:   { type: String },
    notes:   { type: String },
    active:  { type: Boolean, default: true },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);