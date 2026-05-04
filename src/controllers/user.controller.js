import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import { sendVerificationEmail } from '../services/mail.service.js';
import { uploadToCloud, optimizeImage } from '../services/storage.service.js';

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) throw new AppError('El email ya está registrado', 409);

    const code = crypto.randomInt(100000, 999999).toString();
    const user = await User.create({ name, email, password, verificationCode: code });

    await sendVerificationEmail(email, code).catch(console.error);

    res.status(201).json({ message: 'Usuario registrado. Verifica tu email.', userId: user._id });
};

export const validateEmail = async (req, res) => {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (user.verificationCode !== code) throw new AppError('Código inválido', 400);

    user.verified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: 'Email verificado correctamente' });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email, deleted: false }).populate('company');
    if (!user) throw new AppError('Credenciales incorrectas', 401);

    const valid = await user.comparePassword(password);
    if (!valid) throw new AppError('Credenciales incorrectas', 401);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, company: user.company } });
};

export const getMe = async (req, res) => {
    res.json(req.user);
};

export const updatePersonal = async (req, res) => {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true });
    res.json(user);
};

export const updateCompany = async (req, res) => {
    const { name, cif, address, phone, email } = req.body;

    let company = await Company.findOne({ owner: req.user._id });

    if (company) {
        company = await Company.findByIdAndUpdate(company._id, { name, cif, address, phone, email }, { new: true });
    } else {
        company = await Company.create({ owner: req.user._id, name, cif, address, phone, email });
        await User.findByIdAndUpdate(req.user._id, { company: company._id });
    }

    res.json(company);
};

export const uploadLogo = async (req, res) => {
    if (!req.file) throw new AppError('No se subió ningún archivo', 400);

    const optimized = await optimizeImage(req.file.buffer);
    const logoUrl = await uploadToCloud(optimized, 'logos');

    const company = await Company.findOneAndUpdate(
        { owner: req.user._id },
        { logoUrl },
        { new: true }
    );

    res.json({ logoUrl: company.logoUrl });
};

export const deleteUser = async (req, res) => {
    const soft = req.query.soft !== 'false';

    if (soft) {
        await User.findByIdAndUpdate(req.user._id, { deleted: true });
        return res.json({ message: 'Cuenta eliminada' });
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Cuenta eliminada permanentemente' });
};
