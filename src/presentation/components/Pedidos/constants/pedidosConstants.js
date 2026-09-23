// src/presentation/components/Pedidos/constants/pedidosConstants.js
// Sprint 18 — Refactorización modular

export const TRANSICIONES = {
  PENDIENTE: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export const ETIQUETAS_ESTADO = {
  ENTREGADO: 'Marcar como Entregado',
  CANCELADO: 'Cancelar pedido',
};

export const CLASES_BTN_ESTADO = {
  ENTREGADO: 'btn-estado btn-estado--entregado',
  CANCELADO: 'btn-estado btn-estado--cancelar',
};

export const ETIQUETAS_ESTADO_CLIENTE = {
  PENDIENTE: '⏳ Pendiente',
  ENTREGADO: '✅ Entregado',
  CANCELADO: '❌ Cancelado',
};

export const UNA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

export const FILTROS_ESTADO = [
  {
    valor: 'activos',
    label: 'Activos',
    fn: (p) => {
      if (p.estado === 'PENDIENTE') return true;
      if (p.estado === 'ENTREGADO') return (Date.now() - new Date(p.fecha).getTime()) < UNA_SEMANA_MS;
      return false;
    },
  },
  { valor: 'pendientes', label: 'Pendientes', fn: (p) => p.estado === 'PENDIENTE' },
  { valor: 'entregados', label: 'Entregados', fn: (p) => p.estado === 'ENTREGADO' },
  { valor: 'cancelados', label: 'Cancelados', fn: (p) => p.estado === 'CANCELADO' },
  { valor: 'todos',      label: 'Todos',      fn: ()  => true                      },
];

export const PERIODOS = [
  { valor: 'semana',    label: 'Esta semana', ms: 7   * 24 * 60 * 60 * 1000 },
  { valor: 'mes',       label: 'Este mes',    ms: 30  * 24 * 60 * 60 * 1000 },
  { valor: 'trimestre', label: '3 meses',     ms: 90  * 24 * 60 * 60 * 1000 },
  { valor: 'semestre',  label: '6 meses',     ms: 180 * 24 * 60 * 60 * 1000 },
  { valor: 'anio',      label: 'Este año',    ms: 365 * 24 * 60 * 60 * 1000 },
  { valor: 'historico', label: 'Histórico',   ms: null                       },
];