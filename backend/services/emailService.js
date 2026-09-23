const nodemailer = require('nodemailer');
const dns = require('dns');

// ⚡ FORZAR USO DE IPv4 (evita error ENETUNREACH)
dns.setDefaultResultOrder('ipv4first');

// ===============================
// CONFIGURACIÓN DEL TRANSPORTER
// ===============================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false, // true solo si usas 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ===============================
// VERIFICAR CONEXIÓN
// ===============================
transporter.verify()
  .then(() => {
    console.log('✅ Servidor de email listo para enviar mensajes');
  })
  .catch((error) => {
    console.error('❌ Error configurando email:', error.message);
  });

// ===============================
// ENVIAR CÓDIGO DE RECUPERACIÓN
// ===============================
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado');
    console.log('📧 Para:', email);
    console.log('🆔 Message ID:', info.messageId);

    return { success: true };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};
