'use strict';
import { useState } from 'react';
import GrupoVariante from './GrupoVariante';

export default function GrupoTipo({ tipo, variantes, isAdmin }) {
  const [open, setOpen] = useState(false);
  const id            = `grupo-${tipo.replace(/\s+/g, '-').toLowerCase()}`;
  const totalTrabajos = Object.values(variantes).flat().length;

  return (
    <section className="ref-grupo" aria-labelledby={id}>
      <button
        id={id}
        className="ref-grupo-hd"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ref-grupo-tipo">{tipo || 'Sin categoría'}</span>
        <div className="ref-grupo-end">
          <span className="ref-grupo-count" aria-label={`${totalTrabajos} trabajos`}>
            {totalTrabajos} trabajo{totalTrabajos !== 1 ? 's' : ''}
          </span>
          <span
            className={`ref-chevron ref-chevron--lg${open ? ' ref-chevron--open' : ''}`}
            aria-hidden="true"
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="ref-grupo-body">
          {Object.keys(variantes).map((v) => (
            <GrupoVariante
              key={v || '__sin_variante__'}
              variante={v}
              trabajos={variantes[v]}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </section>
  );
}