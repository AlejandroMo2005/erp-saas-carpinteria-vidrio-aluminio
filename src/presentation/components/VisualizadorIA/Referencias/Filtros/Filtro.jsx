'use strict';
import React from 'react';
import './Filtro.css';

export default function Filtro({ filtro, setFiltro, tiposTodos, grupos }) {
  if (!tiposTodos.length) return null;

  return (
    <>
      <div className="ref-filter-bar" role="search" aria-label="Filtrar referencias">
        <input
          type="search"
          className="ref-filter-input"
          placeholder="Buscar por tipo o trabajo…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          aria-label="Buscar tipo de trabajo"
        />
        {filtro && (
          <button
            className="ref-filter-clear"
            onClick={() => setFiltro('')}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      <div className="ref-chips" role="group" aria-label="Filtrar por tipo">
        {tiposTodos.map((tipo) => {
          const count = Object.values(grupos[tipo]).flat().length;
          return (
            <button
              key={tipo}
              className={`ref-chip${filtro === tipo ? ' ref-chip--active' : ''}`}
              onClick={() => setFiltro((f) => (f === tipo ? '' : tipo))}
              aria-pressed={filtro === tipo}
            >
              {tipo}
              <span className="ref-chip-count" aria-hidden="true">{count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}