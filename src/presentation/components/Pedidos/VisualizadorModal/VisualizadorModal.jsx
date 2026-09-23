// src/presentation/components/Pedidos/VisualizadorModal/VisualizadorModal.jsx
// Sprint 16 — Fix CLS: estados iniciales con placeholder evitan reflow
// Sprint 18 — Fix Context Lost: key en Canvas + resize dispatch
//             Refactor: hook + CSS parciales + constants + utils

import { Suspense } from 'react';
import './VisualizadorModal.css';
import { useVisualizadorModal } from './useVisualizadorModal';

export default function VisualizadorModal({ pedido, onClose }) {
  const {
    ancho, alto,
    colorMarcoHex, colorVidrioHex,
    detallesTrabajo, clienteInfo, trabajoNombre,
    cargandoDetalles,
    tipoTrabajo, PreviewComponent,
  } = useVisualizadorModal({ pedido, onClose });

  return (
    <div className="visualizador-modal-overlay" onClick={onClose}>
      <div
        className="visualizador-modal-content"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Visualización 3D del pedido ${pedido.id}`}
      >

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-header-info">
            <h2 className="render-title">Visualización 3D</h2>

            <div className="header-grid">
              <div className="header-left">
                <span className="badge-label">Pedido:</span>
                <span className="badge-value">#{pedido.id}</span>
              </div>
              <div className="header-center">
                <span className="badge-label">Cliente:</span>
                <span className="badge-value">{clienteInfo}</span>
              </div>
              <div className="header-right">
                <span className="badge-label">Trabajo:</span>
                <span className="badge-value">{trabajoNombre}</span>
              </div>
              <div className="header-sub-left">
                <span className="badge-label">Medidas:</span>
                <span className="badge-value">{ancho}m × {alto}m</span>
              </div>
              {detallesTrabajo && (
                <div className="header-sub-center">
                  <span className="badge-label">Detalle:</span>
                  <span className="badge-value">{detallesTrabajo}</span>
                </div>
              )}
            </div>
          </div>

          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar visualizador"
          >
            ✕
          </button>
        </div>

        {/* ── Área de render ── */}
        <div className="modal-render-area">
          {cargandoDetalles ? (
            <div className="loading-message">
              <div className="spinner" />
              <p>Cargando visualización 3D...</p>
            </div>

          ) : PreviewComponent ? (
            /*  Fix Context Lost — key compuesto por pedido + tipo:
                Garantiza que React desmonte el Canvas anterior (liberando
                el contexto WebGL) antes de montar el nuevo cuando cambia
                el pedido seleccionado. Sin key, React reutiliza el nodo
                del DOM y el contexto queda en estado inconsistente.    */
            <div className="canvas-wrapper">
              <Suspense
                fallback={
                  <div className="loading-message">
                    <div className="spinner" />
                    <p>Cargando preview 3D...</p>
                  </div>
                }
              >
                <PreviewComponent
                  key={`preview-${pedido.id}-${tipoTrabajo}`}
                  ancho={Number(ancho)}
                  alto={Number(alto)}
                  colorMarco={colorMarcoHex}
                  colorVidrio={colorVidrioHex}
                  colorMarcoHex={colorMarcoHex}
                  colorVidrioHex={colorVidrioHex}
                />
              </Suspense>
            </div>

          ) : (
            <div className="no-preview-message">
              <h3>No se pudo identificar el tipo de trabajo</h3>
              <p>{trabajoNombre}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}