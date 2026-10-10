import { memo } from 'react';

import './MatCard.css';
import IconoMaterial from '../IconoMaterial/IconoMaterial';
import { normalizarColor } from '../utils/materialesUtils';

const MatCardBase = memo(function MatCardBase({
  cardKey,
  variantes,
  activo,
  onSeleccionar,
  etiquetaSeleccion = 'Seleccionar color',
  claseTarjeta = '',
  children,
  footer,
}) {
  return (
    <article className={`mat-card ${claseTarjeta}`.trim()}>
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
        <IconoMaterial
          nombre={activo.nombre_material}
          colorHex={activo.color_valor}
        />

        <h2 className="mat-title">{activo.nombre_material}</h2>

        <div
          className="selector-colores"
          role="group"
          aria-label={`Variantes de color para ${activo.nombre_material}`}
        >
          {variantes.map((variante) => (
            <button
              key={variante.variante_id}
              type="button"
              className={`color-btn-wrapper${activo.variante_id === variante.variante_id ? ' active' : ''}`}
              aria-label={`${etiquetaSeleccion} ${variante.color_nombre}`}
              aria-pressed={activo.variante_id === variante.variante_id}
              onClick={() => onSeleccionar(cardKey, variante)}
            >
              <span
                className="color-sample"
                style={{
                  backgroundColor: normalizarColor(variante.color_valor),
                }}
              />
            </button>
          ))}
        </div>

        {activo.color_nombre && (
          <div className="active-color-label" aria-live="polite">
            {activo.color_nombre}
          </div>
        )}

        {children}
      </div>

      {footer}
    </article>
  );
});

export default MatCardBase;
