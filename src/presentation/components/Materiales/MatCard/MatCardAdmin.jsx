import { memo } from 'react';

import MatCardBase from './MatCardBase';
import { STOCK_MAX, PRECIO_MAX } from '../constants/materialesConstants';

const MatCardAdmin = memo(function MatCardAdmin({
  cardKey,
  variantes,
  activo,
  edit,
  onSeleccionar,
  onCampo,
  onGuardar,
  guardando,
}) {
  const stockId = `stock-${activo.variante_id}`;
  const precioId = `precio-${activo.variante_id}`;

  return (
    <MatCardBase
      cardKey={cardKey}
      variantes={variantes}
      activo={activo}
      onSeleccionar={onSeleccionar}
      footer={
        <footer className="mat-card-footer">
          <div className="price-row">
            <span className="u-text">USD</span>
            <span className="p-text">
              ${Number.parseFloat(activo.precio).toFixed(2)}
            </span>
          </div>

          <button
            className="btn-action"
            onClick={() => onGuardar(cardKey)}
            disabled={guardando}
            aria-busy={guardando}
            aria-label={`Actualizar ${activo.nombre_material} variante ${activo.color_nombre}`}
          >
            {guardando ? 'Guardando…' : `Actualizar ${activo.color_nombre}`}
          </button>
        </footer>
      }
    >
      <div className="edit-fields">
        <div className="field-group">
          <label htmlFor={stockId} className="field-label">
            STOCK
          </label>
          <input
            id={stockId}
            type="number"
            className="field-input"
            value={edit?.stock ?? 0}
            min="0"
            max={STOCK_MAX}
            step="1"
            onChange={(e) => onCampo(cardKey, 'stock', e.target.value)}
          />
        </div>

        <div className="field-group">
          <label htmlFor={precioId} className="field-label">
            PRECIO
          </label>
          <input
            id={precioId}
            type="number"
            step="0.01"
            min="0"
            max={PRECIO_MAX}
            className="field-input"
            value={edit?.precio ?? 0}
            onChange={(e) => onCampo(cardKey, 'precio', e.target.value)}
          />
        </div>
      </div>
    </MatCardBase>
  );
});

export default MatCardAdmin;
