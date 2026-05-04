import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    name: {type: String, required: true},
    cif: {type: String},
    address: {type: String},
    phone: {type: String},
    email: {type: String},
    logoUrl: {type: String}
}, {timestamps: true});

export default mongoose.model('Company', companySchema);