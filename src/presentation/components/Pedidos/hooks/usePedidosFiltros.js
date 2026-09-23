// src/presentation/components/Pedidos/hooks/usePedidosFiltros.js
// Sprint 18 — Refactorización modular
// Encapsula: filtroEstado · filtroPeriodo · pedidosFiltrados · contadores · mensajeVacio

import { useState, useMemo } from 'react';
import { FILTROS_ESTADO, PERIODOS } from '../constants/pedidosConstants';

export function usePedidosFiltros(listaPedidos, esAdmin, esCliente) {
  const [filtroEstado,  setFiltroEstado]  = useState('activos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes');

  const _basePeriodo = useMemo(() => {
    if (!esAdmin || filtroPeriodo === 'historico') return listaPedidos;
    const periodo = PERIODOS.find((p) => p.valor === filtroPeriodo);
    if (!periodo?.ms) return listaPedidos;
    const desde = Date.now() - periodo.ms;
    return listaPedidos.filter((p) => new Date(p.fecha).getTime() >= desde);
  }, [listaPedidos, esAdmin, filtroPeriodo]);

  const pedidosFiltrados = useMemo(() => {
    const filtroE = FILTROS_ESTADO.find((f) => f.valor === filtroEstado);
    return filtroE ? _basePeriodo.filter(filtroE.fn) : _basePeriodo;
  }, [_basePeriodo, filtroEstado]);

  const contadores = useMemo(() =>
    FILTROS_ESTADO.reduce((acc, f) => {
      acc[f.valor] = _basePeriodo.filter(f.fn).length;
      return acc;
    }, {}),
  [_basePeriodo]);

  const mensajeVacio = useMemo(() => {
    if (esCliente) return 'Aún no tienes pedidos. Ve a "Mis Proformas" para solicitar un presupuesto.';
    const labelEstado  = FILTROS_ESTADO.find((f) => f.valor === filtroEstado)?.label?.toLowerCase() ?? '';
    const labelPeriodo = esAdmin ? PERIODOS.find((p) => p.valor === filtroPeriodo)?.label?.toLowerCase() : '';
    return esAdmin
      ? `No hay pedidos ${labelEstado} en "${labelPeriodo}".`
      : `No hay pedidos ${labelEstado}.`;
  }, [esCliente, esAdmin, filtroEstado, filtroPeriodo]);

  return {
    filtroEstado,  setFiltroEstado,
    filtroPeriodo, setFiltroPeriodo,
    pedidosFiltrados,
    contadores,
    mensajeVacio,
  };
}