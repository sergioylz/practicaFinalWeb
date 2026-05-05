import mongoose from 'mongoose';

export const connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bildyapp';
    await mongoose.connect(uri);
    console.log('MongoDB conectado');
};
