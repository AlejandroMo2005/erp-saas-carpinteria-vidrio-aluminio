// src/presentation/components/common/AccessibilityPanel/AccessibilityPanel.jsx
// Sprint 8  — Fix WCAG: aria-hidden → inert + manejo correcto de foco
// Sprint 18 — Refactor: hook useAccessibilityPanel + CSS parciales

import './AccessibilityPanel.css';
import { useAccessibilityPanel } from './useAccessibilityPanel';

const FONT_SIZES = [
  { val: 'small',  label: 'Fuente pequeña', cls: '' },
  { val: 'medium', label: 'Fuente mediana', cls: ' medium' },
  { val: 'large',  label: 'Fuente grande',  cls: ' large' },
];

export const AccessibilityPanel = () => {
  const {
    darkMode, fontSize, highContrast, reduceMotion,
    isOpen,
    triggerRef, panelRef,
    abrirPanel, cerrarPanel, handleKeyDown,
    handleDarkMode, handleFontSize,
    handleHighContrast, handleReduceMotion, handleReset,
  } = useAccessibilityPanel();

  return (
    <>
      {/* Región de anuncio para lectores de pantalla */}
      <div
        id="accessibility-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Botón trigger */}
      <button
        ref={triggerRef}
        className="accessibility-button"
        onClick={abrirPanel}
        aria-label="Configuración de accesibilidad"
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
        title="Configuración de accesibilidad"
      >
        <svg width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m7.07-7.07l-4.24 4.24m-5.66 0l-4.24-4.24m16.97 0l-4.24 4.24m-5.66 0l-4.24-4.24" />
        </svg>
      </button>
      <div
        ref={panelRef}
        id="accessibility-panel"
        className={`accessibility-panel${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Panel de configuración de accesibilidad"
        aria-labelledby="panel-title"
        onKeyDown={handleKeyDown}
        {...(!isOpen ? { inert: '' } : {})}
      >
        <div className="panel-header">
          <h2 id="panel-title">Accesibilidad</h2>
          <button
            className="close-button"
            onClick={cerrarPanel}
            aria-label="Cerrar panel de accesibilidad"
          >
            <svg width="20" height="20" viewBox="0 0 20 20"
              fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>
        </div>

        <div className="panel-content">

          {/* ── Modo Oscuro ── */}
          <div className={`setting-group${highContrast ? ' setting-group--disabled' : ''}`}>
            <div className="setting-header">
              <label htmlFor="dark-mode-toggle" className="setting-label" aria-disabled={highContrast}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span>Modo Oscuro</span>
              </label>
              <button
                id="dark-mode-toggle"
                className={`toggle-switch${darkMode && !highContrast ? ' active' : ''}`}
                onClick={handleDarkMode}
                role="switch"
                aria-checked={darkMode && !highContrast}
                aria-label="Alternar modo oscuro"
                aria-disabled={highContrast}
                disabled={highContrast}
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <p className="setting-description">
              {highContrast
                ? 'No disponible con alto contraste activo'
                : 'Reduce el brillo de la pantalla para mayor comodidad visual'}
            </p>
          </div>

          {/* ── Tamaño de Fuente ── */}
          <div className="setting-group">
            <div className="setting-header">
              <div className="setting-label">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M13 6H7.5L5 13h2l.5-1.5h5L13 13h2l-2.5-7zm-3.5 4.5L10.75 7h.5l1.25 3.5h-3z" />
                </svg>
                <span>Tamaño de Fuente</span>
              </div>
            </div>
            <div className="button-group" role="radiogroup" aria-label="Seleccionar tamaño de fuente">
              {FONT_SIZES.map(({ val, label, cls }) => (
                <button
                  key={val}
                  className={`size-button${cls}${fontSize === val ? ' active' : ''}`}
                  onClick={() => handleFontSize(val)}
                  role="radio"
                  aria-checked={fontSize === val}
                  aria-label={label}
                >
                  <span aria-hidden="true">A</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Alto Contraste ── */}
          <div className="setting-group">
            <div className="setting-header">
              <label htmlFor="high-contrast-toggle" className="setting-label">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14V4a6 6 0 110 12z" />
                </svg>
                <span>Alto Contraste</span>
              </label>
              <button
                id="high-contrast-toggle"
                className={`toggle-switch${highContrast ? ' active' : ''}`}
                onClick={handleHighContrast}
                role="switch"
                aria-checked={highContrast}
                aria-label="Alternar alto contraste"
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <p className="setting-description">
              {highContrast
                ? 'Activo — el modo de color está suspendido'
                : 'Aumenta el contraste para mejor legibilidad'}
            </p>
          </div>

          {/* ── Reducir Movimiento ── */}
          <div className="setting-group">
            <div className="setting-header">
              <label htmlFor="reduce-motion-toggle" className="setting-label">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9V7h2v6z" />
                </svg>
                <span>Reducir Movimiento</span>
              </label>
              <button
                id="reduce-motion-toggle"
                className={`toggle-switch${reduceMotion ? ' active' : ''}`}
                onClick={handleReduceMotion}
                role="switch"
                aria-checked={reduceMotion}
                aria-label="Alternar reducción de movimiento"
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <p className="setting-description">Minimiza las animaciones y transiciones</p>
          </div>

          {/* ── Reiniciar ── */}
          <button
            className="reset-button"
            onClick={handleReset}
            aria-label="Reiniciar todas las preferencias de accesibilidad"
          >
            Reiniciar Preferencias
          </button>

        </div>
      </div>

      {/* Overlay — solo visual, no necesita interacción de AT */}
      {isOpen && (
        <div className="panel-overlay" onClick={cerrarPanel} aria-hidden="true" />
      )}
    </>
  );
};