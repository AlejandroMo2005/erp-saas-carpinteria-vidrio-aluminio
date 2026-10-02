import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database.js') return db;
  return originalLoad.call(this, request, parent, isMain);
};

const Material = require(
  `${process.cwd()}/src/modules/inventario/material/material.repository.js`
);

Module._load = originalLoad;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('material.repository', () => {
  describe('getAll', () => {
    it('debe retornar todos los materiales de la empresa', async () => {
      const rows = [
        { id: 1, nombre: 'Aluminio', empresa_id: 5 },
        { id: 2, nombre: 'Vidrio', empresa_id: 5 },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await Material.getAll(5);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM materiales'),
        [5]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE empresa_id = ? AND deleted_at IS NULL'),
        [5]
      );
      expect(result).toEqual(rows);
    });

    it('debe retornar arreglo vacío cuando no existen materiales', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await Material.getAll(5);

      expect(result).toEqual([]);
    });
  });

  describe('getConColores', () => {
    it('debe retornar materiales con sus colores', async () => {
      const rows = [
        {
          variante_id: 10,
          nombre_material: 'Aluminio',
          material_id: 1,
          color_nombre: 'Blanco',
          color_valor: '#FFFFFF',
          stock: 20,
          precio: 5.5,
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await Material.getConColores(5);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM materiales_variantes mv'),
        [5]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.empresa_id = ? AND m.deleted_at IS NULL'),
        [5]
      );
      expect(result).toEqual(rows);
    });

    it('debe retornar arreglo vacío cuando no existen variantes con colores', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await Material.getConColores(5);

      expect(result).toEqual([]);
    });
  });

  describe('updateVarianteInfo', () => {
    it('debe actualizar stock y precio de una variante', async () => {
      const resultDb = {
        affectedRows: 1,
      };

      db.query.mockResolvedValueOnce([resultDb]);

      const result = await Material.updateVarianteInfo(10, 25, 8.75);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE materiales_variantes SET stock = ?, precio = ? WHERE id = ?',
        [25, 8.75, 10]
      );
      expect(result).toEqual([resultDb]);
    });

    it('debe propagar el resultado cuando no se actualiza ninguna variante', async () => {
      const resultDb = {
        affectedRows: 0,
      };

      db.query.mockResolvedValueOnce([resultDb]);

      const result = await Material.updateVarianteInfo(999, 0, 0);

      expect(result).toEqual([resultDb]);
    });
  });

  describe('updateBasePrice', () => {
    it('debe actualizar el precio base respetando la empresa', async () => {
      const resultDb = {
        affectedRows: 1,
      };

      db.query.mockResolvedValueOnce([resultDb]);

      const result = await Material.updateBasePrice(20, 12.5, 5);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE materiales SET precio = ? WHERE id = ? AND empresa_id = ?',
        [12.5, 20, 5]
      );
      expect(result).toEqual([resultDb]);
    });

    it('debe propagar el resultado cuando no se actualiza el material', async () => {
      const resultDb = {
        affectedRows: 0,
      };

      db.query.mockResolvedValueOnce([resultDb]);

      const result = await Material.updateBasePrice(999, 15, 5);

      expect(result).toEqual([resultDb]);
    });
  });

  describe('getById', () => {
    it('debe retornar la variante encontrada', async () => {
      const material = {
        id: 10,
        material_id: 3,
        stock: 15,
        precio: 7.5,
        empresa_id: 5,
      };

      db.query.mockResolvedValueOnce([[material]]);

      const result = await Material.getById(10);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT mv.*, m.empresa_id'),
        [10]
      );
      expect(result).toEqual(material);
    });

    it('debe retornar undefined cuando no existe la variante', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await Material.getById(999);

      expect(result).toBeUndefined();
    });
  });
});
