import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../validators/index.js';
import {
  createClient, updateClient, listClients, getClient,
  deleteClient, listArchivedClients, restoreClient
} from '../controllers/client.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear un cliente
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201: { description: Cliente creado }
 *       409: { description: CIF duplicado en la compañía }
 */
router.post('/', validate(clientSchema), createClient);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Listar clientes archivados
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Clientes con soft delete }
 */
router.get('/archived', listArchivedClients);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     summary: Restaurar un cliente archivado
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente restaurado }
 *       404: { description: No encontrado en archivados }
 */
router.patch('/:id/restore', restoreClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Listar clientes con paginación y filtros
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Búsqueda parcial por nombre
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: 'createdAt' }
 *     responses:
 *       200: { description: Lista paginada de clientes }
 */
router.get('/', listClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener un cliente concreto
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del cliente }
 *       404: { description: No encontrado }
 */
router.get('/:id', getClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200: { description: Cliente actualizado }
 */
router.put('/:id', validate(clientSchema), updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Eliminar o archivar un cliente
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean }
 *         description: true = archivar, false/omitir = borrar permanentemente
 *     responses:
 *       200: { description: Cliente eliminado o archivado }
 *       404: { description: No encontrado }
 */
router.delete('/:id', deleteClient);

export default router;
