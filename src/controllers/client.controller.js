import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

export const createClient = async (req, res) => {
    const { name, cif, email, phone, address } = req.body;
    const companyId = req.user.company._id;

    const existing = await Client.findOne({ cif, company: companyId, deleted: false });
    if (existing) throw new AppError('Ya existe un cliente con ese CIF en tu compañía', 409);

    const client = await Client.create({
        user: req.user._id,
        company: companyId,
        name, cif, email, phone, address
    });

    req.io.to(companyId.toString()).emit('client:new', client);
    res.status(201).json(client);
};

export const updateClient = async (req, res) => {
    const companyId = req.user.company._id;

    const client = await Client.findOneAndUpdate(
        { _id: req.params.id, company: companyId, deleted: false },
        req.body,
        { new: true }
    );
    if (!client) throw new AppError('Cliente no encontrado', 404);
    res.json(client);
};

export const listClients = async (req, res) => {
    const { page = 1, limit = 10, name, sort = 'createdAt' } = req.query;
    const companyId = req.user.company._id;

    const filter = { company: companyId, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
        .sort(sort)
        .skip((page - 1) * Number(limit))
        .limit(Number(limit));

    res.json({
        data: clients,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
    });
};

export const getClient = async (req, res) => {
    const client = await Client.findOne({
        _id: req.params.id,
        company: req.user.company._id,
        deleted: false
    });
    if (!client) throw new AppError('Cliente no encontrado', 404);
    res.json(client);
};

export const deleteClient = async (req, res) => {
    const { id } = req.params;
    const soft = req.query.soft === 'true';
    const companyId = req.user.company._id;

    const client = await Client.findOne({ _id: id, company: companyId });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    if (soft) {
        await Client.findByIdAndUpdate(id, { deleted: true });
        return res.json({ message: 'Cliente archivado' });
    }

    await Client.findByIdAndDelete(id);
    res.json({ message: 'Cliente eliminado permanentemente' });
};

export const listArchivedClients = async (req, res) => {
    const clients = await Client.find({ company: req.user.company._id, deleted: true });
    res.json(clients);
};

export const restoreClient = async (req, res) => {
    const client = await Client.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company._id, deleted: true },
        { deleted: false },
        { new: true }
    );
    if (!client) throw new AppError('Cliente no encontrado en archivados', 404);
    res.json(client);
};
