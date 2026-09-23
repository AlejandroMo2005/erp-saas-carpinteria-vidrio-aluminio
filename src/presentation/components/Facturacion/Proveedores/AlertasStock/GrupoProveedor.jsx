import { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';

export default function GrupoProveedor({ grupo, onGenerarPedido }) {
  const [expandido,     setExpandido]     = useState(true);
  const [seleccionados, setSeleccionados] = useState(
    grupo.items.map(i => i.variante_id)
  );
  const [cantidades, setCantidades] = useState(
    Object.fromEntries(grupo.items.map(i => [i.variante_id, i.stock_minimo * 2]))
  );

  const toggleItem = (id) =>
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const cambiarCantidad = (id, val) =>
    setCantidades(prev => ({ ...prev, [id]: val }));

  const generarPedido = () => {
    const items = grupo.items
      .filter(i => seleccionados.includes(i.variante_id))
      .map(i => ({
        material_id:     i.variante_id,
        nombre_material: `${i.material}${i.color ? ` - ${i.color}` : ''}`,
        cantidad:        cantidades[i.variante_id] ?? i.stock_minimo * 2,
        unidad:          'unidad',
      }));
    if (items.length === 0) return;
    onGenerarPedido(grupo.proveedor_id, grupo.proveedor, grupo.telefono_whatsapp, items);
  };

  const sinProveedor = !grupo.proveedor_id;
  const headingId    = `grupo-heading-${grupo.proveedor_id ?? 'null'}`;
  const bodyId       = `grupo-body-${grupo.proveedor_id ?? 'null'}`;

  return (
    <div
      className={`alerta-grupo${sinProveedor ? ' alerta-grupo--sin-prov' : ''}`}
      role="region"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="alerta-grupo__heading">
        <button
          className="alerta-grupo__header"
          onClick={() => setExpandido(e => !e)}
          aria-expanded={expandido}
          aria-controls={bodyId}
        >
          <div className="alerta-grupo__info">
            <span className="alerta-grupo__nombre">
              {grupo.proveedor ?? 'Sin proveedor asignado'}
            </span>
            {grupo.ciudad && (
              <span className="alerta-grupo__ciudad">{grupo.ciudad}</span>
            )}
            <span className="prov-badge--alerta"
              aria-label={`${grupo.items.length} variantes`}>
              {grupo.items.length}
            </span>
          </div>
          {expandido
            ? <ChevronUp   size={18} aria-hidden="true" />
            : <ChevronDown size={18} aria-hidden="true" />
          }
        </button>
      </h3>

      {expandido && (
        <div className="alerta-grupo__body" id={bodyId}>
          {grupo.items.map(item => {
            const pct     = Math.round((item.stock / item.stock_minimo) * 100);
            const sel     = seleccionados.includes(item.variante_id);
            const checkId = `check-${item.variante_id}`;
            const inputId = `cant-${item.variante_id}`;

            return (
              <div
                key={item.variante_id}
                className={`alerta-item${sel ? ' alerta-item--sel' : ''}`}
                data-estado={item.variante_id}
              >
                <div className="alerta-item__check-wrap">
                  <label htmlFor={checkId} className="sr-only">
                    {`Seleccionar ${item.material}${item.color ? ` - ${item.color}` : ''}`}
                  </label>
                  <input
                    id={checkId}
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleItem(item.variante_id)}
                    className="alerta-item__check"
                  />
                </div>

                <div className="alerta-item__info">
                  <span className="alerta-item__nombre">
                    {item.material}{item.color ? ` - ${item.color}` : ''}
                  </span>
                  <div
                    className="alerta-item__stock-bar"
                    role="progressbar"
                    aria-valuenow={item.stock}
                    aria-valuemin={0}
                    aria-valuemax={item.stock_minimo}
                    aria-label={`Stock: ${item.stock} de ${item.stock_minimo} mínimo`}
                  >
                    <div
                      className="alerta-item__stock-fill"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="alerta-item__stock-txt">
                    Hay {item.stock} — mínimo {item.stock_minimo}
                  </span>
                </div>

                <div className="alerta-item__cantidad">
                  <label htmlFor={inputId} className="alerta-item__cant-label">
                    Solicitar
                  </label>
                  <input
                    id={inputId}
                    type="number"
                    min={1}
                    value={cantidades[item.variante_id] ?? ''}
                    onChange={e => cambiarCantidad(item.variante_id, e.target.value)}
                    className="alerta-item__cant-input"
                  />
                </div>
              </div>
            );
          })}

          {!sinProveedor && (
            <div className="alerta-grupo__footer">
              <button
                type="button"
                className="alerta-btn-pedido"
                onClick={generarPedido}
                disabled={seleccionados.length === 0}
              >
                <ShoppingCart size={16} aria-hidden="true" />
                Generar solicitud
                {grupo.telefono_whatsapp && (
                  <span className="alerta-btn-pedido__wt" aria-hidden="true">
                    → WhatsApp
                  </span>
                )}
              </button>
            </div>
          )}

          {sinProveedor && (
            <p className="alerta-sin-prov-hint">
              Asigna un proveedor a estos materiales para poder generar una solicitud.
            </p>
          )}
        </div>
      )}
    </div>
  );
}