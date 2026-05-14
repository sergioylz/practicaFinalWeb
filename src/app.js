import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';

import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import User from './models/User.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, { cors: { origin: '*' } });

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No autorizado'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch {
        next(new Error('Token inválido'));
    }
});

io.on('connection', async (socket) => {
    const user = await User.findById(socket.userId).populate('company');
    if (!user?.company) return socket.disconnect();
    const room = user.company._id.toString();
    socket.join(room);
    socket.on('disconnect', () => socket.leave(room));
});

app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Demasiadas peticiones' }));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

app.use((req, res, next) => { req.io = io; next(); });

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    res.json({
        status: 'ok',
        db: dbState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use('/api', routes);

app.use(errorHandler);

export { app, httpServer, io };
