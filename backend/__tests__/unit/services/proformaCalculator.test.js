import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../config/database.js') return db;
  return originalLoad.call(this, request, parent, isMain);
};

const service = require(
  `${process.cwd()}/src/shared/services/proformaCalculator.js`
);

Module._load = originalLoad;

const {
  calcularPorRecetas,
  buildWhatsAppText,
} = service;

function mockQueries({
  iva = [{ valor: '0.15' }],
  trabajos = [{ id: 1, nombre: 'Ventana' }],
  colores = [{ id: 2, nombre: 'Negro' }],
  recetas = [{ material_id: 10, unidad_calculo: 'm2', factor: 1 }],
  variantRows = [{ precio: '20' }],
  materialRows = [{ id: 10, precio: '20' }],
} = {}) {
  db.query.mockImplementation(async (sql) => {
    if (sql.includes('SELECT valor FROM configuracion')) {
      return [iva];
    }

    if (sql.includes('SELECT id, nombre') && sql.includes('FROM trabajos')) {
      return [trabajos];
    }

    if (sql.includes('SELECT id, nombre') && sql.includes('FROM colores')) {
      return [colores];
    }

    if (sql.includes('SELECT r.material_id, r.unidad_calculo, r.factor') && sql.includes('FROM recetas r')) {
      return [recetas];
    }

    if (sql.includes('SELECT mv.precio') && sql.includes('FROM materiales_variantes mv')) {
      return [variantRows];
    }

    if (sql.includes('SELECT precio FROM materiales')) {
      return [materialRows];
    }

    throw new Error(`SQL no contemplado: ${sql}`);
  });
}

