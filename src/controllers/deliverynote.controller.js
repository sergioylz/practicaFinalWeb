import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import { AppError } from '../utils/AppError.js';
import { optimizeImage, uploadToCloud } from '../services/storage.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';

export const createDeliveryNote = async (req, res) => {
    const { projectId, clientId, ...rest } = req.body;
    const companyId = req.user.company._id;

    const project = await Project.findOne({ _id: projectId, company: companyId, deleted: false });
    if (!project) throw new AppError('Proyecto no encontrado', 404);

    const note = await DeliveryNote.create({
        user: req.user._id,
        company: companyId,
        client: clientId,
        project: projectId,
        ...rest
    });

    req.io.to(companyId.toString()).emit('deliverynote:new', note);
    res.status(201).json(note);
};

export const listDeliveryNotes = async (req, res) => {
    const { page = 1, limit = 10, project, client, format, signed, from, to, sort = '-workDate' } = req.query;
    const companyId = req.user.company._id;

    const filter = { company: companyId, deleted: false };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (signed !== undefined) filter.signed = signed === 'true';
    if (from || to) {
        filter.workDate = {};
        if (from) filter.workDate.$gte = new Date(from);
        if (to) filter.workDate.$lte = new Date(to);
    }

    const total = await DeliveryNote.countDocuments(filter);
    const notes = await DeliveryNote.find(filter)
        .populate('client', 'name')
        .populate('project', 'name projectCode')
        .sort(sort)
        .skip((page - 1) * Number(limit))
        .limit(Number(limit));

    res.json({
        data: notes,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
    });
};

export const getDeliveryNote = async (req, res) => {
    const note = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company._id,
        deleted: false
    })
        .populate('user', 'name email')
        .populate('client')
        .populate('project');

    if (!note) throw new AppError('Albarán no encontrado', 404);
    res.json(note);
};

export const downloadPdf = async (req, res) => {
    const note = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company._id
    })
        .populate('user', 'name email')
        .populate('client')
        .populate('project');

    if (!note) throw new AppError('Albarán no encontrado', 404);

    if (note.signed && note.pdfUrl) {
        return res.redirect(note.pdfUrl);
    }

    const pdfBuffer = await generateDeliveryNotePdf(note.toObject());
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="albaran-${note._id}.pdf"`);
    res.send(pdfBuffer);
};

export const signDeliveryNote = async (req, res) => {
    const note = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company._id
    });
    if (!note) throw new AppError('Albarán no encontrado', 404);
    if (note.signed) throw new AppError('El albarán ya está firmado', 409);
    if (!req.file) throw new AppError('No se subió imagen de firma', 400);

    const optimized = await optimizeImage(req.file.buffer);
    const signatureUrl = await uploadToCloud(optimized, 'signatures');

    const populatedNote = await DeliveryNote.findById(note._id)
        .populate('user', 'name email')
        .populate('client')
        .populate('project');

    const pdfBuffer = await generateDeliveryNotePdf({
        ...populatedNote.toObject(),
        signatureUrl,
        signedAt: new Date()
    });
    const pdfUrl = await uploadToCloud(pdfBuffer, 'pdfs');

    const updated = await DeliveryNote.findByIdAndUpdate(
        note._id,
        { signed: true, signedAt: new Date(), signatureUrl, pdfUrl },
        { new: true }
    );

    req.io.to(note.company.toString()).emit('deliverynote:signed', { id: note._id });
    res.json(updated);
};

export const deleteDeliveryNote = async (req, res) => {
    const note = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company._id,
        deleted: false
    });
    if (!note) throw new AppError('Albarán no encontrado', 404);
    if (note.signed) throw new AppError('No se puede borrar un albarán firmado', 409);

    await DeliveryNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Albarán eliminado' });
};
