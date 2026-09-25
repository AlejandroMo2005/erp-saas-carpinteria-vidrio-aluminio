import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database') return db;
  return originalLoad.call(this, request, parent, isMain);
};

const repository = require(
  `${process.cwd()}/src/modules/dashboard/dashboard.repository.js`
);

Module._load = originalLoad;

describe('dashboard.repository', () => {
  it('getResumenGeneral ejecuta query sin filtros de fecha', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const result = await repository.getResumenGeneral(null, null, 7);

    expect(result).toEqual([[]]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.empresa_id = ?'),
      [7]
    );
  });

  it('getResumenGeneral agrega filtro desde', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getResumenGeneral('2026-01-01', null, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND p.fecha >= ?'),
      [7, '2026-01-01']
    );
  });

  it('getResumenGeneral agrega filtro hasta', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getResumenGeneral(null, '2026-12-31', 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND p.fecha <= ?'),
      [7, '2026-12-31']
    );
  });

  it('getResumenGeneral agrega ambos filtros', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getResumenGeneral(
      '2026-01-01',
      '2026-12-31',
      7
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND p.fecha >= ?'),
      [7, '2026-01-01', '2026-12-31']
    );
  });

  it.each([
    ['dia', '%Y-%m-%d'],
    ['semana', '%x-W%v'],
    ['mes', '%Y-%m'],
    ['anio', '%Y'],
  ])('getIngresosPorPeriodo usa formato %s', async (periodo, formato) => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getIngresosPorPeriodo(periodo, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DATE_FORMAT(fecha, ?)'),
      [formato, 7]
    );
  });

  it('getIngresosPorPeriodo usa mes para periodo desconocido', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getIngresosPorPeriodo('desconocido', 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DATE_FORMAT(fecha, ?)'),
      ['%Y-%m', 7]
    );
  });

  it('getIngresosPorPeriodo usa mes por defecto', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getIngresosPorPeriodo(undefined, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DATE_FORMAT(fecha, ?)'),
      ['%Y-%m', 7]
    );
  });

  it('getPedidosRecientes usa límite numérico', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getPedidosRecientes('15', 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [7, 15]
    );
  });

  it('getPedidosRecientes usa límite por defecto', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getPedidosRecientes(undefined, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [7, 10]
    );
  });

  it('getIngresosPorUsuario consulta por empresa', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getIngresosPorUsuario(7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.empresa_id = ?'),
      [7]
    );
  });

  it('getTopProductos sin fechas construye parámetros correctamente', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getTopProductos(12, null, null, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [7, 7, 12]
    );
  });

  it('getTopProductos agrega fecha inicial', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getTopProductos(12, '2026-01-01', null, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND p.fecha >= ?'),
      [7, 7, '2026-01-01', 12]
    );
  });

  it('getTopProductos agrega fecha final', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getTopProductos(12, null, '2026-12-31', 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND p.fecha <= ?'),
      [7, 7, '2026-12-31', 12]
    );
  });

  it('getTopProductos agrega ambas fechas', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getTopProductos(
      '20',
      '2026-01-01',
      '2026-12-31',
      7
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND p.fecha >= ?'),
      [7, 7, '2026-01-01', '2026-12-31', 20]
    );
  });

  it('getMaterialesVariantes consulta materiales de la empresa', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getMaterialesVariantes(7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE m.empresa_id = ?'),
      [7]
    );
  });

  it('getTrabajoStats usa empresaId en ambas condiciones', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getTrabajoStats(7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE t.empresa_id = ?'),
      [7, 7]
    );
  });

  it('getVentasPorEstado consulta pedidos de la empresa', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await repository.getVentasPorEstado(7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE empresa_id = ?'),
      [7]
    );
  });
});