describe('proformaCalculator - calcularPorRecetas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calcula una proforma completa con m2 y variante por color', async () => {
    mockQueries();

    const result = await calcularPorRecetas(
      db,
      {
        cliente: ' Juan ',
        telefono: ' 0999999999 ',
        fecha: '2026-09-24',
        fecha_agendamiento: '2026-09-25',
        items: [
          {
            trabajo_id: 1,
            ancho: 2,
            alto: 1,
            cantidad: 2,
            color_id: 2,
            detalle: 'Vidrio templado',
          },
        ],
      },
      3);

    expect(result.cliente).toBe('Juan');
    expect(result.telefono).toBe('0999999999');
    expect(result.fecha).toBe('2026-09-24');
    expect(result.fecha_agendamiento).toBe('2026-09-25');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      trabajo_id: 1,
      trabajo_nombre: 'Ventana',
      ancho: 2,
      alto: 1,
      cantidad: 2,
      color_id: 2,
      color_nombre: 'Negro',
      detalle: 'Vidrio templado',
      subtotal: 80,
      precio_unitario: 40,
    });
    expect(result.materialesAgregados[0]).toMatchObject({
      material_id: 10,
      cantidad: 4,
      precio_unitario: 20,
      subtotal: 80,
    });
    expect(result.subtotal).toBe(80);
    expect(result.iva).toBe(12);
    expect(result.total).toBe(92);
    expect(result.iva_valor).toBe(0.15);
  });

  it('mantiene separado el mismo material cuando los items usan colores diferentes', async () => {
    mockQueries({
      trabajos: [
        { id: 1, nombre: 'Ventana' },
        { id: 2, nombre: 'Puerta' },
      ],
      colores: [
        { id: 2, nombre: 'Negro' },
        { id: 3, nombre: 'Blanco' },
      ],
      recetas: [
        { material_id: 10, unidad_calculo: 'm2', factor: 1 },
      ],
      variantRows: [{ precio: '20' }],
      materialRows: [{ id: 10, precio: '20' }],
    });

    const result = await calcularPorRecetas(
      db,
      {
        cliente: 'Cliente colores',
        items: [
          {
            trabajo_id: 1,
            ancho: 2,
            alto: 1,
            cantidad: 1,
            color_id: 2,
          },
          {
            trabajo_id: 2,
            ancho: 1,
            alto: 1,
            cantidad: 1,
            color_id: 3,
          },
        ],
      },
      3);

    expect(result.materialesAgregados).toHaveLength(2);
    expect(result.materialesAgregados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          material_id: 10,
          color_id: 2,
          cantidad: 2,
        }),
        expect.objectContaining({
          material_id: 10,
          color_id: 3,
          cantidad: 1,
        }),
      ])
    );
  });

  it('usa valores por defecto cuando faltan datos opcionales', async () => {
    mockQueries({
      iva: [],
      trabajos: [{ id: 1, nombre: 'Puerta' }],
      recetas: [{ material_id: 10, unidad_calculo: 'unidad', factor: 2 }],
      variantRows: [],
      materialRows: [{ id: 10, precio: '15' }],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 1,
            alto: 2,
          },
        ],
      },
      3);

    expect(result.cliente).toBe('SIN NOMBRE');
    expect(result.telefono).toBeNull();
    expect(result.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.fecha_agendamiento).toBeNull();
    expect(result.items[0].cantidad).toBe(1);
    expect(result.items[0].color_id).toBeNull();
    expect(result.items[0].color_nombre).toBeNull();
    expect(result.items[0].detalle).toBeNull();
    expect(result.subtotal).toBe(30);
    expect(result.iva).toBe(4.5);
    expect(result.total).toBe(34.5);
  });

  it('calcula unidades ml', async () => {
    mockQueries({
      recetas: [{ material_id: 10, unidad_calculo: 'ml', factor: 0.5 }],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 2,
            alto: 1,
            cantidad: 1,
          },
        ],
      },
      3);

    expect(result.items[0].materiales[0].cantidad).toBe(3);
    expect(result.subtotal).toBe(60);
  });

  it('calcula varias recetas y agrega materiales repetidos', async () => {
    mockQueries({
      recetas: [
        { material_id: 10, unidad_calculo: 'm2', factor: 1 },
        { material_id: 10, unidad_calculo: 'm2', factor: 0.5 },
      ],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 2,
            alto: 1,
            cantidad: 1,
          },
        ],
      },
      3);

    expect(result.items[0].materiales).toHaveLength(2);
    expect(result.materialesAgregados).toHaveLength(1);
    expect(result.materialesAgregados[0].cantidad).toBe(3);
    expect(result.materialesAgregados[0].subtotal).toBe(60);
    expect(result.subtotal).toBe(60);
  });

  it('usa precio del material cuando la variante no existe', async () => {
    mockQueries({
      variantRows: [],
      materialRows: [{ id: 10, precio: '25' }],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 1,
            alto: 1,
            color_id: 2,
          },
        ],
      },
      3);

    expect(result.items[0].materiales[0].precio_unitario).toBe(25);
  });

  it('usa precio del material cuando la variante tiene precio inválido', async () => {
    mockQueries({
      variantRows: [{ precio: '0' }],
      materialRows: [{ id: 10, precio: '30' }],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 1,
            alto: 1,
            color_id: 2,
          },
        ],
      },
      3);

    expect(result.items[0].materiales[0].precio_unitario).toBe(30);
  });

  it('rechaza una proforma sin items', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(db, { items: [] }, 3)
    ).rejects.toThrow('Debe enviar al menos 1 item');
  });

  it('rechaza items cuando items no es un arreglo', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(db, { items: null }, 3)
    ).rejects.toThrow('Debe enviar al menos 1 item');
  });

  it('rechaza medidas inválidas', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 0,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Medidas inválidas en item #1');

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: -1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Medidas inválidas en item #1');
  });

  it('rechaza cantidad inválida', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
              cantidad: 0,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Cantidad inválida en item #1');
  });

  it('rechaza trabajo inexistente', async () => {
    mockQueries({
      trabajos: [],
    });

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 99,
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Trabajo no existe: trabajo_id=99');
  });

  it('rechaza trabajo sin recetas', async () => {
    mockQueries({
      recetas: [],
    });

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('No hay recetas configuradas para el trabajo: Ventana');
  });

  it('rechaza una receta con material o factor inválido', async () => {
    mockQueries({
      recetas: [
        {
          material_id: 'abc',
          unidad_calculo: 'm2',
          factor: 1,
        },
      ],
    });

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Receta inválida');
  });

  it('rechaza una unidad de cálculo no soportada', async () => {
    mockQueries({
      recetas: [
        {
          material_id: 10,
          unidad_calculo: 'kg',
          factor: 1,
        },
      ],
    });

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('unidad_calculo no soportada: kg');
  });

  it('rechaza trabajo_id no numérico', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 'abc',
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Campo inválido: items[0].trabajo_id');
  });

  it('rechaza ancho no numérico', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 'abc',
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Campo inválido: items[0].ancho');
  });

  it('rechaza alto no numérico', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 'abc',
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Campo inválido: items[0].alto');
  });

  it('rechaza color_id no numérico', async () => {
    mockQueries();

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
              color_id: 'abc',
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Campo inválido: items[0].color_id');
  });

  it('rechaza material inexistente', async () => {
    mockQueries({
      materialRows: [],
      variantRows: [],
    });

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Material no existe: material_id=10');
  });

  it('rechaza precio de material inválido', async () => {
    mockQueries({
      materialRows: [{ id: 10, precio: 'abc' }],
      variantRows: [],
    });

    await expect(
      calcularPorRecetas(
        db,
        {
          items: [
            {
              trabajo_id: 1,
              ancho: 1,
              alto: 1,
            },
          ],
        }
      , 3)
    ).rejects.toThrow('Precio inválido en materiales.id=10');
  });

  it('usa IVA 0.15 cuando la configuración contiene un valor inválido', async () => {
    mockQueries({
      iva: [{ valor: 'abc' }],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 1,
            alto: 1,
          },
        ],
      },
      3);

    expect(result.iva_valor).toBe(0.15);
  });

  it('maneja color inexistente sin nombre', async () => {
    mockQueries({
      colores: [],
    });

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 1,
            alto: 1,
            color_id: 99,
          },
        ],
      },
      3);

    expect(result.items[0].color_nombre).toBeNull();
  });

  it('acepta cantidad decimal y la normaliza a entero en el item', async () => {
    mockQueries();

    const result = await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 1,
            alto: 1,
            cantidad: 2.7,
          },
        ],
      },
      3);

    expect(result.items[0].cantidad).toBe(3);
  });
  it('aplica aislamiento por empresa en todas las consultas del cálculo', async () => {
    mockQueries();

    await calcularPorRecetas(
      db,
      {
        items: [
          {
            trabajo_id: 1,
            ancho: 2,
            alto: 1,
            cantidad: 1,
            color_id: 2,
          },
        ],
      },
      7
    );

    const calls = db.query.mock.calls;

    const ivaCall = calls.find(([sql]) =>
      sql.includes('SELECT valor FROM configuracion')
    );
    expect(ivaCall?.[1]).toEqual([7]);

    const trabajosCall = calls.find(([sql]) =>
      sql.includes('FROM trabajos')
    );
    expect(trabajosCall?.[1]).toEqual([1, 7]);

    const coloresCall = calls.find(([sql]) =>
      sql.includes('FROM colores')
    );
    expect(coloresCall?.[1]).toEqual([2, 7]);

    const recetasCall = calls.find(([sql]) =>
      sql.includes('FROM recetas r')
    );
    expect(recetasCall?.[1]).toEqual([1, 7, 7]);

    const varianteCall = calls.find(([sql]) =>
      sql.includes('FROM materiales_variantes mv')
    );
    expect(varianteCall?.[1]).toEqual([10, 2, 7, 7]);

    const materialCall = calls.find(([sql]) =>
      sql.includes('SELECT precio FROM materiales')
    );
    expect(materialCall).toBeUndefined();
  });

});

