import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const bcrypt = {
  genSalt: vi.fn(),
  hash: vi.fn(),
  compare: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database') return db;
  if (request === 'bcryptjs') return bcrypt;
  return originalLoad.call(this, request, parent, isMain);
};

const Usuario = require(
  `${process.cwd()}/src/modules/usuario/usuario.repository.js`
);

Module._load = originalLoad;

describe('usuario.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('HASHED_PASSWORD');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('create', () => {
    it('crea usuario con empresa_id', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 15 }]);

      const result = await Usuario.create({
        nombre: 'juan',
        email: 'juan@test.com',
        password: '123456',
        rol: 'ADMIN',
        activo: 1,
        empresa_id: 7,
      });

      expect(result).toBe(15);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 'salt');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        ['juan', 'juan@test.com', 'HASHED_PASSWORD', 'ADMIN', 1, 7]
      );
    });

    it('usa valores por defecto y empresa_id null', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 20 }]);

      const result = await Usuario.create({
        nombre: 'juan',
        email: 'juan@test.com',
        password: '123456',
      });

      expect(result).toBe(20);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        ['juan', 'juan@test.com', 'HASHED_PASSWORD', 'VENDEDOR', 1, null]
      );
    });
  });

  describe('getById', () => {
    it('devuelve el usuario encontrado', async () => {
      const usuario = { id: 1, nombre: 'Juan' };
      db.query.mockResolvedValueOnce([[usuario]]);

      await expect(Usuario.getById(1)).resolves.toEqual(usuario);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        [1]
      );
    });

    it('devuelve null cuando no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await expect(Usuario.getById(99)).resolves.toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('devuelve el usuario con password', async () => {
      const usuario = {
        id: 1,
        email: 'juan@test.com',
        password: 'HASH',
      };

      db.query.mockResolvedValueOnce([[usuario]]);

      await expect(
        Usuario.getByEmail('juan@test.com')
      ).resolves.toEqual(usuario);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = ?'),
        ['juan@test.com']
      );
    });

    it('devuelve null cuando no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await expect(
        Usuario.getByEmail('no@test.com')
      ).resolves.toBeNull();
    });
  });

  describe('getAll', () => {
    it('devuelve todos los usuarios activos y no eliminados', async () => {
      const rows = [
        { id: 2, nombre: 'Ana' },
        { id: 1, nombre: 'Juan' },
      ];

      db.query.mockResolvedValueOnce([rows]);

      await expect(Usuario.getAll()).resolves.toEqual(rows);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL')
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC')
      );
    });
  });

  describe('validatePassword', () => {
    it('devuelve true cuando bcrypt valida la contraseña', async () => {
      bcrypt.compare.mockResolvedValueOnce(true);

      await expect(
        Usuario.validatePassword('123456', 'HASH')
      ).resolves.toBe(true);

      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'HASH');
    });

    it('devuelve false cuando bcrypt rechaza la contraseña', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(
        Usuario.validatePassword('incorrecta', 'HASH')
      ).resolves.toBe(false);
    });
  });

  describe('saveResetToken', () => {
    it('guarda token y expiración', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await Usuario.saveResetToken(5, 'TOKEN123', '2026-12-01');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET reset_token'),
        ['TOKEN123', '2026-12-01', 5]
      );
    });
  });

  describe('findByResetToken', () => {
    it('devuelve usuario por token', async () => {
      const usuario = { id: 5, reset_token: 'TOKEN123' };
      db.query.mockResolvedValueOnce([[usuario]]);

      await expect(
        Usuario.findByResetToken('TOKEN123')
      ).resolves.toEqual(usuario);
    });

    it('devuelve null si el token no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await expect(
        Usuario.findByResetToken('INVALIDO')
      ).resolves.toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('hashea y actualiza la contraseña', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await Usuario.updatePassword(8, 'nueva123');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('nueva123', 'salt');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET password'),
        ['HASHED_PASSWORD', 8]
      );
    });
  });

  describe('clearResetToken', () => {
    it('limpia token y expiración', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await Usuario.clearResetToken(8);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('reset_token = NULL'),
        [8]
      );
    });
  });

  describe('updatePerfil', () => {
    it('actualiza campos editables y convierte cadenas vacías a null', async () => {
      db.query
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[
          { id: 1, nombre_completo: 'Juan', telefono: null },
        ]]);

      const result = await Usuario.updatePerfil(
        1,
        {
          nombre_completo: 'Juan',
          telefono: '',
          email: 'juan@test.com',
        }
      );

      expect(result).toEqual({
        id: 1,
        nombre_completo: 'Juan',
        telefono: null,
      });

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE usuarios SET'),
        ['Juan', null, 'juan@test.com', 1]
      );
    });

    it('actualiza también la contraseña cuando se proporciona', async () => {
      db.query
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 2, nombre_completo: 'Ana' }]]);

      const result = await Usuario.updatePerfil(
        2,
        { nombre_completo: 'Ana' },
        'nueva123'
      );

      expect(result).toEqual({
        id: 2,
        nombre_completo: 'Ana',
      });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('nueva123', 'salt');

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('password = ?'),
        ['Ana', 'HASHED_PASSWORD', 2]
      );
    });

    it('devuelve el usuario sin UPDATE cuando no hay cambios', async () => {
      const usuario = { id: 3, nombre_completo: 'Pedro' };

      db.query.mockResolvedValueOnce([[usuario]]);

      await expect(
        Usuario.updatePerfil(3, {})
      ).resolves.toEqual(usuario);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [3]
      );
    });

    it('ignora campos que no son editables', async () => {
      const usuario = { id: 4, nombre_completo: 'Carlos' };

      db.query.mockResolvedValueOnce([[usuario]]);

      await expect(
        Usuario.updatePerfil(4, {
          rol: 'ADMIN',
          activo: 0,
          empresa_id: 99,
        })
      ).resolves.toEqual(usuario);

      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByNombre', () => {
    it('busca usuarios activos por nombre', async () => {
      const rows = [{ id: 1, nombre: 'Juan' }];
      db.query.mockResolvedValueOnce([rows]);

      await expect(
        Usuario.findByNombre('Juan')
      ).resolves.toEqual(rows);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('activo = 1'),
        ['%Juan%', '%Juan%', 10]
      );
    });

    it('respeta limite personalizado y empresaId sin alterar la consulta actual', async () => {
      db.query.mockResolvedValueOnce([[{ id: 2 }]]);

      await Usuario.findByNombre('Ana', {
        limite: 5,
        empresaId: 9,
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        ['%Ana%', '%Ana%', 5]
      );
    });
  });

  describe('desactivar', () => {
    it('devuelve true cuando afecta una fila', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(Usuario.desactivar(4)).resolves.toBe(true);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('activo = 0'),
        [4]
      );
    });

    it('devuelve false cuando no afecta filas', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(Usuario.desactivar(99)).resolves.toBe(false);
    });
  });

  describe('activar', () => {
    it('devuelve true cuando afecta una fila', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(Usuario.activar(4)).resolves.toBe(true);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('activo = 1'),
        [4]
      );
    });

    it('devuelve false cuando no afecta filas', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(Usuario.activar(99)).resolves.toBe(false);
    });
  });
});
