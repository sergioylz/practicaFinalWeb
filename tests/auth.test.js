import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, clearDB, closeDB } from './setup.js';

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await closeDB(); });

describe('POST /api/user/register', () => {
    it('registra un usuario correctamente', async () => {
        const res = await request(app).post('/api/user/register').send({
            name: 'Test User', email: 'test@test.com', password: 'Test1234!'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.userId).toBeDefined();
    });

    it('rechaza email duplicado', async () => {
        const data = { name: 'Test', email: 'dup@test.com', password: 'Test1234!' };
        await request(app).post('/api/user/register').send(data);
        const res = await request(app).post('/api/user/register').send(data);
        expect(res.statusCode).toBe(409);
    });

    it('rechaza datos inválidos (sin email)', async () => {
        const res = await request(app).post('/api/user/register').send({ name: 'Test', password: '123' });
        expect(res.statusCode).toBe(400);
    });
});

describe('POST /api/user/login', () => {
    beforeEach(async () => {
        await request(app).post('/api/user/register').send({
            name: 'Test', email: 'login@test.com', password: 'Test1234!'
        });
    });

    it('devuelve token JWT con credenciales correctas', async () => {
        const res = await request(app).post('/api/user/login').send({
            email: 'login@test.com', password: 'Test1234!'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('rechaza contraseña incorrecta', async () => {
        const res = await request(app).post('/api/user/login').send({
            email: 'login@test.com', password: 'wrongpass'
        });
        expect(res.statusCode).toBe(401);
    });
});
