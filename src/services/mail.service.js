import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 2525,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const sendVerificationEmail = async (to, code) => {
    if (process.env.NODE_ENV === 'test') return;

    await transporter.sendMail({
        from: '"BildyApp" <noreply@bildyapp.com>',
        to,
        subject: 'Verifica tu cuenta en BildyApp',
        html: `
        <h2>Bienvenido a BildyApp</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="letter-spacing:4px">${code}</h1>
        <p>Este código caduca en 10 minutos.</p>
    `
    });
};
