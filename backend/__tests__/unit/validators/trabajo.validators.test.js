import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { agendarPedidoTrabajoSchema } = require(
  `${process.cwd()}/src/shared/validators/trabajo.validators.js`
);

describe('trabajo.validators', () => {
  const itemValido = {
    material_id: 1,
    cantidad: 2,
    total: 50,
  };

  const datosValidos = {
    total: 100,
    fecha_entrega: '2026-09-30',
    items: [itemValido],
  };

  it('debe aceptar un pedido válido', () => {
    const result = agendarPedidoTrabajoSchema.safeParse(datosValidos);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(datosValidos);
  });

  it('debe aceptar cliente opcional', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      cliente: 'Juan Pérez',
    });

    expect(result.success).toBe(true);
    expect(result.data.cliente).toBe('Juan Pérez');
  });

  it('debe aceptar cliente ausente', () => {
    const result = agendarPedidoTrabajoSchema.safeParse(datosValidos);

    expect(result.success).toBe(true);
    expect(result.data.cliente).toBeUndefined();
  });

  it('debe rechazar total cero o negativo', () => {
    for (const total of [0, -1]) {
      const result = agendarPedidoTrabajoSchema.safeParse({
        ...datosValidos,
        total,
      });

      expect(result.success).toBe(false);
    }
  });

  it('debe rechazar fecha_entrega vacía', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      fecha_entrega: '',
    });

    expect(result.success).toBe(false);
  });

  it('debe rechazar items vacíos', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it('debe rechazar un item sin material_id', () => {
    const { material_id: _material_id, ...item } = itemValido;

    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      items: [item],
    });

    expect(result.success).toBe(false);
  });

  it('debe rechazar material_id no entero o no positivo', () => {
    for (const material_id of [1.5, 0, -1]) {
      const result = agendarPedidoTrabajoSchema.safeParse({
        ...datosValidos,
        items: [{ ...itemValido, material_id }],
      });

      expect(result.success).toBe(false);
    }
  });

  it('debe rechazar cantidad cero o negativa', () => {
    for (const cantidad of [0, -1]) {
      const result = agendarPedidoTrabajoSchema.safeParse({
        ...datosValidos,
        items: [{ ...itemValido, cantidad }],
      });

      expect(result.success).toBe(false);
    }
  });

  it('debe rechazar total de item negativo', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      items: [{ ...itemValido, total: -1 }],
    });

    expect(result.success).toBe(false);
  });

  it('debe aceptar total de item igual a cero', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      items: [{ ...itemValido, total: 0 }],
    });

    expect(result.success).toBe(true);
  });

  it('debe rechazar cliente con más de 200 caracteres', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      cliente: 'A'.repeat(201),
    });

    expect(result.success).toBe(false);
  });

  it('debe recortar espacios del cliente', () => {
    const result = agendarPedidoTrabajoSchema.safeParse({
      ...datosValidos,
      cliente: '  Juan Pérez  ',
    });

    expect(result.success).toBe(true);
    expect(result.data.cliente).toBe('Juan Pérez');
  });
});
