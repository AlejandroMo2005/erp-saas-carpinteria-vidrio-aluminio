// ProcesandoPanel/ProcesandoPanel.jsx
import React from 'react';

export default function ProcesandoPanel({ fotoSrc, progreso }) {
  return (
    <div className="via-card via-procesando" aria-live="polite" aria-label="Generando imagen con IA">
      <div className="via-procesando-preview">
        <img src={fotoSrc} alt="Imagen siendo procesada" />
        <div className="via-scan-overlay" aria-hidden="true">
          <div className="via-scan-line" />
        </div>
      </div>
      <div className="via-procesando-info">
        <div className="via-spinner" aria-hidden="true" />
        <p className="via-procesando-txt">Generando con IA…</p>
        <p className="via-procesando-subtxt">Puede tardar hasta 40 segundos</p>
        <div className="via-progress" role="progressbar"
          aria-valuenow={Math.round(progreso)} aria-valuemin="0" aria-valuemax="100"
          aria-label={`Progreso: ${Math.round(progreso)}%`}>
          <div className="via-progress-fill" style={{width:`${progreso}%`}} />
        </div>
        <p className="via-progress-pct" aria-hidden="true">{Math.round(progreso)}%</p>
      </div>
    </div>
  );
}