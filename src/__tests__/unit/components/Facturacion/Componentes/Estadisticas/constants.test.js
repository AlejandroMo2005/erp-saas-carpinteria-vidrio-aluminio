import { describe, expect, it } from 'vitest';
import {
  COLORES_ESTADO,
  COLORES_GRAFICO,
  PERIODOS,
} from '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/constants';

describe('constants de Estadisticas', () => {
  it('define los colores de todos los estados de factura', () => {
    expect(COLORES_ESTADO).toEqual({
      BORRADOR: '#6b7280',
      EMITIDA: '#3b82f6',
      AUTORIZADA: '#10b981',
      ANULADA: '#ef4444',
      DEVUELTA: '#f59e0b',
      NO_AUTORIZADA: '#dc2626',
    });
  });

  it('define los colores utilizados por los gráficos', () => {
    expect(COLORES_GRAFICO).toEqual([
      '#6366f1',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#3b82f6',
      '#8b5cf6',
    ]);
  });

  it('define los periodos disponibles para las estadísticas', () => {
    expect(PERIODOS).toEqual([
      { valor: '3m', label: 'Últimos 3 meses' },
      { valor: '6m', label: 'Últimos 6 meses' },
      { valor: '12m', label: 'Último año' },
    ]);
  });

  it('mantiene tres opciones de periodo y seis colores de gráfico', () => {
    expect(PERIODOS).toHaveLength(3);
    expect(COLORES_GRAFICO).toHaveLength(6);
    expect(Object.keys(COLORES_ESTADO)).toHaveLength(6);
  });
});
