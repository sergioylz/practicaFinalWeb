import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { deliveryNoteSchema } from '../validators/index.js';
import {
  createDeliveryNote, listDeliveryNotes, getDeliveryNote,
  downloadPdf, signDeliveryNote, deleteDeliveryNote
} from '../controllers/deliverynote.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un albarán
 *     tags: [DeliveryNotes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       201: { description: Albarán creado }
 *       404: { description: Proyecto no encontrado }
 */
router.post('/', validate(deliveryNoteSchema), createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Listar albaranes con paginación y filtros
 *     tags: [DeliveryNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [hours, material] }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-workDate' }
 *     responses:
 *       200: { description: Lista paginada de albaranes }
 */
router.get('/', listDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Descargar el PDF de un albarán
 *     tags: [DeliveryNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       404: { description: Albarán no encontrado }
 */
router.get('/pdf/:id', downloadPdf);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán con datos completos (populate)
 *     tags: [DeliveryNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán con usuario, cliente y proyecto }
 *       404: { description: No encontrado }
 */
router.get('/:id', getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán con imagen de firma
 *     tags: [DeliveryNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Albarán firmado, PDF generado y subido }
 *       400: { description: Ya estaba firmado }
 *       404: { description: No encontrado }
 */
router.patch('/:id/sign', upload.single('signature'), signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Borrar un albarán (solo si no está firmado)
 *     tags: [DeliveryNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán eliminado }
 *       403: { description: No se puede borrar un albarán firmado }
 *       404: { description: No encontrado }
 */
router.delete('/:id', deleteDeliveryNote);

export default router;
