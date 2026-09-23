// src/presentation/components/Pedidos/FiltrosBar/FiltrosBar.jsx
// Sprint 18 — Refactorización modular

import React from 'react';
import './FiltrosBar.css';
import { FILTROS_ESTADO, PERIODOS } from '../constants/pedidosConstants';

export default function FiltrosBar({
  esAdmin,
  esCliente,
  filtroEstado,
  setFiltroEstado,
  filtroPeriodo,
  setFiltroPeriodo,
  contadores,
}) {
  return (
    <>
      {esAdmin && (
        <div className="periodo-bar" role="group" aria-label="Filtrar por período">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              className={`periodo-pill${filtroPeriodo === p.valor ? ' periodo-pill--activo' : ''}`}
              onClick={() => setFiltroPeriodo(p.valor)}
              aria-pressed={filtroPeriodo === p.valor}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="filtros-bar" role="group" aria-label="Filtrar por estado">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.valor}
            type="button"
            className={`filtro-pill${filtroEstado === f.valor ? ' filtro-pill--activo' : ''}`}
            onClick={() => setFiltroEstado(f.valor)}
            aria-pressed={filtroEstado === f.valor}
          >
            {f.label}
            {!esCliente && (
              <span className="filtro-pill__count">{contadores[f.valor] ?? 0}</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}