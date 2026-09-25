import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const logger = {
  warn: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../config/database') return db;
  if (request === '../../shared/utils/logger') return logger;

  return originalLoad.call(this, request, parent, isMain);
};

const repository = require(
  `${process.cwd()}/src/modules/configuracion/configuracion.repository.js`
);

Module._load = originalLoad;

describe('configuracion.repository', () => {
  it('obtenerTodos debe retornar todas las configuraciones de la empresa', async () => {
    const rows = [
      { clave: 'EMPRESA_NOMBRE', valor: 'Vidriería ABC' },
      { clave: 'IVA', valor: '0.15' },
    ];

    db.query.mockResolvedValueOnce([rows]);

    const result = await repository.obtenerTodos(7);

    expect(result).toEqual(rows);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT clave, valor'),
      [7]
    );
  });

  it('obtenerValor debe retornar el valor cuando la clave existe', async () => {
    db.query.mockResolvedValueOnce([
      [{ valor: '0.15' }],
    ]);

    const result = await repository.obtenerValor('IVA', 7);

    expect(result).toBe('0.15');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE clave = ? AND empresa_id = ?'),
      ['IVA', 7]
    );
  });

  it('obtenerValor debe retornar null cuando la clave no existe', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const result = await repository.obtenerValor('IVA', 7);

    expect(result).toBeNull();
  });

  it('guardarValor debe convertir el valor a String y ejecutar el upsert', async () => {
    db.query.mockResolvedValueOnce([{}]);

    await repository.guardarValor('IVA', 0.15, 7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO configuracion'),
      [7, 'IVA', '0.15']
    );
  });

  it('obtenerTasaIva debe retornar el IVA configurado', async () => {
    db.query.mockResolvedValueOnce([
      [{ valor: '0.12' }],
    ]);

    const result = await repository.obtenerTasaIva(7);

    expect(result).toBe(0.12);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('obtenerTasaIva debe usar IVA_DEFAULT cuando no existe la clave', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const result = await repository.obtenerTasaIva(7);

    expect(result).toBe(0.15);
    expect(logger.warn).toHaveBeenCalledWith(
      'CONFIG_IVA_DEFAULT',
      expect.objectContaining({
        event: 'configuracion.iva_default',
        empresaId: 7,
      })
    );
  });

  it('obtenerTasaIva debe usar IVA_DEFAULT cuando el valor no es numérico', async () => {
    db.query.mockResolvedValueOnce([
      [{ valor: 'IVA_INVALIDO' }],
    ]);

    const result = await repository.obtenerTasaIva(7);

    expect(result).toBe(0.15);
  });

  it('obtenerTasaIva debe aceptar valores numéricos almacenados como texto', async () => {
    db.query.mockResolvedValueOnce([
      [{ valor: '0.18' }],
    ]);

    const result = await repository.obtenerTasaIva(10);

    expect(result).toBe(0.18);
  });
});
