import { describe, expect, it } from 'vitest';
import { agruparPorProveedor } from '../../../../../../presentation/components/Facturacion/Proveedores/AlertasStock/utils';

describe('agruparPorProveedor', () => {
  it('devuelve un arreglo vacío cuando no hay alertas', () => {
    expect(agruparPorProveedor([])).toEqual([]);
  });

  it('agrupa las alertas del mismo proveedor', () => {
    const alerta1 = {
      proveedor_id: 1,
      proveedor: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '0991111111',
      material: 'Vidrio 6mm',
    };

    const alerta2 = {
      proveedor_id: 1,
      proveedor: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '0991111111',
      material: 'Aluminio',
    };

    const resultado = agruparPorProveedor([alerta1, alerta2]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      proveedor_id: 1,
      proveedor: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '0991111111',
    });
    expect(resultado[0].items).toEqual([alerta1, alerta2]);
  });

  it('mantiene separados los proveedores con diferentes identificadores', () => {
    const alerta1 = {
      proveedor_id: 1,
      proveedor: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '0991111111',
    };

    const alerta2 = {
      proveedor_id: 2,
      proveedor: 'Proveedor B',
      ciudad: 'Portoviejo',
      telefono_whatsapp: '0992222222',
    };

    const resultado = agruparPorProveedor([alerta1, alerta2]);

    expect(resultado).toHaveLength(2);
    expect(resultado[0].items).toEqual([alerta1]);
    expect(resultado[1].items).toEqual([alerta2]);
  });

  it('agrupa bajo la clave null las alertas sin proveedor_id', () => {
    const alerta1 = {
      proveedor_id: null,
      proveedor: null,
      ciudad: null,
      telefono_whatsapp: null,
      material: 'Vidrio',
    };

    const alerta2 = {
      proveedor_id: undefined,
      proveedor: undefined,
      ciudad: undefined,
      telefono_whatsapp: undefined,
      material: 'Aluminio',
    };

    const resultado = agruparPorProveedor([alerta1, alerta2]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].proveedor_id).toBeNull();
    expect(resultado[0].items).toEqual([alerta1, alerta2]);
  });
});
