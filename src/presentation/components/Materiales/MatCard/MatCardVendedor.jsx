import { memo } from 'react';

import MatCardBase from './MatCardBase';

const MatCardVendedor = memo(function MatCardVendedor({
  cardKey,
  variantes,
  activo,
  onSeleccionar,
}) {
  return (
    <MatCardBase
      cardKey={cardKey}
      variantes={variantes}
      activo={activo}
      onSeleccionar={onSeleccionar}
      etiquetaSeleccion="Ver color"
      claseTarjeta="mat-card--readonly"
      footer={
        <footer className="mat-card-footer mat-card-footer--readonly">
          <div className="price-row">
            <span className="u-text">USD</span>
            <span className="p-text">
              ${Number.parseFloat(activo.precio).toFixed(2)}
            </span>
          </div>

          <div className="readonly-badge" aria-label="Vista de solo lectura">
            Solo lectura
          </div>
        </footer>
      }
    >
      <div className="info-fields">
        <div className="info-row">
          <span className="info-label">STOCK</span>
          <span className="info-value">{activo.stock}</span>
        </div>

        <div className="info-row">
          <span className="info-label">PRECIO</span>
          <span className="info-value">
            ${Number.parseFloat(activo.precio).toFixed(2)}
          </span>
        </div>
      </div>
    </MatCardBase>
  );
});

export default MatCardVendedor;
