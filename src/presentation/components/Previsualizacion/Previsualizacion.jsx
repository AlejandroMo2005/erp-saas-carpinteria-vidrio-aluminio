// src/presentation/components/Previsualizacion/Previsualizacion.jsx
// Sprint 14 — Migración a React Query
// Sprint 16 — Fix responsivo Android, SVG inline con aria correcto, contraste temas
// Sprint 17 — DT-IA: pasa colorId (marcoActivo.id) a IAPreview para endpoint multipart
// Sprint 18 — DT-IA-01: draw-zone con minHeight fijo | Refactor: hook + CSS parciales

import React, { lazy, Suspense } from 'react';
import './Previsualizacion.css';

import { PreviewToastContainer } from './Notificaciones/NotiPrevisualizacion';
import { usePrevisualizacion }   from './usePrevisualizacion';
import { normalizarColor, MEDIDA_MIN, MEDIDA_MAX } from './utils';

const IAPreview = lazy(() => import('./IA/IAPreview'));

/* ── Icono foto inline ───────────────────────────────────────────────────── */
const IconoFoto = () => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    role="presentation"
  >
    <path d="M21 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H3V5h18v14zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
  </svg>
);

/* ── Spinner de carga Suspense ───────────────────────────────────────────── */
const SpinnerSuspense = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '520px' }}>
    <div style={{
      width: '2rem', height: '2rem',
      border: '3px solid rgba(0,0,0,0.1)',
      borderTopColor: 'var(--primary-color)',
      borderRadius: '50%',
      animation: 'shell-spin 0.8s linear infinite',
    }} />
  </div>
);

