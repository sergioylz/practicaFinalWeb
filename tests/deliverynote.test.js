import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, clearDB, closeDB } from './setup.js';
import DeliveryNote from '../src/models/DeliveryNote.js';

let token;
let clientId;
let projectId;

const setup = async () => {
    await request(app).post('/api/user/register').send({
        name: 'Test', email: 'proj@test.com', password: 'Test1234!'
    });
    const loginRes = await request(app).post('/api/user/login').send({ email: 'proj@test.com', password: 'Test1234!' });
    token = loginRes.body.token;

    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Company', cif: 'A00000001' });

    const loginRes2 = await request(app).post('/api/user/login').send({ email: 'proj@test.com', password: 'Test1234!' });
    token = loginRes2.body.token;

    const clientRes = await request(app).post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'García SA', cif: 'B12345678' });
    clientId = clientRes.body._id;

    const projectRes = await request(app).post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ clientId, name: 'Reforma', projectCode: 'PRJ-001' });
    projectId = projectRes.body._id;
};

beforeAll(async () => { await connectDB(); });
beforeEach(async () => { await setup(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await closeDB(); });

describe('POST /api/project', () => {
    it('crea un proyecto correctamente', async () => {
        const res = await request(app).post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ clientId, name: 'Obra Nueva', projectCode: 'PRJ-002' });
        expect(res.statusCode).toBe(201);
        expect(res.body.projectCode).toBe('PRJ-002');
    });

    it('rechaza código de proyecto duplicado', async () => {
        const res = await request(app).post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ clientId, name: 'Otro', projectCode: 'PRJ-001' });
        expect(res.statusCode).toBe(409);
    });

    it('rechaza cliente que no existe', async () => {
        const res = await request(app).post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ clientId: '000000000000000000000000', name: 'Test', projectCode: 'PRJ-003' });
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /api/deliverynote', () => {
    it('crea un albarán de horas', async () => {
        const res = await request(app).post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ projectId, clientId, format: 'hours', workDate: '2025-06-01T00:00:00.000Z', hours: 8 });
        expect(res.statusCode).toBe(201);
        expect(res.body.format).toBe('hours');
        expect(res.body.signed).toBe(false);
    });

    it('crea un albarán de material', async () => {
        const res = await request(app).post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ projectId, clientId, format: 'material', workDate: '2025-06-01T00:00:00.000Z', material: 'Cemento', quantity: 50, unit: 'kg' });
        expect(res.statusCode).toBe(201);
        expect(res.body.material).toBe('Cemento');
    });
});

describe('DELETE /api/deliverynote/:id', () => {
    it('borra un albarán no firmado', async () => {
        const note = await request(app).post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ projectId, clientId, format: 'hours', workDate: '2025-06-01T00:00:00.000Z', hours: 4 });

        const res = await request(app).delete(`/api/deliverynote/${note.body._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    it('no permite borrar un albarán firmado', async () => {
        const note = await request(app).post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ projectId, clientId, format: 'hours', workDate: '2025-06-01T00:00:00.000Z', hours: 4 });

        await DeliveryNote.findByIdAndUpdate(note.body._id, { signed: true });

        const res = await request(app).delete(`/api/deliverynote/${note.body._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(403);
    });
});

describe('GET /api/deliverynote', () => {
    it('lista albaranes con filtros de fecha', async () => {
        await request(app).post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ projectId, clientId, format: 'hours', workDate: '2025-06-01T00:00:00.000Z', hours: 8 });

        const res = await request(app)
            .get('/api/deliverynote?from=2025-01-01&to=2025-12-31')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });
});
