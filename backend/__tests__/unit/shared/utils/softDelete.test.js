import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const originalLoad = Module._load;

const logger = {
  info: vi.fn(),
};

const softDeletePath = require.resolve(
  `${process.cwd()}/src/shared/utils/softDelete.js`
);

Module._load = function (request, parent, isMain) {
  if (request === './logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

delete require.cache[softDeletePath];

const {
  softDelete,
  softRestore,
  whereActivo,
  whereActivoAnd,
  andActivo,
} = require(softDeletePath);

Module._load = originalLoad;

describe('shared/utils/softDelete', () => {
  beforeAll(() => {
    logger.info.mockClear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('softDelete', () => {
    it('debe ejecutar el UPDATE y retornar true cuando afecta un registro', async () => {
      const db = {
        query: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      };

      const resultado = await softDelete(
        db,
        'clientes',
        15,
        7
      );

      expect(resultado).toBe(true);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE clientes SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [15]
      );

      expect(logger.info).toHaveBeenCalledWith(
        'SOFT_DELETE',
        {
          tabla: 'clientes',
          id: 15,
          usuarioId: 7,
        }
      );
    });

    it('debe usar usuarioId null por defecto', async () => {
      const db = {
        query: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      };

      const resultado = await softDelete(
        db,
        'pedidos',
        20
      );

      expect(resultado).toBe(true);

      expect(logger.info).toHaveBeenCalledWith(
        'SOFT_DELETE',
        {
          tabla: 'pedidos',
          id: 20,
          usuarioId: null,
        }
      );
    });

    it('debe retornar false y no registrar auditoría cuando no afecta registros', async () => {
      const db = {
        query: vi.fn().mockResolvedValue([{ affectedRows: 0 }]),
      };

      logger.info.mockClear();

      const resultado = await softDelete(
        db,
        'clientes',
        99,
        4
      );

      expect(resultado).toBe(false);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE clientes SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [99]
      );

      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('softRestore', () => {
    it('debe ejecutar el UPDATE y retornar true cuando restaura un registro', async () => {
      const db = {
        query: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      };

      const resultado = await softRestore(
        db,
        'clientes',
        15,
        7
      );

      expect(resultado).toBe(true);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE clientes SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
        [15]
      );

      expect(logger.info).toHaveBeenCalledWith(
        'SOFT_RESTORE',
        {
          tabla: 'clientes',
          id: 15,
          usuarioId: 7,
        }
      );
    });

    it('debe usar usuarioId null por defecto', async () => {
      const db = {
        query: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      };

      const resultado = await softRestore(
        db,
        'pedidos',
        20
      );

      expect(resultado).toBe(true);

      expect(logger.info).toHaveBeenCalledWith(
        'SOFT_RESTORE',
        {
          tabla: 'pedidos',
          id: 20,
          usuarioId: null,
        }
      );
    });

    it('debe retornar false y no registrar auditoría cuando no afecta registros', async () => {
      const db = {
        query: vi.fn().mockResolvedValue([{ affectedRows: 0 }]),
      };

      logger.info.mockClear();

      const resultado = await softRestore(
        db,
        'clientes',
        99,
        4
      );

      expect(resultado).toBe(false);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE clientes SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
        [99]
      );

      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('whereActivo', () => {
    it('debe retornar la cláusula WHERE para registros activos', () => {
      expect(whereActivo()).toBe('WHERE deleted_at IS NULL');
    });
  });

  describe('whereActivoAnd', () => {
    it('debe agregar una condición adicional al filtro de activos', () => {
      expect(whereActivoAnd('estado = ?')).toBe(
        'WHERE deleted_at IS NULL AND (estado = ?)'
      );
    });

    it('debe conservar condiciones SQL complejas dentro de los paréntesis', () => {
      expect(whereActivoAnd('empresa_id = ? AND estado = ?')).toBe(
        'WHERE deleted_at IS NULL AND (empresa_id = ? AND estado = ?)'
      );
    });
  });

  describe('andActivo', () => {
    it('debe retornar el fragmento AND para registros activos', () => {
      expect(andActivo()).toBe('AND deleted_at IS NULL');
    });
  });
});
