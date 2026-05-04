import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import {
  register, validateEmail, login, getMe,
  updatePersonal, updateCompany, uploadLogo, deleteUser
} from '../controllers/user.controller.js';

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: 'Juan García' }
 *               email:    { type: string, example: 'juan@test.com' }
 *               password: { type: string, example: 'Test1234!' }
 *     responses:
 *       201: { description: Usuario registrado }
 *       409: { description: Email ya registrado }
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validar email con código
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string, example: '123456' }
 *     responses:
 *       200: { description: Email verificado }
 */
router.put('/validation', authMiddleware, validateEmail);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login y obtención de token JWT
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Token JWT }
 *       401: { description: Credenciales incorrectas }
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del usuario }
 */
router.get('/', authMiddleware, getMe);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Actualizar datos personales
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos actualizados }
 */
router.put('/register', authMiddleware, updatePersonal);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Crear o actualizar compañía
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Compañía guardada }
 */
router.patch('/company', authMiddleware, updateCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo de la compañía
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200: { description: URL del logo }
 */
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar cuenta
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Cuenta eliminada }
 */
router.delete('/', authMiddleware, deleteUser);

export default router;
