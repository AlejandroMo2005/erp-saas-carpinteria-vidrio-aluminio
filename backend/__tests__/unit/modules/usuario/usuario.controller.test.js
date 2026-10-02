import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Usuario = {
  getById: vi.fn(),
  getByEmail: vi.fn(),
  validatePassword: vi.fn(),
  updatePerfil: vi.fn(),
  findByNombre: vi.fn(),
  create: vi.fn(),
};

const logger = {
  info: vi.fn(),
  error: vi.fn(),
};

const db = {
  query: vi.fn(),
};

const loggerPath = require.resolve(
  `${process.cwd()}/src/shared/utils/logger.js`
);
require.cache[loggerPath] = {
  id: loggerPath,
  filename: loggerPath,
  loaded: true,
  exports: logger,
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === './usuario.repository') return Usuario;
  if (request === '../../../shared/utils/logger') return logger;
  if (request === '../../config/database.js') return db;

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/usuario/usuario.controller.js`
);

Module._load = originalLoad;

function createRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createReq(overrides = {}) {
  return {
    user: {
      id: 1,
      email: 'usuario@test.com',
    },
    empresaId: 10,
    body: {},
    query: {},
    params: {},
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usuario.controller', () => {
  describe('getMe', () => {
    it('devuelve el usuario autenticado', async () => {
      const usuario = { id: 1, nombre: 'Juan' };
      Usuario.getById.mockResolvedValue(usuario);

      const req = createReq();
      const res = createRes();

      await controller.getMe(req, res);

      expect(Usuario.getById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: usuario,
      });
    });

    it('devuelve 404 si el usuario no existe', async () => {
      Usuario.getById.mockResolvedValue(null);

      const res = createRes();

      await controller.getMe(createReq(), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado',
      });
    });

    it('devuelve 500 cuando ocurre un error', async () => {
      Usuario.getById.mockRejectedValue(new Error('DB error'));

      const res = createRes();

      await controller.getMe(createReq(), res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateMe', () => {
    it('rechaza una cédula inválida', async () => {
      const req = createReq({
        body: { cedula_ruc: '123' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'cedula_ruc debe ser cédula (10) o RUC (13) ecuatoriano',
      });
    });

    it('acepta una cédula_ruc vacía', async () => {
      Usuario.updatePerfil.mockResolvedValue({ id: 1 });

      const req = createReq({
        body: {
          nombre_completo: 'Juan Pérez',
          cedula_ruc: '',
        },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(Usuario.updatePerfil).toHaveBeenCalledWith(
        1,
        {
          nombre_completo: 'Juan Pérez',
          cedula_ruc: '',
        },
        null
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('acepta una cédula de 10 dígitos', async () => {
      Usuario.updatePerfil.mockResolvedValue({ id: 1 });

      const req = createReq({
        body: { cedula_ruc: '1234567890' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(Usuario.updatePerfil).toHaveBeenCalledWith(
        1,
        { cedula_ruc: '1234567890' },
        null
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('acepta un RUC terminado en 001', async () => {
      Usuario.updatePerfil.mockResolvedValue({ id: 1 });

      const req = createReq({
        body: { cedula_ruc: '1234567890001' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rechaza un RUC de 13 dígitos que no termina en 001', async () => {
      const req = createReq({
        body: { cedula_ruc: '1234567890123' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza un email inválido', async () => {
      const req = createReq({
        body: { email: 'correo-invalido' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El formato del email no es válido',
      });
    });

    it('rechaza cambio de contraseña sin contraseña actual', async () => {
      const req = createReq({
        body: {
          password: 'nueva123',
        },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Debes proporcionar tu contraseña actual para cambiarla',
      });
    });

    it('rechaza contraseña actual incorrecta', async () => {
      Usuario.getByEmail.mockResolvedValue({
        id: 1,
        password: 'hash',
      });
      Usuario.validatePassword.mockResolvedValue(false);

      const req = createReq({
        body: {
          password: 'nueva123',
          passwordActual: 'incorrecta',
        },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(Usuario.validatePassword).toHaveBeenCalledWith(
        'incorrecta',
        'hash'
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza nueva contraseña menor a 6 caracteres', async () => {
      Usuario.getByEmail.mockResolvedValue({
        id: 1,
        password: 'hash',
      });
      Usuario.validatePassword.mockResolvedValue(true);

      const req = createReq({
        body: {
          password: '12345',
          passwordActual: 'correcta',
        },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
    });

    it('actualiza el perfil sin cambiar contraseña', async () => {
      const usuario = { id: 1, nombre_completo: 'Juan Pérez' };
      Usuario.updatePerfil.mockResolvedValue(usuario);

      const req = createReq({
        body: {
          nombre_completo: 'Juan Pérez',
          email: 'juan@test.com',
        },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(Usuario.updatePerfil).toHaveBeenCalledWith(
        1,
        {
          nombre_completo: 'Juan Pérez',
          email: 'juan@test.com',
        },
        null
      );

      expect(logger.info).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('actualiza el perfil y cambia contraseña', async () => {
      const usuario = { id: 1 };
      Usuario.getByEmail.mockResolvedValue({
        id: 1,
        password: 'hash',
      });
      Usuario.validatePassword.mockResolvedValue(true);
      Usuario.updatePerfil.mockResolvedValue(usuario);

      const req = createReq({
        body: {
          nombre_completo: 'Juan',
          password: 'nueva123',
          passwordActual: 'actual123',
        },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(Usuario.updatePerfil).toHaveBeenCalledWith(
        1,
        { nombre_completo: 'Juan' },
        'nueva123'
      );
      expect(logger.info).toHaveBeenCalledWith(
        'USUARIO_PASSWORD_CHANGED',
        expect.objectContaining({
          event: 'usuario.password_changed',
          userId: 1,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('maneja email duplicado', async () => {
      const error = new Error('Duplicate email');
      error.code = 'ER_DUP_ENTRY';
      error.message = 'Duplicate entry email';

      Usuario.updatePerfil.mockRejectedValue(error);

      const req = createReq({
        body: { email: 'duplicado@test.com' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El email ya está registrado en otra cuenta',
      });
    });

    it('maneja cédula/RUC duplicado', async () => {
      const error = new Error('Duplicate cedula');
      error.code = 'ER_DUP_ENTRY';
      error.message = 'Duplicate entry cedula_ruc';

      Usuario.updatePerfil.mockRejectedValue(error);

      const req = createReq({
        body: { cedula_ruc: '1234567890' },
      });
      const res = createRes();

      await controller.updateMe(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El cédula/RUC ya está registrado en otra cuenta',
      });
    });

    it('maneja error general al actualizar', async () => {
      Usuario.updatePerfil.mockRejectedValue(new Error('DB error'));

      const res = createRes();

      await controller.updateMe(
        createReq({ body: { nombre_completo: 'Juan' } }),
        res
      );

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('buscarClientes', () => {
    it('rechaza consultas menores a 2 caracteres', async () => {
      const req = createReq({
        query: { q: 'a' },
      });
      const res = createRes();

      await controller.buscarClientes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('busca clientes con límite por defecto', async () => {
      const clientes = [{ id: 2, nombre: 'Cliente' }];
      Usuario.findByNombre.mockResolvedValue(clientes);

      const req = createReq({
        query: { q: 'ju' },
      });
      const res = createRes();

      await controller.buscarClientes(req, res);

      expect(Usuario.findByNombre).toHaveBeenCalledWith(
        'ju',
        { limite: 10, empresaId: 10 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: clientes,
      });
    });

    it('limita el máximo a 20 resultados', async () => {
      Usuario.findByNombre.mockResolvedValue([]);

      const req = createReq({
        query: {
          q: 'juan',
          limite: '50',
        },
      });
      const res = createRes();

      await controller.buscarClientes(req, res);

      expect(Usuario.findByNombre).toHaveBeenCalledWith(
        'juan',
        { limite: 20, empresaId: 10 }
      );
    });

    it('maneja errores de búsqueda', async () => {
      Usuario.findByNombre.mockRejectedValue(new Error('DB error'));

      const res = createRes();

      await controller.buscarClientes(
        createReq({ query: { q: 'juan' } }),
        res
      );

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllUsuarios', () => {
    it('devuelve usuarios de la empresa', async () => {
      const rows = [{ id: 1, nombre: 'Juan' }];
      db.query.mockResolvedValue([rows]);

      const req = createReq();
      const res = createRes();

      await controller.getAllUsuarios(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE empresa_id = ?'),
        [10]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: rows,
      });
    });

    it('maneja errores de consulta', async () => {
      db.query.mockRejectedValue(new Error('DB error'));

      const res = createRes();

      await controller.getAllUsuarios(createReq(), res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createUsuario', () => {
    it('rechaza campos obligatorios faltantes', async () => {
      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza un rol inválido', async () => {
      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '123456',
          rol: 'SUPERADMIN',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza contraseña corta', async () => {
      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '12345',
          rol: 'VENDEDOR',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza email existente', async () => {
      Usuario.getByEmail.mockResolvedValue({ id: 2 });

      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '123456',
          rol: 'VENDEDOR',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('crea el usuario correctamente', async () => {
      Usuario.getByEmail.mockResolvedValue(null);
      Usuario.create.mockResolvedValue(5);
      Usuario.getById.mockResolvedValue({
        id: 5,
        nombre: 'Juan',
      });

      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '123456',
          rol: 'VENDEDOR',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(Usuario.create).toHaveBeenCalledWith({
        nombre: 'Juan',
        email: 'juan@test.com',
        password: '123456',
        rol: 'VENDEDOR',
        activo: 1,
        empresa_id: 10,
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(logger.info).toHaveBeenCalled();
    });

    it('maneja email duplicado en la creación', async () => {
      Usuario.getByEmail.mockResolvedValue(null);

      const error = new Error('Duplicate');
      error.code = 'ER_DUP_ENTRY';

      Usuario.create.mockRejectedValue(error);

      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '123456',
          rol: 'VENDEDOR',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('maneja errores generales en la creación', async () => {
      Usuario.getByEmail.mockRejectedValue(new Error('DB error'));

      const req = createReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '123456',
          rol: 'VENDEDOR',
        },
      });
      const res = createRes();

      await controller.createUsuario(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateRol', () => {
    it('rechaza rol inválido', async () => {
      const req = createReq({
        params: { id: '2' },
        body: { rol: 'INVALIDO' },
      });
      const res = createRes();

      await controller.updateRol(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('impide cambiar el propio rol a no ADMIN', async () => {
      const req = createReq({
        params: { id: '1' },
        body: { rol: 'VENDEDOR' },
      });
      const res = createRes();

      await controller.updateRol(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devuelve 404 si el usuario objetivo no existe', async () => {
      db.query.mockResolvedValue([[]]);

      const req = createReq({
        params: { id: '2' },
        body: { rol: 'VENDEDOR' },
      });
      const res = createRes();

      await controller.updateRol(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('actualiza el rol y cierra las sesiones', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 2 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = createReq({
        params: { id: '2' },
        body: { rol: 'ADMIN' },
      });
      const res = createRes();

      await controller.updateRol(req, res);

      expect(db.query).toHaveBeenCalledTimes(4);
      expect(logger.info).toHaveBeenCalledWith(
        'USUARIO_ROL_UPDATED',
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Rol actualizado a ADMIN. El usuario deberá iniciar sesión nuevamente.',
      });
    });

    it('maneja errores al actualizar rol', async () => {
      db.query.mockRejectedValue(new Error('DB error'));

      const req = createReq({
        params: { id: '2' },
        body: { rol: 'ADMIN' },
      });
      const res = createRes();

      await controller.updateRol(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('toggleActivo', () => {
    it('rechaza cuando activo no fue enviado', async () => {
      const req = createReq({
        params: { id: '2' },
        body: {},
      });
      const res = createRes();

      await controller.toggleActivo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('impide desactivar la propia cuenta', async () => {
      const req = createReq({
        params: { id: '1' },
        body: { activo: false },
      });
      const res = createRes();

      await controller.toggleActivo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devuelve 404 si el usuario objetivo no existe', async () => {
      db.query.mockResolvedValue([[]]);

      const req = createReq({
        params: { id: '2' },
        body: { activo: true },
      });
      const res = createRes();

      await controller.toggleActivo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('activa un usuario', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 2 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = createReq({
        params: { id: '2' },
        body: { activo: true },
      });
      const res = createRes();

      await controller.toggleActivo(req, res);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario activado correctamente',
      });
    });

    it('desactiva un usuario y elimina sus sesiones', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 2 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = createReq({
        params: { id: '2' },
        body: { activo: false },
      });
      const res = createRes();

      await controller.toggleActivo(req, res);

      expect(db.query).toHaveBeenCalledTimes(4);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario desactivado correctamente',
      });
    });

    it('maneja errores al cambiar estado', async () => {
      db.query.mockRejectedValue(new Error('DB error'));

      const req = createReq({
        params: { id: '2' },
        body: { activo: true },
      });
      const res = createRes();

      await controller.toggleActivo(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
