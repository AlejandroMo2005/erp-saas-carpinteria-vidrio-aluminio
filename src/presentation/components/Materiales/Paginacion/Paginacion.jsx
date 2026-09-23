// src/presentation/components/Materiales/Paginacion/Paginacion.jsx
// Sprint 18 — Refactorización modular

import React, { memo } from 'react';
import './Paginacion.css';

const Paginacion = memo(function Paginacion({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="paginacion" aria-label="Paginación de materiales">
      <button
        className="pag-btn"
        onClick={() => onChange(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => {
        const visible   = n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1;
        const esElipsis = !visible && (n === 2 || n === totalPaginas - 1);
        if (esElipsis) return <span key={n} className="pag-elipsis">…</span>;
        if (!visible)  return null;
        return (
          <button
            key={n}
            className={`pag-btn${n === pagina ? ' pag-btn--active' : ''}`}
            onClick={() => onChange(n)}
            aria-current={n === pagina ? 'page' : undefined}
          >
            {n}
          </button>
        );
      })}

      <button
        className="pag-btn"
        onClick={() => onChange(pagina + 1)}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  );
});

export default Paginacion;