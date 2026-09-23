// MascaraPanel/MascaraPanel.jsx
import React from 'react';
import BoundingBoxSelector from '../BoundingBoxSelector/BoundingBoxSelector';
import './MascaraPanel.css';

export default function MascaraPanel({
  tab, trabajoActual, trabajoId, colorActual,
  promptLibre,
  error,
  samCargando, samError,
  detectarZonaAuto,
  fotoSrc,
  handleMascaraLista,
  volverAFoto,
}) {
  return (
    <>
      {/* ── Resumen configuración ── */}
      <div className="via-card via-config-summary" aria-label="Configuración activa">
        {tab === 'catalogo' ? (
          <span>
            📋 <b>{trabajoActual?.nombre ?? `Trabajo #${trabajoId}`}</b>
            {colorActual && (
              <>
                <span className="via-summary-sep" aria-hidden="true">·</span>
                <span
                  className="via-color-dot via-color-dot--inline"
                  style={{background: colorActual.valor ?? colorActual.hex}}
                  aria-hidden="true"
                />
                {colorActual.nombre}
              </>
            )}
          </span>
        ) : (
          <span>
            ✏️ <b>{promptLibre.trim().slice(0,70)}{promptLibre.length>70?'…':''}</b>
            {colorActual && (
              <>
                <span className="via-summary-sep" aria-hidden="true">·</span>
                <span
                  className="via-color-dot via-color-dot--inline"
                  style={{background: colorActual.valor ?? colorActual.hex}}
                  aria-hidden="true"
                />
                {colorActual.nombre}
              </>
            )}
          </span>
        )}
      </div>

      {/* ── Selector de zona ── */}
      <div className="via-card via-card--full">
        {error && (
          <p className="via-error" role="alert" style={{margin:'0.75rem 1.25rem 0'}}>
            {error}
          </p>
        )}

        {/* Barra SAM */}
        <div className="via-sam-bar">
          <button
            type="button"
            className="via-btn via-btn--sam"
            onClick={detectarZonaAuto}
            disabled={samCargando}
            aria-busy={samCargando}
          >
            {samCargando
              ? <><span className="via-sam-spinner" aria-hidden="true" /> Detectando zona…</>
              : '🎯 Detectar zona automáticamente'
            }
          </button>
          <span className="via-sam-hint">o selecciona la zona manualmente ↓</span>
          {samError && <p className="via-sam-error" role="alert">{samError}</p>}
        </div>

        <BoundingBoxSelector
          imagen={fotoSrc}
          onMascaraLista={handleMascaraLista}
          onCancelar={volverAFoto}
        />
      </div>
    </>
  );
}