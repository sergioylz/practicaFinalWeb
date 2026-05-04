import { logErrorToSlack } from '../services/logger.service.js';

export const errorHandler = async (err, req, res, next) => {
    const status = err.statusCode || 500;

    if (status >= 500) {
        await logErrorToSlack(err, req).catch(console.error);
    }

    res.status(status).json({
        error: true,
        message:
            status >= 500 && process.env.NODE_ENV === 'production'
                ? 'Error interno del servidor'
                : err.message
    });
};
