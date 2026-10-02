// src/presentation/components/Materiales/MatCard/MatCardAdmin.jsx
// Sprint 18 — Refactorización modular
import { memo } from 'react';

import './MatCard.css';
import IconoMaterial from '../IconoMaterial/IconoMaterial';
import { normalizarColor } from '../utils/materialesUtils';
import { STOCK_MAX, PRECIO_MAX } from '../constants/materialesConstants';

const MatCardAdmin = memo(function MatCardAdmin({
  cardKey, variantes, activo, edit,
  onSeleccionar, onCampo, onGuardar, guardando,
}) {
  const stockId  = `stock-${activo.variante_id}`;
  const precioId = `precio-${activo.variante_id}`;

  return (
    <article className="mat-card">
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
              aria-label={`Seleccionar color ${v.color_nombre}`}
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

        <div className="edit-fields">
          <div className="field-group">
            <label htmlFor={stockId} className="field-label">STOCK</label>
            <input
              id={stockId} type="number" className="field-input"
              value={edit?.stock ?? 0} min="0" max={STOCK_MAX} step="1"
              onChange={(e) => onCampo(cardKey, 'stock', e.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor={precioId} className="field-label">PRECIO</label>
            <input
              id={precioId} type="number" step="0.01" min="0" max={PRECIO_MAX}
              className="field-input" value={edit?.precio ?? 0}
              onChange={(e) => onCampo(cardKey, 'precio', e.target.value)}
            />
          </div>
        </div>
      </div>

      <footer className="mat-card-footer">
        <div className="price-row">
          <span className="u-text">USD</span>
          <span className="p-text">${parseFloat(activo.precio).toFixed(2)}</span>
        </div>
        <button
          className="btn-action"
          onClick={() => onGuardar(cardKey)}
          disabled={guardando} aria-busy={guardando}
          aria-label={`Actualizar ${activo.nombre_material} variante ${activo.color_nombre}`}
        >
          {guardando ? 'Guardando…' : `Actualizar ${activo.color_nombre}`}
        </button>
      </footer>
    </article>
  );
});

export default MatCardAdmin;