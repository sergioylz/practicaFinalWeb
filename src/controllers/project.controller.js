import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

export const createProject = async (req, res) => {
    const { clientId, name, projectCode, ...rest } = req.body;
    const companyId = req.user.company._id;

    const client = await Client.findOne({ _id: clientId, company: companyId, deleted: false });
    if (!client) throw new AppError('Cliente no encontrado en tu compañía', 404);

    const exists = await Project.findOne({ projectCode, company: companyId });
    if (exists) throw new AppError('Ya existe un proyecto con ese código', 409);

    const project = await Project.create({
        user: req.user._id,
        company: companyId,
        client: clientId,
        name, projectCode,
        ...rest
    });

    req.io.to(companyId.toString()).emit('project:new', project);
    res.status(201).json(project);
};

export const updateProject = async (req, res) => {
    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company._id, deleted: false },
        req.body,
        { new: true }
    );
    if (!project) throw new AppError('Proyecto no encontrado', 404);
    res.json(project);
};

export const listProjects = async (req, res) => {
    const { page = 1, limit = 10, client, name, active, sort = '-createdAt' } = req.query;
    const companyId = req.user.company._id;

    const filter = { company: companyId, deleted: false };
    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
        .populate('client', 'name cif')
        .sort(sort)
        .skip((page - 1) * Number(limit))
        .limit(Number(limit));

    res.json({
        data: projects,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
    });
};

export const getProject = async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        company: req.user.company._id,
        deleted: false
    }).populate('client', 'name cif email');
    if (!project) throw new AppError('Proyecto no encontrado', 404);
    res.json(project);
};

export const deleteProject = async (req, res) => {
    const { id } = req.params;
    const soft = req.query.soft === 'true';
    const companyId = req.user.company._id;

    const project = await Project.findOne({ _id: id, company: companyId });
    if (!project) throw new AppError('Proyecto no encontrado', 404);

    if (soft) {
        await Project.findByIdAndUpdate(id, { deleted: true });
        return res.json({ message: 'Proyecto archivado' });
    }

    await Project.findByIdAndDelete(id);
    res.json({ message: 'Proyecto eliminado permanentemente' });
};

export const listArchivedProjects = async (req, res) => {
    const projects = await Project.find({ company: req.user.company._id, deleted: true })
        .populate('client', 'name');
    res.json(projects);
};

export const restoreProject = async (req, res) => {
    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company._id, deleted: true },
        { deleted: false },
        { new: true }
    );
    if (!project) throw new AppError('Proyecto no encontrado en archivados', 404);
    res.json(project);
};
