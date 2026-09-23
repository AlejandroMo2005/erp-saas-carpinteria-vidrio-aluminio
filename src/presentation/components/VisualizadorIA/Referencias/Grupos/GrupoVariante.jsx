'use strict';
import React, { useState } from 'react';
import TrabajoSeccion from './TrabajoSeccion';

export default function GrupoVariante({ variante, trabajos, isAdmin }) {
  const [open, setOpen] = useState(false);

  // Sin variante → renderiza secciones directamente sin wrapper
  if (!variante) {
    return trabajos.map((t) => (
      <TrabajoSeccion key={t.id} trabajo={t} isAdmin={isAdmin} />
    ));
  }

  const panelId = `variante-panel-${variante.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="ref-variante">
      <button
        className="ref-variante-hd"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="ref-variante-nombre">{variante}</span>
        <div className="ref-seccion-end">
          <span className="ref-count" aria-label={`${trabajos.length} trabajos`}>
            {trabajos.length}
          </span>
          <span
            className={`ref-chevron${open ? ' ref-chevron--open' : ''}`}
            aria-hidden="true"
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div id={panelId} className="ref-variante-body">
          {trabajos.map((t) => (
            <TrabajoSeccion key={t.id} trabajo={t} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}