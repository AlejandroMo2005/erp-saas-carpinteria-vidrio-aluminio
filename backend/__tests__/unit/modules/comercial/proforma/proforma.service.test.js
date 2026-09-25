import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const logger = {
  warn: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../../utils/logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const service = require(
  `${process.cwd()}/src/modules/comercial/proforma/proforma.service.js`
);

Module._load = originalLoad;

function createConnection(queryImpl = vi.fn()) {
  return {
    query: queryImpl,
  };
}

describe('proforma.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('utilidades puras', () => {
    it('debe redondear valores a dos decimales', () => {
      expect(service.round2(10.126)).toBe(10.13);
      expect(service.round2('5.5')).toBe(5.5);
      expect(service.round2(null)).toBe(0);
    });

    it('debe identificar items legacy', () => {
      expect(service.isLegacyItems([{ material_id: 10 }])).toBe(true);
      expect(service.isLegacyItems([{ material_id: null }])).toBe(false);
      expect(service.isLegacyItems([])).toBe(false);
      expect(service.isLegacyItems(null)).toBe(false);
    });

    it('debe identificar items de recetas', () => {
      expect(service.isRecipeItems([{ trabajo_id: 10 }])).toBe(true);
      expect(service.isRecipeItems([{ trabajo_id: null }])).toBe(false);
      expect(service.isRecipeItems([])).toBe(false);
      expect(service.isRecipeItems(null)).toBe(false);
    });

    it('debe normalizar fechas válidas', () => {
      expect(service.safeDate('2026-09-23')).toBe('2026-09-23');
      expect(service.safeDate('2026-09-23T15:30:00')).toBe('2026-09-23');
    });

    it('debe usar la fecha actual cuando no recibe una fecha válida', () => {
      const result = service.safeDate('');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('validarYRestarStock', () => {
    it('debe descontar stock de una variante con color', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ id: 5, stock: 20 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStock(
        connection,
        [{ material_id: 10, cantidad: 5 }],
        [{ color_id: 3 }],
        7
      );

      expect(query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT id, stock FROM materiales_variantes'),
        [10, 3]
      );

      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE materiales_variantes'),
        [5, 10, 3]
      );
    });

    it('debe usar material general cuando no existe variante', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ nombre: 'Perfil aluminio', stock: 30 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStock(
        connection,
        [{ material_id: 10, cantidad: 5 }],
        [{ color_id: 3 }],
        7
      );

      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('SELECT nombre, stock FROM materiales'),
        [10, 7]
      );

      expect(query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('UPDATE materiales SET stock'),
        [5, 10, 7]
      );
    });

    it('debe usar material general cuando no existe color', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ nombre: 'Vidrio', stock: 15 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStock(
        connection,
        [{ material_id: 10, cantidad: 4 }],
        [{}],
        7
      );

      expect(query).toHaveBeenCalledTimes(2);
    });

    it('debe rechazar una cantidad inválida', async () => {
      const connection = createConnection();

      await expect(
        service.validarYRestarStock(
          connection,
          [{ material_id: 10, cantidad: 0 }],
          [{}],
          7
        )
      ).rejects.toThrow('Cantidad invalida para material #10');
    });

    it('debe rechazar stock insuficiente en una variante', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ id: 5, stock: 2 }]])
        .mockResolvedValueOnce([[{ nombre: 'Perfil' }]])
        .mockResolvedValueOnce([[{ nombre: 'Blanco' }]]);

      const connection = createConnection(query);

      await expect(
        service.validarYRestarStock(
          connection,
          [{ material_id: 10, cantidad: 5 }],
          [{ color_id: 3 }],
          7
        )
      ).rejects.toThrow(
        'Stock insuficiente: Perfil (Blanco). Disponible: 2, Requerido: 5'
      );
    });

    it('debe rechazar material inexistente', async () => {
      const query = vi.fn().mockResolvedValueOnce([[]]);
      const connection = createConnection(query);

      await expect(
        service.validarYRestarStock(
          connection,
          [{ material_id: 10, cantidad: 5 }],
          [{}],
          7
        )
      ).rejects.toThrow('Material no encontrado: ID 10');
    });

    it('debe rechazar stock insuficiente del material general', async () => {
      const query = vi.fn().mockResolvedValueOnce([
        [{ nombre: 'Vidrio', stock: 2 }],
      ]);

      const connection = createConnection(query);

      await expect(
        service.validarYRestarStock(
          connection,
          [{ material_id: 10, cantidad: 5 }],
          [{}],
          7
        )
      ).rejects.toThrow(
        'Stock insuficiente: Vidrio. Disponible: 2, Requerido: 5'
      );
    });

    it('debe procesar múltiples materiales', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ nombre: 'Perfil', stock: 20 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ nombre: 'Vidrio', stock: 30 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStock(
        connection,
        [
          { material_id: 10, cantidad: 5 },
          { material_id: 20, cantidad: 8 },
        ],
        [{}],
        7
      );

      expect(query).toHaveBeenCalledTimes(4);
    });
  });

  describe('validarYRestarStockLegacy', () => {
    it('debe descontar stock de una variante con color', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ id: 5, stock: 20 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStockLegacy(
        connection,
        [{ material_id: 10, cantidad: 5, color_id: 3 }],
        7
      );

      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE materiales_variantes'),
        [5, 10, 3]
      );
    });

    it('debe usar material general cuando no existe variante', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ nombre: 'Perfil', stock: 20 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStockLegacy(
        connection,
        [{ material_id: 10, cantidad: 5, color_id: 3 }],
        7
      );

      expect(query).toHaveBeenCalledTimes(3);
    });

    it('debe usar material general cuando no existe color', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ nombre: 'Vidrio', stock: 20 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStockLegacy(
        connection,
        [{ material_id: 10, cantidad: 5 }],
        7
      );

      expect(query).toHaveBeenCalledTimes(2);
    });

    it('debe rechazar una cantidad inválida', async () => {
      const connection = createConnection();

      await expect(
        service.validarYRestarStockLegacy(
          connection,
          [{ material_id: 10, cantidad: 0 }],
          7
        )
      ).rejects.toThrow('Cantidad invalida en item #1');
    });

    it('debe rechazar stock insuficiente en variante', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ id: 5, stock: 2 }]])
        .mockResolvedValueOnce([[{ nombre: 'Perfil' }]])
        .mockResolvedValueOnce([[{ nombre: 'Negro' }]]);

      const connection = createConnection(query);

      await expect(
        service.validarYRestarStockLegacy(
          connection,
          [{ material_id: 10, cantidad: 5, color_id: 3 }],
          7
        )
      ).rejects.toThrow(
        'Stock insuficiente: Perfil (Negro). Disponible: 2, Requerido: 5'
      );
    });

    it('debe rechazar material inexistente', async () => {
      const query = vi.fn().mockResolvedValueOnce([[]]);
      const connection = createConnection(query);

      await expect(
        service.validarYRestarStockLegacy(
          connection,
          [{ material_id: 10, cantidad: 5 }],
          7
        )
      ).rejects.toThrow('Material no encontrado: ID 10');
    });

    it('debe rechazar stock insuficiente del material general', async () => {
      const query = vi.fn().mockResolvedValueOnce([
        [{ nombre: 'Vidrio', stock: 2 }],
      ]);

      const connection = createConnection(query);

      await expect(
        service.validarYRestarStockLegacy(
          connection,
          [{ material_id: 10, cantidad: 5 }],
          7
        )
      ).rejects.toThrow(
        'Stock insuficiente: Vidrio. Disponible: 2, Requerido: 5'
      );
    });

    it('debe procesar múltiples items', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ nombre: 'Perfil', stock: 20 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ nombre: 'Vidrio', stock: 30 }]])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);

      await service.validarYRestarStockLegacy(
        connection,
        [
          { material_id: 10, cantidad: 5 },
          { material_id: 20, cantidad: 8 },
        ],
        7
      );

      expect(query).toHaveBeenCalledTimes(4);
    });
  });


});
