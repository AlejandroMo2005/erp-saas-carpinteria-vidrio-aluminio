import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
  getConnection: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../../config/database') return db;
  return originalLoad.call(this, request, parent, isMain);
};

const repository = require(
  `${process.cwd()}/src/modules/inventario/proveedor/proveedor.repository.js`
);

Module._load = originalLoad;

describe('proveedor.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe retornar todos los proveedores activos de la empresa', async () => {
      const rows = [
        { id: 1, nombre: 'Proveedor A', total_materiales: 3 },
        { id: 2, nombre: 'Proveedor B', total_materiales: 1 },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await repository.getAll(5);

      expect(result).toEqual(rows);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.empresa_id = ?'),
        [5]
      );
    });

    it('debe retornar arreglo vacío cuando no existen proveedores', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await repository.getAll(5);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('debe retornar null si el proveedor no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await repository.getById(10, 5);

      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('debe retornar el proveedor con sus materiales', async () => {
      const proveedor = {
        id: 10,
        nombre: 'Aluminios S.A.',
        empresa_id: 5,
      };

      const materiales = [
        {
          id: 1,
          nombre: 'Perfil 4x4',
          descripcion: 'Perfil de aluminio',
          stock: 20,
          stock_minimo: 5,
          precio: 12.5,
        },
      ];

      db.query
        .mockResolvedValueOnce([[proveedor]])
        .mockResolvedValueOnce([materiales]);

      const result = await repository.getById(10, 5);

      expect(result).toEqual({
        ...proveedor,
        materiales,
      });

      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('FROM materiales m'),
        [10, 5]
      );
    });

    it('debe retornar proveedor con materiales vacíos', async () => {
      const proveedor = { id: 10, nombre: 'Proveedor' };

      db.query
        .mockResolvedValueOnce([[proveedor]])
        .mockResolvedValueOnce([[]]);

      const result = await repository.getById(10, 5);

      expect(result).toEqual({
        ...proveedor,
        materiales: [],
      });
    });
  });

  describe('create', () => {
    it('debe crear proveedor sin materiales', async () => {
      const proveedor = {
        id: 20,
        nombre: 'Nuevo Proveedor',
        empresa_id: 5,
      };

      db.query
        .mockResolvedValueOnce([{ insertId: 20 }])
        .mockResolvedValueOnce([[proveedor]]);

      const result = await repository.create({
        nombre: 'Nuevo Proveedor',
        ciudad: 'Manta',
        telefono_whatsapp: '0999999999',
        email: 'proveedor@test.com',
        notas: 'Notas',
        empresa_id: 5,
      });

      expect(result).toEqual(proveedor);
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO proveedores'),
        [
          5,
          'Nuevo Proveedor',
          'Manta',
          '0999999999',
          'proveedor@test.com',
          'Notas',
        ]
      );
    });

    it('debe crear proveedor y asignar materiales', async () => {
      const proveedor = {
        id: 21,
        nombre: 'Proveedor con materiales',
      };

      db.query
        .mockResolvedValueOnce([{ insertId: 21 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[proveedor]]);

      const result = await repository.create(
        {
          nombre: 'Proveedor con materiales',
          ciudad: 'Portoviejo',
          telefono_whatsapp: '0988888888',
          email: 'materiales@test.com',
          notas: null,
          empresa_id: 5,
        },
        [3, 7, 9]
      );

      expect(result).toEqual(proveedor);

      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          'INSERT IGNORE INTO proveedor_materiales'
        ),
        [21, 3, 21, 7, 21, 9]
      );
    });
  });

  describe('update', () => {
    it('debe actualizar proveedor sin materiales', async () => {
      const proveedor = {
        id: 10,
        nombre: 'Proveedor actualizado',
      };

      db.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[proveedor]]);

      const result = await repository.update(
        10,
        {
          nombre: 'Proveedor actualizado',
          ciudad: 'Manta',
          telefono_whatsapp: '0991111111',
          email: 'nuevo@test.com',
          notas: 'Actualizado',
        },
        [],
        5
      );

      expect(result).toEqual(proveedor);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE proveedores'),
        [
          'Proveedor actualizado',
          'Manta',
          '0991111111',
          'nuevo@test.com',
          'Actualizado',
          10,
          5,
        ]
      );

      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM proveedor_materiales WHERE proveedor_id = ?',
        [10]
      );
    });

    it('debe actualizar proveedor y asignar materiales', async () => {
      const proveedor = {
        id: 10,
        nombre: 'Proveedor actualizado',
      };

      db.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[proveedor]]);

      const result = await repository.update(
        10,
        {
          nombre: 'Proveedor actualizado',
          ciudad: 'Quito',
          telefono_whatsapp: '0992222222',
          email: 'actualizado@test.com',
          notas: null,
        },
        [4, 8],
        5
      );

      expect(result).toEqual(proveedor);

      expect(db.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining(
          'INSERT IGNORE INTO proveedor_materiales'
        ),
        [10, 4, 10, 8]
      );
    });
  });

  describe('getAlertasStock', () => {
    it('debe retornar las alertas de stock de la empresa', async () => {
      const rows = [
        {
          variante_id: 1,
          material_id: 5,
          material: 'Perfil aluminio',
          color: 'Blanco',
          stock: 2,
          stock_minimo: 10,
          proveedor_id: 3,
          proveedor: 'Proveedor A',
          faltante: 8,
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await repository.getAlertasStock(5);

      expect(result).toEqual(rows);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('mv.stock <= COALESCE'),
        [5, 5]
      );
    });

    it('debe retornar arreglo vacío cuando no hay alertas', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await repository.getAlertasStock(5);

      expect(result).toEqual([]);
    });
  });

  describe('createSolicitud', () => {
    const createConnectionMock = () => ({
      beginTransaction: vi.fn(),
      query: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    });

    it('debe crear una solicitud con materiales válidos', async () => {
      const connection = createConnectionMock();

      connection.query
        .mockResolvedValueOnce([{ insertId: 50 }])
        .mockResolvedValueOnce([[{ id: 7 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ id: 50, estado: 'pendiente' }]]);

      db.getConnection.mockResolvedValueOnce(connection);

      const result = await repository.createSolicitud(
        {
          proveedor_id: 3,
          usuario_id: 8,
          plantilla_texto: 'Solicitud de materiales',
          empresa_id: 5,
        },
        [
          {
            material_id: 7,
            variante_id: 11,
            nombre_material: 'Perfil',
            color: 'Blanco',
            cantidad: 10,
            unidad: 'unidad',
          },
        ]
      );

      expect(result).toEqual({
        id: 50,
        estado: 'pendiente',
      });

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);

      expect(connection.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('SELECT id FROM materiales'),
        [7, 5]
      );

      expect(connection.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO solicitud_items'),
        [50, 7, 11, 'Perfil', 'Blanco', 10, 'unidad']
      );
    });

    it('debe convertir material inexistente en null', async () => {
      const connection = createConnectionMock();

      connection.query
        .mockResolvedValueOnce([{ insertId: 51 }])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ id: 51 }]]);

      db.getConnection.mockResolvedValueOnce(connection);

      const result = await repository.createSolicitud(
        {
          proveedor_id: 3,
          usuario_id: 8,
          plantilla_texto: 'Solicitud',
          empresa_id: 5,
        },
        [
          {
            material_id: 999,
            variante_id: null,
            nombre_material: 'Material inexistente',
            color: null,
            cantidad: 4,
          },
        ]
      );

      expect(result).toEqual({ id: 51 });

      expect(connection.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO solicitud_items'),
        [51, null, null, 'Material inexistente', null, 4, 'unidad']
      );

      expect(connection.commit).toHaveBeenCalledTimes(1);
    });

    it('debe usar valores por defecto cuando variante, color y unidad no existen', async () => {
      const connection = createConnectionMock();

      connection.query
        .mockResolvedValueOnce([{ insertId: 52 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ id: 52 }]]);

      db.getConnection.mockResolvedValueOnce(connection);

      await repository.createSolicitud(
        {
          proveedor_id: 3,
          usuario_id: 8,
          plantilla_texto: 'Solicitud',
          empresa_id: 5,
        },
        [
          {
            nombre_material: 'Tornillo',
            cantidad: 20,
          },
        ]
      );

      expect(connection.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO solicitud_items'),
        [52, null, null, 'Tornillo', null, 20, 'unidad']
      );
    });

    it('debe hacer rollback y relanzar el error si falla la transacción', async () => {
      const connection = createConnectionMock();
      const error = new Error('DB error');

      connection.query.mockRejectedValueOnce(error);
      db.getConnection.mockResolvedValueOnce(connection);

      await expect(
        repository.createSolicitud(
          {
            proveedor_id: 3,
            usuario_id: 8,
            plantilla_texto: 'Solicitud',
            empresa_id: 5,
          },
          []
        )
      ).rejects.toThrow('DB error');

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('debe procesar múltiples items en una misma solicitud', async () => {
      const connection = createConnectionMock();

      connection.query
        .mockResolvedValueOnce([{ insertId: 53 }])
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ id: 53 }]]);

      db.getConnection.mockResolvedValueOnce(connection);

      await repository.createSolicitud(
        {
          proveedor_id: 4,
          usuario_id: 9,
          plantilla_texto: 'Solicitud múltiple',
          empresa_id: 6,
        },
        [
          {
            material_id: 1,
            variante_id: 2,
            nombre_material: 'Perfil',
            color: 'Negro',
            cantidad: 5,
            unidad: 'm',
          },
          {
            nombre_material: 'Silicona',
            cantidad: 3,
          },
        ]
      );

      expect(connection.query).toHaveBeenCalledTimes(5);
      expect(connection.commit).toHaveBeenCalledTimes(1);

      expect(connection.query).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('INSERT INTO solicitud_items'),
        [53, null, null, 'Silicona', null, 3, 'unidad']
      );
    });
  });

  describe('marcarEnviada', () => {
    it('debe marcar la solicitud como enviada y retornar el registro', async () => {
      const solicitud = {
        id: 30,
        estado: 'enviada',
      };

      db.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[solicitud]]);

      const result = await repository.marcarEnviada(30);

      expect(result).toEqual(solicitud);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        "UPDATE solicitudes_materiales SET estado = 'enviada' WHERE id = ?",
        [30]
      );
    });
  });

  describe('getSolicitudes', () => {
    it('debe retornar solicitudes con sus items', async () => {
      const solicitudes = [
        {
          id: 1,
          proveedor_nombre: 'Proveedor A',
        },
        {
          id: 2,
          proveedor_nombre: 'Proveedor B',
        },
      ];

      const items1 = [
        { id: 101, solicitud_id: 1, nombre_material: 'Perfil' },
      ];

      const items2 = [
        { id: 102, solicitud_id: 2, nombre_material: 'Silicona' },
      ];

      db.query
        .mockResolvedValueOnce([solicitudes])
        .mockResolvedValueOnce([items1])
        .mockResolvedValueOnce([items2]);

      const result = await repository.getSolicitudes(5);

      expect(result).toEqual([
        {
          ...solicitudes[0],
          items: items1,
        },
        {
          ...solicitudes[1],
          items: items2,
        },
      ]);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('FROM solicitudes_materiales s'),
        [5, 50]
      );
    });

    it('debe respetar un límite personalizado', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([[{ id: 10 }]]);

      const result = await repository.getSolicitudes(8, { limit: 15 });

      expect(result).toEqual([
        {
          id: 1,
          items: [{ id: 10 }],
        },
      ]);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('LIMIT ?'),
        [8, 15]
      );
    });

    it('debe retornar solicitudes sin items cuando la consulta secundaria está vacía', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 5 }]])
        .mockResolvedValueOnce([[]]);

      const result = await repository.getSolicitudes(8);

      expect(result).toEqual([
        {
          id: 5,
          items: [],
        },
      ]);
    });
  });

  describe('getMateriales', () => {
    it('debe retornar los materiales activos de la empresa', async () => {
      const rows = [
        {
          id: 1,
          nombre: 'Perfil',
          stock: 20,
          activo: 1,
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await repository.getMateriales(5);

      expect(result).toEqual(rows);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM materiales'),
        [5]
      );
    });

    it('debe retornar arreglo vacío cuando no existen materiales', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await repository.getMateriales(5);

      expect(result).toEqual([]);
    });
  });
});
