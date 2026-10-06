```js
// src/shared/services/emailService.js
// 📦 Sprint 20 — Movido de services/emailService.js (sin cambios de paths)
'use strict';

const nodemailer = require('nodemailer');
const dns        = require('dns');

dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   Number.parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls:    { rejectUnauthorized: false },
});

transporter.verify()
  .then(() => console.log('✅ Servidor de email listo para enviar mensajes'))
  .catch((err) => console.error('❌ Error configurando email:', err.message));

exports.sendResetCode = async (email, code, nombre) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Sistema de Gestión" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Código de Recuperación - Vidrios y Aluminios "Alejandro"',
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu código de verificación es:</p>
      <h1 style="letter-spacing:8px;">${code}</h1>
      <p>Este código expira en ${process.env.RESET_CODE_EXPIRATION || 5} minutos.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado · Para:', email, '· ID:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};
```
