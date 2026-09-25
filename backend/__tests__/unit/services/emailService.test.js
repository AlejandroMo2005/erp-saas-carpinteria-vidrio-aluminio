import { describe, expect, it, vi, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);
const originalLoad = Module._load;

const sendMail = vi.fn();
const verify = vi.fn().mockResolvedValue(true);

const transporter = {
  sendMail,
  verify,
};

const nodemailer = {
  createTransport: vi.fn(() => transporter),
};

const emailServicePath = require.resolve(
  `${process.cwd()}/src/shared/services/emailService.js`
);

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const consoleLog = vi.fn();
const consoleError = vi.fn();

console.log = consoleLog;
console.error = consoleError;

Module._load = function (request, parent, isMain) {
  if (request === 'nodemailer') {
    return nodemailer;
  }

  return originalLoad.call(this, request, parent, isMain);
};

delete require.cache[emailServicePath];

const emailService = require(emailServicePath);

Module._load = originalLoad;

describe('services/emailService', () => {
  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  describe('configuración del transporter', () => {
    it('debe crear el transporter SMTP con la configuración esperada', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    });

    it('debe verificar el transporter al cargar el servicio', () => {
      expect(transporter.verify).toHaveBeenCalledTimes(1);
    });

    it('debe registrar el mensaje cuando la verificación del transporter es exitosa', async () => {
      await Promise.resolve();

      expect(consoleLog).toHaveBeenCalledWith(
        '✅ Servidor de email listo para enviar mensajes'
      );
    });

    it('debe ejecutar el catch cuando falla la verificación del transporter', async () => {
      const error = new Error('SMTP configuration error');

      const isolatedVerify = vi.fn().mockRejectedValue(error);

      const isolatedTransporter = {
        sendMail: vi.fn(),
        verify: isolatedVerify,
      };

      const isolatedNodemailer = {
        createTransport: vi.fn(() => isolatedTransporter),
      };

      Module._load = function (request, parent, isMain) {
        if (request === 'nodemailer') {
          return isolatedNodemailer;
        }

        return originalLoad.call(this, request, parent, isMain);
      };

      delete require.cache[emailServicePath];

      require(emailServicePath);

      Module._load = originalLoad;

      await new Promise((resolve) => setImmediate(resolve));

      expect(isolatedVerify).toHaveBeenCalledTimes(1);

      expect(consoleError).toHaveBeenCalledWith(
        '❌ Error configurando email:',
        'SMTP configuration error'
      );

      delete require.cache[emailServicePath];

      Module._load = function (request, parent, isMain) {
        if (request === 'nodemailer') {
          return nodemailer;
        }

        return originalLoad.call(this, request, parent, isMain);
      };

      require(emailServicePath);

      Module._load = originalLoad;
    });
  });

  describe('sendResetCode', () => {
    it('debe enviar correctamente el código de recuperación', async () => {
      sendMail.mockReset();

      sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      const resultado = await emailService.sendResetCode(
        'cliente@example.com',
        '123456',
        'Alejandro'
      );

      expect(resultado).toEqual({
        success: true,
      });

      expect(sendMail).toHaveBeenCalledTimes(1);

      const [mailOptions] = sendMail.mock.calls[0];

      expect(mailOptions).toMatchObject({
        from:
          process.env.EMAIL_FROM ||
          `"Sistema de Gestión" <${process.env.EMAIL_USER}>`,
        to: 'cliente@example.com',
        subject:
          '🔐 Código de Recuperación - Vidrios y Aluminios "Alejandro"',
      });

      expect(mailOptions.html).toContain(
        '<p>Hola <strong>Alejandro</strong>,</p>'
      );

      expect(mailOptions.html).toContain(
        '<h1 style="letter-spacing:8px;">123456</h1>'
      );

      expect(mailOptions.html).toContain(
        `Este código expira en ${
          process.env.RESET_CODE_EXPIRATION || 5
        } minutos.`
      );
    });

    it('debe propagar el error cuando sendMail falla', async () => {
      sendMail.mockReset();

      const error = new Error('SMTP unavailable');

      sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendResetCode(
          'cliente@example.com',
          '654321',
          'María'
        )
      ).rejects.toBe(error);

      expect(sendMail).toHaveBeenCalledTimes(1);
    });

    it('debe utilizar EMAIL_FROM y RESET_CODE_EXPIRATION personalizados', async () => {
      const previousFrom = process.env.EMAIL_FROM;
      const previousExpiration = process.env.RESET_CODE_EXPIRATION;

      process.env.EMAIL_FROM = 'Sistema <no-reply@example.com>';
      process.env.RESET_CODE_EXPIRATION = '10';

      try {
        sendMail.mockReset();

        sendMail.mockResolvedValue({
          messageId: 'custom-message-id',
        });

        const resultado = await emailService.sendResetCode(
          'usuario@example.com',
          '998877',
          'Carlos'
        );

        expect(resultado).toEqual({
          success: true,
        });

        const [mailOptions] = sendMail.mock.calls[0];

        expect(mailOptions.from).toBe(
          'Sistema <no-reply@example.com>'
        );

        expect(mailOptions.html).toContain(
          'Este código expira en 10 minutos.'
        );
      } finally {
        if (previousFrom === undefined) {
          delete process.env.EMAIL_FROM;
        } else {
          process.env.EMAIL_FROM = previousFrom;
        }

        if (previousExpiration === undefined) {
          delete process.env.RESET_CODE_EXPIRATION;
        } else {
          process.env.RESET_CODE_EXPIRATION = previousExpiration;
        }
      }
    });
  });
});
