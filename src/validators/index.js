import { z } from 'zod';

export const clientSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    cif: z.string().min(9, 'CIF demasiado corto'),
    email: z.string().email('Email inválido').optional(),
    phone: z.string().optional(),
    address: z.object({
        street: z.string(),
        number: z.string().optional(),
        postal: z.string(),
        city: z.string(),
        province: z.string()
    }).optional()
});

export const projectSchema = z.object({
    clientId: z.string().min(1, 'El cliente es obligatorio'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    projectCode: z.string().min(1, 'El código de proyecto es obligatorio'),
    address: z.object({
        street: z.string(),
        number: z.string().optional(),
        postal: z.string(),
        city: z.string(),
        province: z.string()
    }).optional(),
    email: z.string().email().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional()
});

export const deliveryNoteSchema = z.object({
    projectId: z.string().min(1, 'El proyecto es obligatorio'),
    clientId: z.string().min(1, 'El cliente es obligatorio'),
    format: z.enum(['material', 'hours']),
    description: z.string().optional(),
    workDate: z.string().min(1, 'La fecha de trabajo es obligatoria'),
    material: z.string().optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
    hours: z.number().positive().optional(),
    workers: z.array(z.object({ name: z.string(), hours: z.number() })).optional()
});

export const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6)
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});