describe('proformaCalculator - buildWhatsAppText', () => {
  it('construye texto completo con teléfono, color y detalle', () => {
    const result = buildWhatsAppText({
      cliente: 'Juan',
      telefono: '0999999999',
      fecha: '2026-09-24',
      subtotal: 100,
      total: 115,
      items: [
        {
          item_num: 1,
          trabajo_nombre: 'Ventana',
          ancho: 2,
          alto: 1,
          color_nombre: 'Negro',
          detalle: 'Vidrio templado',
          subtotal: 100,
        },
      ],
    });

    expect(result).toContain('*PROFORMA - COTIZACIÓN*');
    expect(result).toContain('Juan');
    expect(result).toContain('0999999999');
    expect(result).toContain('24/09/2026');
    expect(result).toContain('Negro');
    expect(result).toContain('Vidrio templado');
    expect(result).toContain('$100.00');
    expect(result).toContain('$115.00');
  });

  it('maneja fecha, totales, color y detalle ausentes', () => {
    const result = buildWhatsAppText({
      cliente: 'SIN NOMBRE',
      telefono: null,
      fecha: '',
      subtotal: 0,
      total: 0,
      items: [
        {
          item_num: 1,
          trabajo_nombre: 'Puerta',
          ancho: 1,
          alto: 2,
          color_nombre: null,
          detalle: null,
          subtotal: 0,
        },
      ],
    });

    expect(result).toContain('SIN NOMBRE');
    expect(result).not.toContain('📞 *Tel:*');
    expect(result).toContain('🎨 Color: N/A');
    expect(result).not.toContain('📝 Detalle:');
    expect(result).toContain('$0.00');
  });
});