/* ── Componente principal ────────────────────────────────────────────────── */
export default function Previsualizacion({ onAbrirIA }) {
  const {
    trabajos, cargandoTrabajos,
    coloresMarco, coloresVidrio, cargandoColores,
    trabajoSeleccionado, marcoActivo, vidrioActivo,
    anchoStr, altoStr, anchoValido, altoValido,
    iaAbierto, iaResultado,
    colorMarcoHex, colorVidrioHex, opacidadMarco, opacidadVidrio,
    PreviewComponent, puedeRenderizar, puedeUsarIA, mensajeEstado,
    toasts, removeToast,
    handleAncho, handleAlto, handleTrabajo,
    handleSelMarco, handleSelVidrio,
    handleAbrirIA, handleCerrarIA, handleResultadoIA,
    handleLimpiarResultado, handleGuardarIA,
  } = usePrevisualizacion();

  return (
    <div className="view-container">
      <PreviewToastContainer toasts={toasts} onRemove={removeToast} />

      <h1 className="header-title">Visualizador</h1>

      <div className="preview-card">

        {/* ── Selector de trabajo + botón IA ─────────────────────────────── */}
        <div className="trabajo-selector-row">
          <div className="trabajo-selector">
            <label htmlFor="tipo-trabajo">Tipo de trabajo</label>
            <select
              id="tipo-trabajo"
              value={trabajoSeleccionado?.id ?? ''}
              onChange={handleTrabajo}
              disabled={cargandoTrabajos}
              aria-busy={cargandoTrabajos}
              aria-label="Seleccionar tipo de trabajo"
            >
              <option value="">{cargandoTrabajos ? 'Cargando…' : 'Seleccione…'}</option>
              {trabajos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="ia-trigger-wrapper">
            <button
              type="button"
              className="ia-trigger-btn"
              onClick={() => handleAbrirIA(onAbrirIA)}
              disabled={!puedeUsarIA}
              title={!puedeUsarIA ? 'Selecciona un trabajo y colores primero' : 'Ver cómo quedaría con IA en una foto real'}
              aria-label="Abrir vista previa con inteligencia artificial"
            >
              <span className="ia-trigger-icon" aria-hidden="true"><IconoFoto /></span>
              Ver con IA
            </button>
          </div>
        </div>

        {/* ── Inputs de medida ────────────────────────────────────────────── */}
        <div className="inputs-vertical">
          <div className="f-group">
            <label htmlFor="ancho">Ancho total (m)</label>
            <input
              id="ancho" type="number" step="0.01"
              min={MEDIDA_MIN} max={MEDIDA_MAX}
              value={anchoStr} onChange={handleAncho}
              aria-label={`Ancho total en metros (${MEDIDA_MIN} a ${MEDIDA_MAX})`}
              aria-invalid={anchoValido === null}
            />
          </div>
          <div className="f-group">
            <label htmlFor="alto">Alto (m)</label>
            <input
              id="alto" type="number" step="0.01"
              min={MEDIDA_MIN} max={MEDIDA_MAX}
              value={altoStr} onChange={handleAlto}
              aria-label={`Alto en metros (${MEDIDA_MIN} a ${MEDIDA_MAX})`}
              aria-invalid={altoValido === null}
            />
          </div>
        </div>

        {/* ── Selectores de color ─────────────────────────────────────────── */}
        <div className="sel-container">
          <div>
            <p className="lab-text"><b>ALUMINIO:</b> {marcoActivo?.nombre ?? '—'}</p>
            <div className="dots-grid" role="group" aria-label="Seleccionar color de aluminio">
              {cargandoColores ? (
                <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Cargando…</span>
              ) : coloresMarco.map((c) => (
                <button
                  key={c.id} type="button"
                  className={`dot-btn${marcoActivo?.id === c.id ? ' active' : ''}`}
                  style={{ backgroundColor: normalizarColor(c.valor) }}
                  aria-label={`Aluminio ${c.nombre}`}
                  aria-pressed={marcoActivo?.id === c.id}
                  title={c.nombre}
                  onClick={() => handleSelMarco(c)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="lab-text"><b>VIDRIO:</b> {vidrioActivo?.nombre ?? '—'}</p>
            <div className="dots-grid" role="group" aria-label="Seleccionar color de vidrio">
              {cargandoColores ? (
                <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Cargando…</span>
              ) : coloresVidrio.map((c) => (
                <button
                  key={c.id} type="button"
                  className={`dot-btn${vidrioActivo?.id === c.id ? ' active' : ''}`}
                  style={{ backgroundColor: normalizarColor(c.valor), border: '1px solid #666' }}
                  aria-label={`Vidrio ${c.nombre}`}
                  aria-pressed={vidrioActivo?.id === c.id}
                  title={c.nombre}
                  onClick={() => handleSelVidrio(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Draw Zone ───────────────────────────────────────────────────── */}
        {/* minHeight:520px — el Canvas de R3F mide su contenedor en onCreated.
            Con altura fija el framebuffer nunca es 0x0, ni durante el fallback
            del Suspense ni al cambiar de trabajo.                             */}
        <div className="draw-zone" aria-live="polite" style={{ minHeight: '520px' }}>
          {iaResultado ? (
            <div className="ia-draw-resultado">
              <img
                src={iaResultado}
                alt={`Vista previa IA: ${trabajoSeleccionado?.nombre ?? 'trabajo'}`}
                className="ia-draw-resultado-img"
              />
              <span className="ia-draw-resultado-badge">IA ✨</span>
              <div className="ia-draw-resultado-actions">
                <button type="button" className="ia-draw-btn-small" onClick={handleLimpiarResultado}>Ver 3D</button>
                <button type="button" className="ia-draw-btn-small" onClick={() => handleAbrirIA(onAbrirIA)}>Nueva foto</button>
                <button type="button" className="ia-draw-btn-small" onClick={handleGuardarIA}>Guardar</button>
              </div>
            </div>

          ) : puedeRenderizar ? (
            <Suspense fallback={<SpinnerSuspense />}>
              <PreviewComponent
                key={`${trabajoSeleccionado?.id}-${colorMarcoHex}-${colorVidrioHex}-${anchoValido}-${altoValido}`}
                ancho={anchoValido}
                alto={altoValido}
                colorMarco={colorMarcoHex}
                colorVidrio={colorVidrioHex}
                colorMarcoHex={colorMarcoHex}
                colorVidrioHex={colorVidrioHex}
                opacidadMarco={opacidadMarco}
                opacidadVidrio={opacidadVidrio}
              />
            </Suspense>
          ) : (
            <p className="msg-err" role="status">{mensajeEstado}</p>
          )}
        </div>
      </div>

      {/* ── Modal IA ──────────────────────────────────────────────────────── */}
      {iaAbierto && (
        <Suspense fallback={null}>
          <IAPreview
            trabajo={trabajoSeleccionado}
            colorId={marcoActivo?.id}
            colorMarcoHex={colorMarcoHex}
            colorVidrioHex={colorVidrioHex}
            onResultado={handleResultadoIA}
            onCerrar={handleCerrarIA}
          />
        </Suspense>
      )}
    </div>
  );
}