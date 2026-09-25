import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Material = {
  getConColores: vi.fn(),
  getAll: vi.fn(),
  updateVarianteInfo: vi.fn(),
  getById: vi.fn(),
  updateBasePrice: vi.fn(),
};

const logger = {
  error: vi.fn(),
  info: vi.fn(),
  stockLow: vi.fn(),
};

const softDelete = vi.fn();

const db = {
  query: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === './material.repository') return Material;
  if (request === '../../../../utils/logger') return logger;
  if (request === '../../../../utils/softDelete') return { softDelete };
  if (request === '../../../../config/database') return db;

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/inventario/material/material.controller.js`
);

Module._load = originalLoad;

const createRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

const createReq = (overrides = {}) => ({
  params: {},
  body: {},
  user: { id: 99 },
  empresaId: 5,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('material.controller', () => {
  describe('getConColores', () => {
    it('debe retornar materiales con colores', async () => {
      const req = createReq();
      const res = createRes();

      const materiales = [
        {
          variante_id: 1,
          nombre_material: 'Aluminio',
          color_nombre: 'Blanco',
        },
      ];

      Material.getConColores.mockResolvedValueOnce(materiales);

      await controller.getConColores(req, res);

      expect(Material.getConColores).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: materiales,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq();
      const res = createRes();

      Material.getConColores.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.getConColores(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'MATERIAL_GET_CON_COLORES',
        {
          event: 'material.getConColores_error',
          message: 'DB error',
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener materiales',
      });
    });
  });

  describe('getAllMateriales', () => {
    it('debe retornar todos los materiales', async () => {
      const req = createReq();
      const res = createRes();

      const materiales = [
        {
          id: 1,
          nombre: 'Aluminio',
          empresa_id: 5,
        },
      ];

      Material.getAll.mockResolvedValueOnce(materiales);

      await controller.getAllMateriales(req, res);

      expect(Material.getAll).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: materiales,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq();
      const res = createRes();

      Material.getAll.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.getAllMateriales(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'MATERIAL_GET_ALL',
        {
          event: 'material.getAll_error',
          message: 'DB error',
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener materiales',
      });
    });
  });

  describe('updateVariante', () => {
    it('debe actualizar variante y material base correctamente', async () => {
      const req = createReq({
        params: { id: '10' },
        body: {
          stock: 20,
          precio: 12.5,
        },
      });
      const res = createRes();

      const variante = {
        id: 10,
        material_id: 3,
        nombre: 'Perfil aluminio',
      };

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      Material.getById.mockResolvedValueOnce(variante);

      db.query.mockResolvedValueOnce([
        [{ id: 3 }],
      ]);

      Material.updateBasePrice.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      await controller.updateVariante(req, res);

      expect(Material.updateVarianteInfo).toHaveBeenCalledWith(
        '10',
        20,
        12.5
      );

      expect(Material.getById).toHaveBeenCalledWith('10');

      expect(db.query).toHaveBeenCalledWith(
        'SELECT id FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
        [3, 5]
      );

      expect(Material.updateBasePrice).toHaveBeenCalledWith(
        3,
        12.5,
        5
      );

      expect(logger.info).toHaveBeenCalledWith(
        'MATERIAL_UPDATE_VARIANTE',
        {
          event: 'material.variante_updated',
          varianteId: '10',
          materialId: 3,
          stock: 20,
          precio: 12.5,
          empresaId: 5,
          userId: 99,
        }
      );

      expect(logger.stockLow).not.toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Sincronización completa. Variante y Material base actualizados.',
      });
    });

    it('debe registrar alerta cuando el stock es igual al umbral', async () => {
      const req = createReq({
        params: { id: '11' },
        body: {
          stock: 5,
          precio: 10,
        },
      });
      const res = createRes();

      const variante = {
        id: 11,
        material_id: 4,
        nombre: 'Vidrio',
      };

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      Material.getById.mockResolvedValueOnce(variante);

      db.query.mockResolvedValueOnce([
        [{ id: 4 }],
      ]);

      Material.updateBasePrice.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      await controller.updateVariante(req, res);

      expect(logger.stockLow).toHaveBeenCalledWith(
        4,
        'Vidrio',
        5,
        5
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Sincronización completa. Variante y Material base actualizados.',
      });
    });

    it('debe registrar alerta cuando el stock está por debajo del umbral', async () => {
      const req = createReq({
        params: { id: '12' },
        body: {
          stock: '2',
          precio: 8,
        },
      });
      const res = createRes();

      const variante = {
        id: 12,
        material_id: 5,
        nombre: 'Silicona',
      };

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      Material.getById.mockResolvedValueOnce(variante);

      db.query.mockResolvedValueOnce([
        [{ id: 5 }],
      ]);

      Material.updateBasePrice.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      await controller.updateVariante(req, res);

      expect(logger.stockLow).toHaveBeenCalledWith(
        5,
        'Silicona',
        2,
        5
      );
    });

    it('debe usar el nombre de variante cuando existe', async () => {
      const req = createReq({
        params: { id: '13' },
        body: {
          stock: 1,
          precio: 7,
        },
      });
      const res = createRes();

      const variante = {
        id: 13,
        material_id: 6,
        nombre: '',
      };

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      Material.getById.mockResolvedValueOnce(variante);

      db.query.mockResolvedValueOnce([
        [{ id: 6 }],
      ]);

      Material.updateBasePrice.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      await controller.updateVariante(req, res);

      expect(logger.stockLow).toHaveBeenCalledWith(
        6,
        'Variante #13',
        1,
        5
      );
    });

    it('debe retornar 403 si el material no pertenece a la empresa', async () => {
      const req = createReq({
        params: { id: '20' },
        body: {
          stock: 10,
          precio: 15,
        },
      });
      const res = createRes();

      const variante = {
        id: 20,
        material_id: 7,
        nombre: 'Material externo',
      };

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      Material.getById.mockResolvedValueOnce(variante);

      db.query.mockResolvedValueOnce([[]]);

      await controller.updateVariante(req, res);

      expect(Material.updateBasePrice).not.toHaveBeenCalled();
      expect(logger.stockLow).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Material no pertenece a esta empresa',
      });
    });

    it('debe retornar 404 si la variante no existe', async () => {
      const req = createReq({
        params: { id: '30' },
        body: {
          stock: 10,
          precio: 20,
        },
      });
      const res = createRes();

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 0,
      }]);

      Material.getById.mockResolvedValueOnce(undefined);

      await controller.updateVariante(req, res);

      expect(db.query).not.toHaveBeenCalled();
      expect(Material.updateBasePrice).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'No se encontró la variante para sincronizar.',
      });
    });

    it('debe manejar stock no numérico sin registrar alerta', async () => {
      const req = createReq({
        params: { id: '31' },
        body: {
          stock: 'no-numérico',
          precio: 20,
        },
      });
      const res = createRes();

      const variante = {
        id: 31,
        material_id: 8,
        nombre: 'Perfil',
      };

      Material.updateVarianteInfo.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      Material.getById.mockResolvedValueOnce(variante);

      db.query.mockResolvedValueOnce([
        [{ id: 8 }],
      ]);

      Material.updateBasePrice.mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

      await controller.updateVariante(req, res);

      expect(logger.stockLow).not.toHaveBeenCalled();

      expect(logger.info).toHaveBeenCalledWith(
        'MATERIAL_UPDATE_VARIANTE',
        expect.objectContaining({
          stock: NaN,
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Sincronización completa. Variante y Material base actualizados.',
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        params: { id: '40' },
        body: {
          stock: 10,
          precio: 20,
        },
      });
      const res = createRes();

      Material.updateVarianteInfo.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.updateVariante(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'MATERIAL_UPDATE_VARIANTE_ERROR',
        {
          event: 'material.updateVariante_error',
          varianteId: '40',
          message: 'DB error',
          userId: 99,
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al actualizar variante',
      });
    });
  });

  describe('deleteMaterial', () => {
    it('debe retornar 404 si el material no existe', async () => {
      const req = createReq({
        params: { id: '50' },
      });
      const res = createRes();

      db.query.mockResolvedValueOnce([[]]);

      await controller.deleteMaterial(req, res);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT id FROM materiales WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1',
        ['50', 5]
      );

      expect(softDelete).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Material no encontrado',
      });
    });

    it('debe eliminar el material correctamente', async () => {
      const req = createReq({
        params: { id: '51' },
      });
      const res = createRes();

      db.query.mockResolvedValueOnce([
        [{ id: 51 }],
      ]);

      softDelete.mockResolvedValueOnce(true);

      await controller.deleteMaterial(req, res);

      expect(softDelete).toHaveBeenCalledWith(
        db,
        'materiales',
        '51'
      );

      expect(logger.info).toHaveBeenCalledWith(
        'MATERIAL_SOFT_DELETE',
        {
          event: 'material.deleted',
          materialId: '51',
          empresaId: 5,
          userId: 99,
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Material eliminado correctamente',
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        params: { id: '52' },
      });
      const res = createRes();

      db.query.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.deleteMaterial(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'MATERIAL_DELETE_ERROR',
        {
          event: 'material.delete_error',
          materialId: '52',
          message: 'DB error',
          userId: 99,
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al eliminar material',
      });
    });
  });
});
