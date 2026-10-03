import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  getConnection: vi.fn(),
  query: vi.fn(),
};

const connection = {
  beginTransaction: vi.fn(),
  execute: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database.js') return db;

  return originalLoad.call(this, request, parent, isMain);
};

const Pedido = require(
  `${process.cwd()}/src/modules/comercial/pedido/pedido.repository.js`
);

Module._load = originalLoad;

beforeEach(() => {
  vi.clearAllMocks();

  db.getConnection.mockResolvedValue(connection);
  connection.beginTransaction.mockResolvedValue();
  connection.commit.mockResolvedValue();
  connection.rollback.mockResolvedValue();
  connection.release.mockResolvedValue();
});

describe('Pedido.create', () => {
  it('debe crear un pedido sin proforma ni detalles', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 101 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    db.query.mockResolvedValueOnce([[
      {
        id: 101,
        empresa_id: 10,
        total: 0,
      },
    ]]);

    const data = {
      empresa_id: 10,
      fecha: '2026-09-23',
      estado: 'PENDIENTE',
      total: 200,
      observaciones: 'Sin detalles',
      proforma_id: null,
      detalles: [],
    };

    const result = await Pedido.create(data);

    expect(db.getConnection).toHaveBeenCalledTimes(1);
    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);

    expect(connection.execute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO pedidos'),
      [10, '2026-09-23', 'PENDIENTE', 200, 'Sin detalles', null]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      'UPDATE pedidos SET total = ? WHERE id = ?',
      [0, 101]
    );

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.id = ? AND p.empresa_id = ?'),
      [101, 10]
    );

    expect(result).toEqual([
      {
        id: 101,
        empresa_id: 10,
        total: 0,
      },
    ]);
  });

  it('debe aplicar valores por defecto cuando faltan datos opcionales', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 102 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    db.query.mockResolvedValueOnce([[]]);

    const data = {
      empresa_id: 10,
      total: 0,
    };

    const result = await Pedido.create(data);

    const insertParams = connection.execute.mock.calls[0][1];

    expect(insertParams[0]).toBe(10);
    expect(insertParams[1]).toBeInstanceOf(Date);
    expect(insertParams[2]).toBe('PENDIENTE');
    expect(insertParams[3]).toBe(0);
    expect(insertParams[4]).toBeNull();
    expect(insertParams[5]).toBeNull();

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('debe crear los detalles manuales y descontar stock', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 103 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    db.query.mockResolvedValueOnce([[
      {
        id: 103,
        total: 75,
      },
    ]]);

    const data = {
      empresa_id: 10,
      total: 999,
      detalles: [
        {
          material_id: 5,
          cantidad: 2,
          precio_unitario: 20,
          detalle: 'Vidrio',
        },
        {
          material_id: 8,
          cantidad: 1,
          precio_unitario: 35,
        },
      ],
    };

    const result = await Pedido.create(data);

    expect(connection.execute).toHaveBeenCalledTimes(6);

    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO pedido_detalle'),
      [103, 5, 2, 20, 'Vidrio']
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE materiales SET stock = stock - ?'),
      [2, 5, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO pedido_detalle'),
      [103, 8, 1, 35, null]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      6,
      'UPDATE pedidos SET total = ? WHERE id = ?',
      [75, 103]
    );

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 103, total: 75 }]);
  });

  it('debe crear el pedido desde una proforma y descontar stock', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 104 }])
      .mockResolvedValueOnce([[{ id: 20 }]])
      .mockResolvedValueOnce([[
        {
          material_id: 7,
          cantidad: 3,
          precio_unitario: 10,
        },
        {
          material_id: 9,
          cantidad: 2,
          precio_unitario: 15,
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    db.query.mockResolvedValueOnce([[
      {
        id: 104,
        total: 60,
      },
    ]]);

    const data = {
      empresa_id: 10,
      fecha: '2026-09-23',
      estado: 'PENDIENTE',
      total: 100,
      proforma_id: 20,
    };

    const result = await Pedido.create(data);

    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      'SELECT id FROM proformas WHERE id = ? AND empresa_id = ?',
      [20, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        'SELECT material_id, cantidad, precio_unitario\n           FROM proforma_detalle'
      ),
      [20]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO pedido_detalle'),
      [104, 7, 3, 10, null]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('UPDATE materiales SET stock = stock - ?'),
      [3, 7, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining('INSERT INTO pedido_detalle'),
      [104, 9, 2, 15, null]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      7,
      expect.stringContaining('UPDATE materiales SET stock = stock - ?'),
      [2, 9, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      8,
      'UPDATE pedidos SET total = ? WHERE id = ?',
      [60, 104]
    );

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 104, total: 60 }]);
  });

  it('debe hacer rollback cuando la proforma no existe', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 105 }])
      .mockResolvedValueOnce([[]]);

    const data = {
      empresa_id: 10,
      proforma_id: 999,
    };

    await expect(Pedido.create(data))
      .rejects
      .toThrow('Proforma no encontrada o no pertenece a esta empresa');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('debe hacer rollback y relanzar el error cuando falla una operación', async () => {
    const error = new Error('DB error');

    connection.execute
      .mockRejectedValueOnce(error);

    await expect(Pedido.create({
      empresa_id: 10,
      total: 100,
    })).rejects.toThrow('DB error');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('debe hacer rollback si falla el commit', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 106 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    connection.commit.mockRejectedValueOnce(new Error('Commit error'));

    await expect(Pedido.create({
      empresa_id: 10,
      total: 50,
    })).rejects.toThrow('Commit error');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});

describe('Pedido.getById', () => {
  it('debe devolver las filas cuando encuentra el pedido', async () => {
    const rows = [
      {
        id: 10,
        empresa_id: 10,
        detalle: 'Puerta',
      },
    ];

    db.query.mockResolvedValueOnce([rows]);

    const result = await Pedido.getById(10, 10);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.id = ? AND p.empresa_id = ?'),
      [10, 10]
    );

    expect(result).toEqual(rows);
  });

  it('debe devolver null cuando no encuentra el pedido', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const result = await Pedido.getById(99, 10);

    expect(result).toBeNull();
  });
});

