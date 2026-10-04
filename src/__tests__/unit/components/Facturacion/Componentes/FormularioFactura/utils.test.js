import { describe, expect, it } from 'vitest';
import {
  buildDescripcion,
  distribuirTotal,
  calcularItem,
  calcularTotales,
} from '../../../../../../presentation/components/Facturacion/Componentes/FormularioFactura/utils';

describe('buildDescripcion', () => {
  it('construye la descripción con trabajo, dimensiones, color y detalle', () => {
    expect(buildDescripcion({
      trabajo_nombre: 'Ventana',
      ancho: 120,
      alto: 80,
      color_nombre: 'Negro',
      detalle: 'Vidrio templado',
    })).toBe('Ventana — 120×80 cm — Negro — Vidrio templado');
  });

  it('usa descripcion cuando no existe trabajo_nombre', () => {
    expect(buildDescripcion({
      descripcion: 'Puerta',
    })).toBe('Puerta');
  });

  it('usa el nombre del material como alternativa', () => {
    expect(buildDescripcion({
      material: { nombre: 'Vidrio claro' },
    })).toBe('Vidrio claro');
  });

  it('omite dimensiones cuando no son positivas', () => {
    expect(buildDescripcion({
      trabajo_nombre: 'Ventana',
      ancho: 0,
      alto: 80,
    })).toBe('Ventana');
  });

  it('omite el detalle cuando coincide con el nombre', () => {
    expect(buildDescripcion({
      trabajo_nombre: 'Ventana',
      detalle: 'Ventana',
    })).toBe('Ventana');
  });

  it('devuelve Servicio cuando no existe información descriptiva', () => {
    expect(buildDescripcion({})).toBe('Servicio');
  });
});

describe('distribuirTotal', () => {
  it('devuelve ceros cuando el total no es positivo', () => {
    const items = [{ cantidad: 1 }, { cantidad: 2 }];

    expect(distribuirTotal(items, 0)).toEqual([0, 0]);
    expect(distribuirTotal(items, null)).toEqual([0, 0]);
  });

  it('distribuye el total proporcionalmente al área', () => {
    const items = [
      { ancho: 100, alto: 100, cantidad: 1 },
      { ancho: 200, alto: 100, cantidad: 1 },
    ];

    expect(distribuirTotal(items, 300)).toEqual([100, 200]);
  });

  it('considera la cantidad al distribuir por área', () => {
    const items = [
      { ancho: 100, alto: 100, cantidad: 1 },
      { ancho: 100, alto: 100, cantidad: 2 },
    ];

    expect(distribuirTotal(items, 300)).toEqual([100, 100]);
  });

  it('distribuye por cantidad cuando no todos los ítems tienen área', () => {
    const items = [
      { cantidad: 1 },
      { cantidad: 2 },
    ];

    expect(distribuirTotal(items, 300)).toEqual([100, 100]);
  });

  it('usa cantidad uno cuando la cantidad no es válida', () => {
    const items = [
      { cantidad: 0 },
      { cantidad: 2 },
    ];

    expect(distribuirTotal(items, 300)).toEqual([100, 100]);
  });
});

describe('calcularItem', () => {
  it('calcula subtotal, IVA y total', () => {
    expect(calcularItem({
      cantidad: 2,
      precio_unitario: 100,
      descuento: 10,
      aplica_iva: true,
    }, 0.15)).toEqual({
      subtotal: 190,
      iva: 28.5,
      total: 218.5,
    });
  });

  it('calcula el subtotal sin IVA cuando aplica_iva es falso', () => {
    expect(calcularItem({
      cantidad: 2,
      precio_unitario: 100,
      descuento: 10,
      aplica_iva: false,
    }, 0.15)).toEqual({
      subtotal: 190,
      iva: 0,
      total: 190,
    });
  });

  it('evita resultados negativos por descuento', () => {
    expect(calcularItem({
      cantidad: 1,
      precio_unitario: 50,
      descuento: 100,
      aplica_iva: true,
    }, 0.15)).toEqual({
      subtotal: 0,
      iva: 0,
      total: 0,
    });
  });

  it('usa cero para valores numéricos inválidos', () => {
    expect(calcularItem({
      cantidad: '',
      precio_unitario: '',
      descuento: '',
      aplica_iva: true,
    }, 0.15)).toEqual({
      subtotal: 0,
      iva: 0,
      total: 0,
    });
  });
});

describe('calcularTotales', () => {
  it('acumula correctamente ítems con y sin IVA', () => {
    const items = [
      {
        cantidad: 2,
        precio_unitario: 100,
        descuento: 10,
        aplica_iva: true,
      },
      {
        cantidad: 1,
        precio_unitario: 50,
        descuento: 0,
        aplica_iva: false,
      },
    ];

    expect(calcularTotales(items, 0.15)).toEqual({
      subtotal_sin_iva: 50,
      subtotal_con_iva: 190,
      iva: 28.5,
      total: 268.5,
    });
  });

  it('devuelve ceros para una lista vacía', () => {
    expect(calcularTotales([], 0.15)).toEqual({
      subtotal_sin_iva: 0,
      subtotal_con_iva: 0,
      iva: 0,
      total: 0,
    });
  });
});
