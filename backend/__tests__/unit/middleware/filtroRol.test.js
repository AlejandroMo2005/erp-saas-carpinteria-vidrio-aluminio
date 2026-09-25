import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const modulePath = require.resolve(
  `${process.cwd()}/src/shared/middleware/filtroRol.js`
);

delete require.cache[modulePath];

const {
  filtroCliente,
  soloSistema,
} = require(modulePath);

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('filtroRol', () => {
  describe('filtroCliente', () => {
    it('debe configurar filtro para CLIENTE con sus datos', () => {
      const req = {
        user: {
          rol: 'CLIENTE',
          id: 25,
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
        },
      };
      const res = createResponse();
      const next = vi.fn();

      filtroCliente(req, res, next);

      expect(req.filtroUsuario).toEqual({
        soloPropio: true,
        usuarioId: 25,
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
      });
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('debe configurar filtro general para un usuario distinto de CLIENTE', () => {
      const req = {
        user: {
          rol: 'ADMIN',
          id: 1,
          nombre: 'Administrador',
          email: 'admin@example.com',
        },
      };
      const res = createResponse();
      const next = vi.fn();

      filtroCliente(req, res, next);

      expect(req.filtroUsuario).toEqual({
        soloPropio: false,
      });
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('debe configurar filtro general cuando req.user no existe', () => {
      const req = {};
      const res = createResponse();
      const next = vi.fn();

      filtroCliente(req, res, next);

      expect(req.filtroUsuario).toEqual({
        soloPropio: false,
      });
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('soloSistema', () => {
    it('debe rechazar a un usuario CLIENTE con 403', () => {
      const req = {
        user: {
          rol: 'CLIENTE',
        },
      };
      const res = createResponse();
      const next = vi.fn();

      const result = soloSistema(req, res, next);

      expect(result).toBe(res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe permitir a un usuario con rol distinto de CLIENTE', () => {
      const req = {
        user: {
          rol: 'ADMIN',
        },
      };
      const res = createResponse();
      const next = vi.fn();

      const result = soloSistema(req, res, next);

      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('debe permitir cuando req.user no existe', () => {
      const req = {};
      const res = createResponse();
      const next = vi.fn();

      const result = soloSistema(req, res, next);

      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
