// ItemTrabajo/ItemTrabajo.jsx

import React, { memo } from 'react';
import { MEDIDA_MAX, CANT_MAX, TEXTO_MAX } from '../constants/proformaConstants';
import { esColorClaro } from '../utils/proformaUtils';
import './ItemTrabajo.css';

const ItemTrabajo = memo(function ItemTrabajo({
  item, idx, trabajos, coloresDB, mapaColores,
  onUpdate, onRemove, puedeEliminar,
  loadingTrabajos, loadingColores,
}) {
  const hexActivo  = item.color_hex || mapaColores[String(item.color_id)]?.hex || '#d1d5db';
  const bolitaClara = esColorClaro(hexActivo);

  return (
    <section className="item-work-card">
      <div className="item-card-header">
        <h2 className="item-number">Trabajo #{idx + 1}</h2>
        {puedeEliminar && (
          <button
            type="button"
            className="delete-item-btn"
            onClick={() => onRemove(item.id)}
            aria-label={`Eliminar trabajo ${idx + 1}`}
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="item-card-body">
        <div className="form-row">
          <div className="field-flex-4">
            <label htmlFor={`trabajo-${item.id}`}>Tipo de trabajo</label>
            <select
              id={`trabajo-${item.id}`}
              className="select-control"
              value={item.trabajo_id}
              onChange={(e) => onUpdate(item.id, 'trabajo_id', e.target.value)}
              aria-required="true"
              disabled={loadingTrabajos}
            >
              <option value="">{loadingTrabajos ? 'Cargando tipos…' : 'Seleccione...'}</option>
              {trabajos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="field-flex-1">
            <label htmlFor={`ancho-${item.id}`}>Ancho</label>
            <input id={`ancho-${item.id}`} type="number"
              min="0.01" max={MEDIDA_MAX} step="0.01"
              value={item.ancho}
              onChange={(e) => onUpdate(item.id, 'ancho', e.target.value)} />
          </div>

          <div className="field-flex-1">
            <label htmlFor={`alto-${item.id}`}>Alto</label>
            <input id={`alto-${item.id}`} type="number"
              min="0.01" max={MEDIDA_MAX} step="0.01"
              value={item.alto}
              onChange={(e) => onUpdate(item.id, 'alto', e.target.value)} />
          </div>

          <div className="field-flex-1">
            <label htmlFor={`cant-${item.id}`}>Cantidad</label>
            <input id={`cant-${item.id}`} type="number"
              min="1" max={CANT_MAX} step="1"
              value={item.cantidad}
              onChange={(e) => onUpdate(item.id, 'cantidad', e.target.value)} />
          </div>
        </div>

        <div className="form-row secondary-row">
          <div className="field-flex-3">
            <label htmlFor={`color-${item.id}`}>Color</label>
            <div className="select-with-preview">
              <div
                className={`color-circle-preview${bolitaClara ? ' color-circle-preview--claro' : ''}`}
                style={{ backgroundColor: hexActivo, transition: 'background-color 0.2s ease' }}
                aria-hidden="true"
                title={item.nombre_color || 'Sin color seleccionado'}
              />
              <select
                id={`color-${item.id}`}
                className="select-control"
                value={item.color_id}
                onChange={(e) => onUpdate(item.id, 'color_id', e.target.value)}
                disabled={loadingColores}
              >
                <option value="">{loadingColores ? 'Cargando colores…' : 'Seleccione color...'}</option>
                {coloresDB.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-flex-4">
            <label htmlFor={`detalle-${item.id}`}>Detalle</label>
            <input
              id={`detalle-${item.id}`}
              value={item.detalle}
              onChange={(e) => onUpdate(item.id, 'detalle', e.target.value)}
              placeholder="Ej: Personalizado, Persona que recibirá..."
              maxLength={TEXTO_MAX}
            />
          </div>
        </div>
      </div>
    </section>
  );
});

export default ItemTrabajo;