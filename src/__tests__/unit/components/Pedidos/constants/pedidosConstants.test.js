import { describe, expect, it, vi } from 'vitest';
import {
  CLASES_BTN_ESTADO,
  ETIQUETAS_ESTADO,
  ETIQUETAS_ESTADO_CLIENTE,
  FILTROS_ESTADO,
  PERIODOS,
  TRANSICIONES,
  UNA_SEMANA_MS,
} from '../../../../../presentation/components/Pedidos/constants/pedidosConstants';

describe('pedidosConstants', () => {
  it('define las transiciones de estado permitidas', () => {
    expect(TRANSICIONES).toEqual({
      PENDIENTE: ['ENTREGADO', 'CANCELADO'],
      ENTREGADO: [],
      CANCELADO: [],
    });
  });

  it('define las etiquetas de las acciones de estado', () => {
    expect(ETIQUETAS_ESTADO).toEqual({
      ENTREGADO: 'Marcar como Entregado',
      CANCELADO: 'Cancelar pedido',
    });
  });

  it('define las clases CSS de las acciones de estado', () => {
    expect(CLASES_BTN_ESTADO).toEqual({
      ENTREGADO: 'btn-estado btn-estado--entregado',
      CANCELADO: 'btn-estado btn-estado--cancelar',
    });
  });

  it('define las etiquetas de estado visibles para clientes', () => {
    expect(ETIQUETAS_ESTADO_CLIENTE).toEqual({
      PENDIENTE: '⏳ Pendiente',
      ENTREGADO: '✅ Entregado',
      CANCELADO: '❌ Cancelado',
    });
  });

  it('define una semana en milisegundos', () => {
    expect(UNA_SEMANA_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('define todos los filtros de estado', () => {
    expect(FILTROS_ESTADO.map(({ valor, label }) => ({ valor, label }))).toEqual([
      { valor: 'activos', label: 'Activos' },
      { valor: 'pendientes', label: 'Pendientes' },
      { valor: 'entregados', label: 'Entregados' },
      { valor: 'cancelados', label: 'Cancelados' },
      { valor: 'todos', label: 'Todos' },
    ]);
  });

  it('filtra pedidos activos según estado y antigüedad', () => {
    vi.useFakeTimers();
    const ahora = new Date('2026-09-25T12:00:00.000Z');
    vi.setSystemTime(ahora);

    const activos = FILTROS_ESTADO.find((f) => f.valor === 'activos');
    const haceSeisDias = new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000);
    const haceOchoDias = new Date(ahora.getTime() - 8 * 24 * 60 * 60 * 1000);

    expect(activos.fn({ estado: 'PENDIENTE', fecha: haceOchoDias })).toBe(true);
    expect(activos.fn({ estado: 'ENTREGADO', fecha: haceSeisDias })).toBe(true);
    expect(activos.fn({ estado: 'ENTREGADO', fecha: haceOchoDias })).toBe(false);
    expect(activos.fn({ estado: 'CANCELADO', fecha: haceSeisDias })).toBe(false);

    vi.useRealTimers();
  });

  it('filtra pendientes', () => {
    const filtro = FILTROS_ESTADO.find((f) => f.valor === 'pendientes');

    expect(filtro.fn({ estado: 'PENDIENTE' })).toBe(true);
    expect(filtro.fn({ estado: 'ENTREGADO' })).toBe(false);
  });

  it('filtra entregados', () => {
    const filtro = FILTROS_ESTADO.find((f) => f.valor === 'entregados');

    expect(filtro.fn({ estado: 'ENTREGADO' })).toBe(true);
    expect(filtro.fn({ estado: 'PENDIENTE' })).toBe(false);
  });

  it('filtra cancelados', () => {
    const filtro = FILTROS_ESTADO.find((f) => f.valor === 'cancelados');

    expect(filtro.fn({ estado: 'CANCELADO' })).toBe(true);
    expect(filtro.fn({ estado: 'PENDIENTE' })).toBe(false);
  });

  it('el filtro todos acepta cualquier pedido', () => {
    const filtro = FILTROS_ESTADO.find((f) => f.valor === 'todos');

    expect(filtro.fn({ estado: 'PENDIENTE' })).toBe(true);
    expect(filtro.fn({ estado: 'ENTREGADO' })).toBe(true);
    expect(filtro.fn({ estado: 'CANCELADO' })).toBe(true);
  });

  it('define los periodos disponibles', () => {
    expect(PERIODOS.map(({ valor, label }) => ({ valor, label }))).toEqual([
      { valor: 'semana', label: 'Esta semana' },
      { valor: 'mes', label: 'Este mes' },
      { valor: 'trimestre', label: '3 meses' },
      { valor: 'semestre', label: '6 meses' },
      { valor: 'anio', label: 'Este año' },
      { valor: 'historico', label: 'Histórico' },
    ]);
  });

  it('define histórico sin límite temporal', () => {
    expect(PERIODOS.find((p) => p.valor === 'historico')?.ms).toBeNull();
  });
});
