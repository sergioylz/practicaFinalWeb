import multer from 'multer';
import { AppError } from '../utils/AppError.js';

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new AppError('Solo se permiten imágenes', 400));
        }
        cb(null, true);
    }
});
