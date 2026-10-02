import { useState, memo } from 'react';
// src/presentation/components/Pedidos/BadgeEstado/BadgeEstado.jsx
// Sprint 18 — Refactorización modular

import './BadgeEstado.css';
import {
  TRANSICIONES,
  ETIQUETAS_ESTADO,
  CLASES_BTN_ESTADO,
  ETIQUETAS_ESTADO_CLIENTE,
} from '../constants/pedidosConstants';

const BadgeEstado = memo(function BadgeEstado({
  pedidoId, estadoActual, onCambiar, cambiando, soloLectura,
}) {
  const [abierto, setAbierto] = useState(false);
  const opciones      = TRANSICIONES[estadoActual] ?? [];
  const esInteractivo = !soloLectura && opciones.length > 0;

  const labelBadge = soloLectura
    ? (ETIQUETAS_ESTADO_CLIENTE[estadoActual] || estadoActual)
    : estadoActual;

  if (!esInteractivo) {
    return (
      <span
        className="status-badge"
        data-estado={estadoActual}
        aria-label={`Estado: ${labelBadge}`}
      >
        {labelBadge}
      </span>
    );
  }

  return (
    <div className="badge-estado-wrapper">
      <button
        type="button"
        className="status-badge status-badge--clickable"
        data-estado={estadoActual}
        onClick={() => setAbierto((p) => !p)}
        disabled={cambiando}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={`Estado: ${estadoActual}. Toca para cambiar`}
        title="Toca para cambiar el estado"
      >
        {cambiando ? 'Guardando…' : `${estadoActual} ▾`}
      </button>

      {abierto && (
        <>
          <div
            className="badge-backdrop"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />
          <div className="menu-estado-dropdown" role="menu">
            {opciones.map((estado) => (
              <button
                key={estado}
                className={CLASES_BTN_ESTADO[estado]}
                role="menuitem"
                onClick={() => { setAbierto(false); onCambiar(pedidoId, estado); }}
                aria-label={`${ETIQUETAS_ESTADO[estado]} — pedido ${pedidoId}`}
              >
                {ETIQUETAS_ESTADO[estado]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default BadgeEstado;
