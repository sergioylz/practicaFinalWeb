import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, clearDB, closeDB } from './setup.js';

let token;

const getToken = async () => {
    await request(app).post('/api/user/register').send({
        name: 'Test User', email: 'client@test.com', password: 'Test1234!'
    });
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${(await request(app).post('/api/user/login').send({ email: 'client@test.com', password: 'Test1234!' })).body.token
        }`).send({ name: 'Test Company', cif: 'A00000001' });

    const res = await request(app).post('/api/user/login').send({
        email: 'client@test.com', password: 'Test1234!'
    });
    return res.body.token;
};

beforeAll(async () => { await connectDB(); });
beforeEach(async () => { token = await getToken(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await closeDB(); });

const clientData = { name: 'García SA', cif: 'B12345678', email: 'garcia@test.com' };

describe('POST /api/client', () => {
    it('crea un cliente correctamente', async () => {
        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('García SA');
        expect(res.body.deleted).toBe(false);
    });

    it('rechaza CIF duplicado', async () => {
        await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
        const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
        expect(res.statusCode).toBe(409);
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).post('/api/client').send(clientData);
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 400 con datos inválidos', async () => {
        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'A' });
        expect(res.statusCode).toBe(400);
    });
});

describe('GET /api/client', () => {
    it('lista clientes con paginación', async () => {
        await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente A', cif: 'B11111111' });
        await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente B', cif: 'B22222222' });

        const res = await request(app).get('/api/client?page=1&limit=10').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.totalItems).toBe(2);
        expect(res.body.totalPages).toBe(1);
    });

    it('filtra por nombre', async () => {
        await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'García SA', cif: 'B11111111' });
        await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'López SL', cif: 'B22222222' });

        const res = await request(app).get('/api/client?name=García').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('García SA');
    });
});

describe('DELETE /api/client/:id', () => {
    it('soft delete archiva el cliente', async () => {
        const created = await request(app).post('/api/client')
            .set('Authorization', `Bearer ${token}`).send(clientData);

        await request(app).delete(`/api/client/${created.body._id}?soft=true`).set('Authorization', `Bearer ${token}`);

        const archived = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`);
        expect(archived.body).toHaveLength(1);

        const active = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
        expect(active.body.totalItems).toBe(0);
    });

    it('hard delete elimina el cliente permanentemente', async () => {
        const created = await request(app).post('/api/client')
            .set('Authorization', `Bearer ${token}`).send(clientData);

        const res = await request(app).delete(`/api/client/${created.body._id}`).set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);

        const archived = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`);
        expect(archived.body).toHaveLength(0);
    });
});

describe('PATCH /api/client/:id/restore', () => {
    it('restaura un cliente archivado', async () => {
        const created = await request(app).post('/api/client')
            .set('Authorization', `Bearer ${token}`).send(clientData);
        await request(app).delete(`/api/client/${created.body._id}?soft=true`).set('Authorization', `Bearer ${token}`);

        const res = await request(app).patch(`/api/client/${created.body._id}/restore`).set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.deleted).toBe(false);
    });
});
