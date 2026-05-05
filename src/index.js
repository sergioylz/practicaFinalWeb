import 'dotenv/config';
import mongoose from 'mongoose';
import { app, httpServer, io } from './app.js';
import { connectDB } from './config/database.js';

const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log(`Servidor en http://localhost:${PORT}`);
        console.log(`Swagger en http://localhost:${PORT}/api-docs`);
    });
};

const shutdown = async (signal) => {
    console.log(`Señal ${signal} recibida. Cerrando...`);
    httpServer.close(async () => {
        io.close();
        await mongoose.connection.close();
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
    setTimeout(() => { console.error('Forzando cierre'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch(err => { console.error(err); process.exit(1); });
