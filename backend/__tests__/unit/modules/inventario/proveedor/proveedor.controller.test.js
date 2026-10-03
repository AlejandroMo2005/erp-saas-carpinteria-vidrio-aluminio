import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Proveedor = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  getAlertasStock: vi.fn(),
  createSolicitud: vi.fn(),
  marcarEnviada: vi.fn(),
  getSolicitudes: vi.fn(),
  getMateriales: vi.fn(),
};

const generarPlantilla = vi.fn();

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
  if (request === './proveedor.repository') return Proveedor;
  if (request === '../../../shared/services/proveedorService') {
    return { generarPlantilla };
  }
  if (request === '../../../shared/utils/logger') return logger;
  if (request === '../../../shared/utils/softDelete') return { softDelete };
  if (request === '../../../config/database.js') return db;

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/inventario/proveedor/proveedor.controller.js`
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

describe('proveedor.controller', () => {
  describe('listar', () => {
    it('debe retornar proveedores correctamente', async () => {
      const req = createReq();
      const res = createRes();
      const proveedores = [{ id: 1, nombre: 'Proveedor A' }];

      Proveedor.getAll.mockResolvedValueOnce(proveedores);

      await controller.listar(req, res);

      expect(Proveedor.getAll).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: proveedores,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq();
      const res = createRes();

      Proveedor.getAll.mockRejectedValueOnce(new Error('DB error'));

      await controller.listar(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_LISTAR',
        expect.objectContaining({
          event: 'proveedor.listar_error',
          message: 'DB error',
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener proveedores',
      });
    });
  });

  describe('obtener', () => {
    it('debe retornar el proveedor', async () => {
      const req = createReq({
        params: { id: '10' },
      });
      const res = createRes();
      const proveedor = { id: 10, nombre: 'Proveedor A' };

      Proveedor.getById.mockResolvedValueOnce(proveedor);

      await controller.obtener(req, res);

      expect(Proveedor.getById).toHaveBeenCalledWith('10', 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: proveedor,
      });
    });

    it('debe retornar 404 si no existe', async () => {
      const req = createReq({
        params: { id: '10' },
      });
      const res = createRes();

      Proveedor.getById.mockResolvedValueOnce(null);

      await controller.obtener(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Proveedor no encontrado',
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        params: { id: '10' },
      });
      const res = createRes();

      Proveedor.getById.mockRejectedValueOnce(new Error('DB error'));

      await controller.obtener(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_OBTENER',
        expect.objectContaining({
          proveedorId: '10',
          message: 'DB error',
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crear', () => {
    it('debe validar nombre requerido', async () => {
      const req = createReq({
        body: {
          ciudad: 'Manta',
        },
      });
      const res = createRes();

      await controller.crear(req, res);

      expect(Proveedor.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre es requerido',
      });
    });

    it('debe crear proveedor correctamente', async () => {
      const req = createReq({
        body: {
          nombre: 'Proveedor A',
          ciudad: 'Manta',
          telefono_whatsapp: '0999999999',
          email: 'a@test.com',
          notas: 'Notas',
          material_ids: [1, 2],
        },
      });
      const res = createRes();

      const proveedor = {
        id: 10,
        nombre: 'Proveedor A',
      };

      Proveedor.create.mockResolvedValueOnce(proveedor);

      await controller.crear(req, res);

      expect(Proveedor.create).toHaveBeenCalledWith(
        {
          nombre: 'Proveedor A',
          ciudad: 'Manta',
          telefono_whatsapp: '0999999999',
          email: 'a@test.com',
          notas: 'Notas',
          empresa_id: 5,
        },
        [1, 2]
      );

      expect(logger.info).toHaveBeenCalledWith(
        'PROVEEDOR_CREADO',
        expect.objectContaining({
          proveedorId: 10,
          empresaId: 5,
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: proveedor,
      });
    });

    it('debe usar material_ids vacío por defecto', async () => {
      const req = createReq({
        body: {
          nombre: 'Proveedor B',
        },
      });
      const res = createRes();

      const proveedor = { id: 11, nombre: 'Proveedor B' };

      Proveedor.create.mockResolvedValueOnce(proveedor);

      await controller.crear(req, res);

      expect(Proveedor.create).toHaveBeenCalledWith(
        {
          nombre: 'Proveedor B',
          ciudad: undefined,
          telefono_whatsapp: undefined,
          email: undefined,
          notas: undefined,
          empresa_id: 5,
        },
        []
      );
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        body: { nombre: 'Proveedor' },
      });
      const res = createRes();

      Proveedor.create.mockRejectedValueOnce(new Error('DB error'));

      await controller.crear(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_CREAR',
        expect.objectContaining({
          event: 'proveedor.crear_error',
          message: 'DB error',
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('actualizar', () => {
    it('debe validar nombre requerido', async () => {
      const req = createReq({
        params: { id: '10' },
        body: {},
      });
      const res = createRes();

      await controller.actualizar(req, res);

      expect(Proveedor.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe actualizar proveedor correctamente', async () => {
      const req = createReq({
        params: { id: '10' },
        body: {
          nombre: 'Proveedor actualizado',
          ciudad: 'Quito',
          telefono_whatsapp: '0988888888',
          email: 'nuevo@test.com',
          notas: 'Actualizado',
          material_ids: [3, 4],
        },
      });
      const res = createRes();

      const proveedor = {
        id: 10,
        nombre: 'Proveedor actualizado',
      };

      Proveedor.update.mockResolvedValueOnce(proveedor);

      await controller.actualizar(req, res);

      expect(Proveedor.update).toHaveBeenCalledWith(
        '10',
        {
          nombre: 'Proveedor actualizado',
          ciudad: 'Quito',
          telefono_whatsapp: '0988888888',
          email: 'nuevo@test.com',
          notas: 'Actualizado',
        },
        [3, 4],
        5
      );

      expect(logger.info).toHaveBeenCalledWith(
        'PROVEEDOR_ACTUALIZADO',
        expect.objectContaining({
          proveedorId: '10',
          empresaId: 5,
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: proveedor,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        params: { id: '10' },
        body: { nombre: 'Proveedor' },
      });
      const res = createRes();

      Proveedor.update.mockRejectedValueOnce(new Error('DB error'));

      await controller.actualizar(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_ACTUALIZAR',
        expect.objectContaining({
          proveedorId: '10',
          message: 'DB error',
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('eliminar', () => {
    it('debe retornar 404 si el proveedor no existe', async () => {
      const req = createReq({
        params: { id: '10' },
      });
      const res = createRes();

      db.query.mockResolvedValueOnce([[]]);

      await controller.eliminar(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM proveedores'),
        ['10', 5]
      );

      expect(softDelete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe eliminar proveedor correctamente', async () => {
      const req = createReq({
        params: { id: '10' },
      });
      const res = createRes();

      db.query.mockResolvedValueOnce([[{ id: 10 }]]);
      softDelete.mockResolvedValueOnce(true);

      await controller.eliminar(req, res);

      expect(softDelete).toHaveBeenCalledWith(
        db,
        'proveedores',
        '10'
      );

      expect(logger.info).toHaveBeenCalledWith(
        'PROVEEDOR_ELIMINADO',
        expect.objectContaining({
          proveedorId: '10',
          empresaId: 5,
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Proveedor eliminado',
        },
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        params: { id: '10' },
      });
      const res = createRes();

      db.query.mockRejectedValueOnce(new Error('DB error'));

      await controller.eliminar(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_ELIMINAR',
        expect.objectContaining({
          proveedorId: '10',
          message: 'DB error',
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('alertasStock', () => {
    it('debe retornar alertas y registrar stock bajo con color', async () => {
      const req = createReq();
      const res = createRes();

      const alertas = [
        {
          material_id: 1,
          material: 'Perfil',
          color: 'Blanco',
          stock: 2,
          stock_minimo: 10,
        },
      ];

      Proveedor.getAlertasStock.mockResolvedValueOnce(alertas);

      await controller.alertasStock(req, res);

      expect(Proveedor.getAlertasStock).toHaveBeenCalledWith(5);
      expect(logger.stockLow).toHaveBeenCalledWith(
        1,
        'Perfil - Blanco',
        2,
        10
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: alertas,
      });
    });

    it('debe registrar stock bajo sin color', async () => {
      const req = createReq();
      const res = createRes();

      const alertas = [
        {
          material_id: 2,
          material: 'Silicona',
          color: null,
          stock: 1,
          stock_minimo: 5,
        },
      ];

      Proveedor.getAlertasStock.mockResolvedValueOnce(alertas);

      await controller.alertasStock(req, res);

      expect(logger.stockLow).toHaveBeenCalledWith(
        2,
        'Silicona',
        1,
        5
      );
    });

    it('debe retornar correctamente sin alertas', async () => {
      const req = createReq();
      const res = createRes();

      Proveedor.getAlertasStock.mockResolvedValueOnce([]);

      await controller.alertasStock(req, res);

      expect(logger.stockLow).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('debe manejar un resultado que no sea arreglo', async () => {
      const req = createReq();
      const res = createRes();

      Proveedor.getAlertasStock.mockResolvedValueOnce(null);

      await controller.alertasStock(req, res);

      expect(logger.stockLow).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq();
      const res = createRes();

      Proveedor.getAlertasStock.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.alertasStock(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_ALERTAS_STOCK',
        expect.objectContaining({
          event: 'proveedor.alertasStock_error',
          message: 'DB error',
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generarSolicitud', () => {
    it('debe validar proveedor_id e items', async () => {
      const req = createReq({
        body: {},
      });
      const res = createRes();

      await controller.generarSolicitud(req, res);

      expect(Proveedor.getById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'proveedor_id e items son requeridos',
      });
    });

    it('debe validar que cada item tenga nombre y cantidad', async () => {
      const req = createReq({
        body: {
          proveedor_id: 10,
          items: [
            {
              nombre_material: 'Perfil',
            },
          ],
        },
      });
      const res = createRes();

      await controller.generarSolicitud(req, res);

      expect(Proveedor.getById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cada item requiere nombre_material y cantidad',
      });
    });

    it('debe retornar 404 si el proveedor no existe', async () => {
      const req = createReq({
        body: {
          proveedor_id: 10,
          items: [
            {
              nombre_material: 'Perfil',
              cantidad: 5,
            },
          ],
        },
      });
      const res = createRes();

      Proveedor.getById.mockResolvedValueOnce(null);

      await controller.generarSolicitud(req, res);

      expect(Proveedor.getById).toHaveBeenCalledWith(10, 5);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe generar la solicitud correctamente', async () => {
      const req = createReq({
        body: {
          proveedor_id: 10,
          items: [
            {
              material_id: 7,
              variante_id: 8,
              nombre_material: 'Perfil',
              color: 'Blanco',
              cantidad: '5',
              unidad: 'metro',
            },
            {
              nombre_material: 'Silicona',
              cantidad: 2,
            },
          ],
        },
      });
      const res = createRes();

      const proveedor = {
        id: 10,
        nombre: 'Proveedor A',
        telefono_whatsapp: '0999999999',
      };

      const solicitud = {
        id: 50,
      };

      const plantilla = 'Solicitud para Proveedor A';

      Proveedor.getById.mockResolvedValueOnce(proveedor);
      generarPlantilla.mockReturnValueOnce(plantilla);
      Proveedor.createSolicitud.mockResolvedValueOnce(solicitud);

      await controller.generarSolicitud(req, res);

      const itemsNormalizados = [
        {
          material_id: 7,
          variante_id: 8,
          nombre_material: 'Perfil',
          color: 'Blanco',
          cantidad: 5,
          unidad: 'metro',
        },
        {
          material_id: null,
          variante_id: null,
          nombre_material: 'Silicona',
          color: null,
          cantidad: 2,
          unidad: 'unidad',
        },
      ];

      expect(generarPlantilla).toHaveBeenCalledWith(
        'Proveedor A',
        itemsNormalizados
      );

      expect(Proveedor.createSolicitud).toHaveBeenCalledWith(
        {
          proveedor_id: 10,
          usuario_id: 99,
          plantilla_texto: plantilla,
          empresa_id: 5,
        },
        itemsNormalizados
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          solicitud_id: 50,
          plantilla_texto: plantilla,
          telefono_whatsapp: '0999999999',
        },
      });
    });

    it('debe usar valores nulos/defaults cuando faltan campos opcionales', async () => {
      const req = createReq({
        user: {},
        body: {
          proveedor_id: 10,
          items: [
            {
              nombre_material: 'Perfil',
              cantidad: '3',
            },
          ],
        },
      });
      const res = createRes();

      const proveedor = {
        id: 10,
        nombre: 'Proveedor',
        telefono_whatsapp: null,
      };

      Proveedor.getById.mockResolvedValueOnce(proveedor);
      generarPlantilla.mockReturnValueOnce('Plantilla');
      Proveedor.createSolicitud.mockResolvedValueOnce({ id: 51 });

      await controller.generarSolicitud(req, res);

      expect(Proveedor.createSolicitud).toHaveBeenCalledWith(
        {
          proveedor_id: 10,
          usuario_id: null,
          plantilla_texto: 'Plantilla',
          empresa_id: 5,
        },
        [
          {
            material_id: null,
            variante_id: null,
            nombre_material: 'Perfil',
            color: null,
            cantidad: 3,
            unidad: 'unidad',
          },
        ]
      );
    });

    it('debe manejar errores y devolver el mensaje de error', async () => {
      const req = createReq({
        body: {
          proveedor_id: 10,
          items: [
            {
              nombre_material: 'Perfil',
              cantidad: 5,
            },
          ],
        },
      });
      const res = createRes();

      Proveedor.getById.mockRejectedValueOnce(
        new Error('Proveedor DB error')
      );

      await controller.generarSolicitud(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_GENERAR_SOLICITUD',
        expect.objectContaining({
          event: 'proveedor.generarSolicitud_error',
          message: 'Proveedor DB error',
          userId: 99,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al generar solicitud: Proveedor DB error',
      });
    });
  });

  describe('marcarEnviada', () => {
    it('debe marcar la solicitud como enviada', async () => {
      const req = createReq({
        params: { id: '30' },
      });
      const res = createRes();

      const solicitud = {
        id: 30,
        estado: 'enviada',
      };

      Proveedor.marcarEnviada.mockResolvedValueOnce(solicitud);

      await controller.marcarEnviada(req, res);

      expect(Proveedor.marcarEnviada).toHaveBeenCalledWith('30', 5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: solicitud,
      });
    });

    it('debe retornar 404 si la solicitud no pertenece a la empresa', async () => {
      const req = createReq({
        params: { id: '30' },
      });
      const res = createRes();

      Proveedor.marcarEnviada.mockResolvedValueOnce(null);

      await controller.marcarEnviada(req, res);

      expect(Proveedor.marcarEnviada).toHaveBeenCalledWith('30', 5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Solicitud no encontrada',
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq({
        params: { id: '30' },
      });
      const res = createRes();

      Proveedor.marcarEnviada.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.marcarEnviada(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_MARCAR_ENVIADA',
        expect.objectContaining({
          solicitudId: '30',
          message: 'DB error',
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('historialSolicitudes', () => {
    it('debe retornar el historial', async () => {
      const req = createReq();
      const res = createRes();

      const historial = [{ id: 1 }, { id: 2 }];

      Proveedor.getSolicitudes.mockResolvedValueOnce(historial);

      await controller.historialSolicitudes(req, res);

      expect(Proveedor.getSolicitudes).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: historial,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq();
      const res = createRes();

      Proveedor.getSolicitudes.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.historialSolicitudes(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_HISTORIAL',
        expect.objectContaining({
          event: 'proveedor.historial_error',
          message: 'DB error',
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMateriales', () => {
    it('debe retornar materiales', async () => {
      const req = createReq();
      const res = createRes();

      const materiales = [{ id: 1, nombre: 'Perfil' }];

      Proveedor.getMateriales.mockResolvedValueOnce(materiales);

      await controller.getMateriales(req, res);

      expect(Proveedor.getMateriales).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: materiales,
      });
    });

    it('debe manejar errores', async () => {
      const req = createReq();
      const res = createRes();

      Proveedor.getMateriales.mockRejectedValueOnce(
        new Error('DB error')
      );

      await controller.getMateriales(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROVEEDOR_GET_MATERIALES',
        expect.objectContaining({
          event: 'proveedor.getMateriales_error',
          message: 'DB error',
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
