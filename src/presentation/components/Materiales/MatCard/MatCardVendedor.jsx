// src/presentation/components/Materiales/MatCard/MatCardVendedor.jsx
// Sprint 18 — Refactorización modular

import React, { memo } from 'react';
import './MatCard.css';
import IconoMaterial from '../IconoMaterial/IconoMaterial';
import { normalizarColor } from '../utils/materialesUtils';

const MatCardVendedor = memo(function MatCardVendedor({ cardKey, variantes, activo, onSeleccionar }) {
  return (
    <article className="mat-card mat-card--readonly">
      <header className="mat-card-header">
        <div className="mat-id" aria-label={`Material ID ${activo.material_id}`}>
          #{activo.material_id}
        </div>
        <div
          className={`mat-stock-tag${activo.stock <= 0 ? ' mat-stock-tag--vacio' : ''}`}
          aria-label={`${activo.stock} unidades disponibles`}
        >
          {activo.stock} DISPONIBLES
        </div>
      </header>

      <div className="mat-card-body">
        <IconoMaterial nombre={activo.nombre_material} colorHex={activo.color_valor} />
        <h2 className="mat-title">{activo.nombre_material}</h2>

        <div
          className="selector-colores" role="group"
          aria-label={`Variantes de color para ${activo.nombre_material}`}
        >
          {variantes.map((v) => (
            <button
              key={v.variante_id} type="button"
              className={`color-btn-wrapper${activo.variante_id === v.variante_id ? ' active' : ''}`}
              aria-label={`Ver color ${v.color_nombre}`}
              aria-pressed={activo.variante_id === v.variante_id}
              onClick={() => onSeleccionar(cardKey, v)}
            >
              <span className="color-sample" style={{ backgroundColor: normalizarColor(v.color_valor) }} />
            </button>
          ))}
        </div>

        {activo.color_nombre && (
          <div className="active-color-label" aria-live="polite">{activo.color_nombre}</div>
        )}

        <div className="info-fields">
          <div className="info-row">
            <span className="info-label">STOCK</span>
            <span className="info-value">{activo.stock}</span>
          </div>
          <div className="info-row">
            <span className="info-label">PRECIO</span>
            <span className="info-value">${parseFloat(activo.precio).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <footer className="mat-card-footer mat-card-footer--readonly">
        <div className="price-row">
          <span className="u-text">USD</span>
          <span className="p-text">${parseFloat(activo.precio).toFixed(2)}</span>
        </div>
        <div className="readonly-badge" aria-label="Vista de solo lectura">Solo lectura</div>
      </footer>
    </article>
  );
});

export default MatCardVendedor;