describe('Pedido.delete', () => {
  it('debe eliminar detalles y pedido cuando existe', async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await Pedido.delete(20, 10);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('DELETE FROM pedido_detalle'),
      [20, 20, 10]
    );

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM pedidos WHERE id = ? AND empresa_id = ?',
      [20, 10]
    );

    expect(result).toBe(true);
  });

  it('debe devolver false cuando el pedido no afecta filas', async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const result = await Pedido.delete(20, 10);

    expect(result).toBe(false);
  });
});

describe('Pedido.cancelar', () => {
  it('debe cancelar y restaurar stock de materiales válidos', async () => {
    connection.execute
      .mockResolvedValueOnce([[{ estado: 'PROCESADO' }]])
      .mockResolvedValueOnce([[
        { material_id: 5, color_id: null, cantidad: 2 },
        { material_id: 8, color_id: null, cantidad: 3 },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await Pedido.cancelar(30, 10);

    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);

    expect(connection.execute).toHaveBeenNthCalledWith(
      1,
      'SELECT estado FROM pedidos WHERE id = ? AND empresa_id = ?',
      [30, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      'SELECT material_id, color_id, cantidad FROM pedido_detalle WHERE pedido_id = ?',
      [30]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE materiales SET stock = stock + ?'),
      [2, 5, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('UPDATE materiales SET stock = stock + ?'),
      [3, 8, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('UPDATE pedidos SET estado = ?'),
      ['CANCELADO', 30, 10]
    );

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('debe restaurar stock en la variante cuando el pedido tiene color', async () => {
    connection.execute
      .mockResolvedValueOnce([[{ estado: 'PROCESADO' }]])
      .mockResolvedValueOnce([[
        { material_id: 5, color_id: 4, cantidad: 2 },
      ]])
      .mockResolvedValueOnce([[{ id: 20 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await Pedido.cancelar(37, 10);

    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      'SELECT material_id, color_id, cantidad FROM pedido_detalle WHERE pedido_id = ?',
      [37]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('SELECT mv.id'),
      [5, 4, 10, 10]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      4,
      'UPDATE materiales_variantes SET stock = stock + ? WHERE material_id = ? AND color_id = ?',
      [2, 5, 4]
    );

    expect(connection.execute).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('UPDATE pedidos SET estado = ?'),
      ['CANCELADO', 37, 10]
    );

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('debe ignorar detalles sin material o con cantidad no positiva', async () => {
    connection.execute
      .mockResolvedValueOnce([[{ estado: 'PROCESADO' }]])
      .mockResolvedValueOnce([[
        { material_id: null, cantidad: 2 },
        { material_id: 5, cantidad: 0 },
        { material_id: 8, cantidad: -1 },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await Pedido.cancelar(31, 10);

    expect(connection.execute).toHaveBeenCalledTimes(3);
    expect(connection.execute).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE pedidos SET estado = ?'),
      ['CANCELADO', 31, 10]
    );

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('debe lanzar error si el pedido no existe', async () => {
    connection.execute.mockResolvedValueOnce([[]]);

    await expect(Pedido.cancelar(32, 10))
      .rejects
      .toThrow('Pedido no encontrado');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar error si el pedido ya está cancelado', async () => {
    connection.execute.mockResolvedValueOnce([[
      { estado: 'CANCELADO' },
    ]]);

    await expect(Pedido.cancelar(33, 10))
      .rejects
      .toThrow('El pedido ya está cancelado');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('debe devolver false si el UPDATE no afecta filas', async () => {
    connection.execute
      .mockResolvedValueOnce([[{ estado: 'PROCESADO' }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const result = await Pedido.cancelar(34, 10);

    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('debe hacer rollback cuando falla una operación durante la cancelación', async () => {
    const error = new Error('Cancel error');

    connection.execute
      .mockResolvedValueOnce([[{ estado: 'PROCESADO' }]])
      .mockRejectedValueOnce(error);

    await expect(Pedido.cancelar(35, 10))
      .rejects
      .toThrow('Cancel error');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('debe hacer rollback si falla el commit de la cancelación', async () => {
    connection.execute
      .mockResolvedValueOnce([[{ estado: 'PROCESADO' }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    connection.commit.mockRejectedValueOnce(new Error('Commit error'));

    await expect(Pedido.cancelar(36, 10))
      .rejects
      .toThrow('Commit error');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
