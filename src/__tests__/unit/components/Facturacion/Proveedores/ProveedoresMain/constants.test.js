import { describe, expect, it } from 'vitest';
import { TABS } from '../../../../../../presentation/components/Facturacion/Proveedores/ProveedoresMain/constants';

describe('TABS', () => {
  it('define las tres secciones de proveedores en el orden esperado', () => {
    expect(TABS).toHaveLength(3);

    expect(TABS.map(tab => tab.id)).toEqual([
      'proveedores',
      'alertas',
      'historial',
    ]);

    expect(TABS.map(tab => tab.label)).toEqual([
      'Proveedores',
      'Alertas stock',
      'Historial',
    ]);
  });

  it('asigna un componente Icon a cada sección', () => {
    for (const tab of TABS) {
      expect(typeof tab.Icon).toBe('object');
      expect(tab.Icon).toBeTruthy();
    }
  });
});
