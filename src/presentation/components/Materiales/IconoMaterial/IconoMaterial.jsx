// src/presentation/components/Materiales/IconoMaterial/IconoMaterial.jsx
// Sprint 18 — Refactorización modular

import React, { memo } from 'react';
import { sanitizarTexto, normalizarColor, esColorClaro } from '../utils/materialesUtils';

const IconoMaterial = memo(function IconoMaterial({ nombre, colorHex }) {
  const n        = sanitizarTexto(nombre).toLowerCase();
  const color    = normalizarColor(colorHex);
  const stroke   = esColorClaro(color) ? '#333333' : color;
  const esVidrio = n.includes('vidrio') || n.includes('espejo');

  return (
    <div className="icon-main-box" aria-hidden="true">
      {esVidrio ? (
        <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M15 3v18M8 8l3 3" />
        </svg>
      ) : (
        <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5">
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3.3 7l8.7 5 8.7-5M12 22V12" />
        </svg>
      )}
    </div>
  );
});

export default IconoMaterial;