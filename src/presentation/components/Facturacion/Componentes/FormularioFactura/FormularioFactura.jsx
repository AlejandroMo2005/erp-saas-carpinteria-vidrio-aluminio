import { useState, useEffect, useRef, useId } from 'react';
import {
  X, Plus, Trash2, AlertCircle, CheckCircle,
  FileText, ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import SelectorCliente       from '../SelectorCliente/SelectorCliente';
import useFormularioFactura  from './useFormularioFactura';
import usePedidosCliente     from './usePedidosCliente';
import { calcularItem }      from './utils';
import { PASOS }             from './constants';
import './FormularioFactura.css';

export default function FormularioFactura({ onCerrar, onFacturaCreada, pedidoId = null }) {
  const idTitulo      = useId();
  const idDescripcion = useId();
  const idPedidosHint = useId();
  const modalRef      = useRef(null);

  const {
    paso, clienteSeleccionado, setCliente,
    items, setItems,
    observaciones, setObservaciones,
    tasaIva, guardando, errores, setErrores,
    errorGeneral, exito, facturaCreada,
    totales,
    agregarItem, eliminarItem, cambiarCampoItem,
    avanzarPaso, retrocederPaso,
    guardar,
  } = useFormularioFactura({ pedidoId, onFacturaCreada });

  const {
    pedidosCliente, cargandoPedidos, pedidoVinculado,
    errorPedidosCliente, cargandoItemsPedido, errorPedido,
    seleccionarPedido, desvincularPedido,
  } = usePedidosCliente({ clienteId: clienteSeleccionado?.id });

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && !guardando) onCerrar?.(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [guardando, onCerrar]);

  if (exito && facturaCreada) {
    return (
      <div className="ff-overlay" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <div className="ff-modal ff-modal--exito" ref={modalRef}>
          <div className="ff-exito">
            <div className="ff-exito__icono" aria-hidden="true"><CheckCircle size={48} /></div>
            <h2 id={idTitulo} className="ff-exito__titulo">¡Factura creada!</h2>
            <p className="ff-exito__numero">{facturaCreada.numero_factura}</p>
            <p className="ff-exito__total">Total: <strong>${parseFloat(facturaCreada.total).toFixed(2)}</strong></p>
            <button onClick={onCerrar} className="ff-exito__btn">Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-overlay" role="dialog" aria-modal="true"
      aria-labelledby={idTitulo} aria-describedby={idDescripcion}
      onClick={(e) => { if (e.target === e.currentTarget && !guardando) onCerrar?.(); }}>
      <span id={idDescripcion} className="sr-only">Formulario de creación de factura. Paso {paso} de 3.</span>

      <div className="ff-modal" ref={modalRef}>

        {/* HEADER */}
        <div className="ff-modal__header">
          <div className="ff-modal__header-info">
            <FileText size={20} aria-hidden="true" />
            <h2 id={idTitulo}>Nueva Factura</h2>
          </div>
          <button onClick={onCerrar} className="ff-modal__cerrar"
            aria-label="Cerrar formulario" disabled={guardando}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* STEPPER */}
        <nav className="ff-stepper" aria-label="Pasos del formulario">
          <ol className="ff-stepper__lista" role="list">
            {PASOS.map(({ n, label }) => {
              const estaActivo = paso === n;
              const estaHecho  = paso > n;
              return (
                <li key={n} role="listitem"
                  className={['ff-step', estaActivo && 'ff-step--active', estaHecho && 'ff-step--done'].filter(Boolean).join(' ')}
                  aria-current={estaActivo ? 'step' : undefined}>
                  <span className="ff-step__num" aria-hidden="true">{estaHecho ? '✓' : n}</span>
                  {estaHecho && <span className="sr-only">{label} — completado</span>}
                  <span className="ff-step__label" aria-hidden={estaHecho}>{label}</span>
                  {n < 3 && <span className="ff-step__linea" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* BODY */}
        <div className="ff-modal__body">

          {/* PASO 1 */}
          {paso === 1 && (
            <div className="ff-paso">
              <h3 className="ff-paso__titulo">Datos del cliente</h3>

              <SelectorCliente
                onSeleccionar={(c) => {
                  setCliente(c);
                  setErrores(prev => { const n = { ...prev }; delete n.cliente; return n; });
                }}
                onLimpiar={() => setCliente(null)}
                clienteSeleccionado={clienteSeleccionado}
              />

              {errores.cliente && (
                <span className="ff-campo-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />{errores.cliente}
                </span>
              )}

              {clienteSeleccionado?.id && (
                <section className="ff-pedidos-cliente"
                  aria-label="Pedidos del cliente" aria-live="polite" aria-busy={cargandoPedidos}>
                  <h4 className="ff-pedidos-cliente__titulo">Pedidos entregados sin facturar</h4>

                  {cargandoPedidos && (
                    <div className="ff-pedidos-cliente__cargando" role="status">
                      <span className="ff-pedidos-cliente__spinner" aria-hidden="true" />
                      <span>Buscando pedidos…</span>
                    </div>
                  )}
                  {!cargandoPedidos && errorPedidosCliente && (
                    <div className="ff-pedidos-cliente__aviso" role="alert">
                      <AlertCircle size={14} aria-hidden="true" /><span>{errorPedidosCliente}</span>
                    </div>
                  )}
                  {!cargandoPedidos && !errorPedidosCliente && pedidosCliente.length === 0 && (
                    <p className="ff-pedidos-cliente__vacio" role="status">
                      Este cliente no tiene pedidos pendientes de facturar.
                    </p>
                  )}
                  {!cargandoPedidos && pedidosCliente.length > 0 && (
                    <>
                      <p className="ff-pedidos-cliente__hint" id={idPedidosHint}>
                        Selecciona un pedido para pre-cargar sus ítems.
                      </p>
                      <ul className="ff-pedidos-lista" role="list" aria-describedby={idPedidosHint}>
                        {pedidosCliente.map(p => {
                          const estaActivo = pedidoVinculado?.id === p.id;
                          return (
                            <li key={p.id} role="listitem">
                              <button type="button"
                                className={`ff-pedido-card${estaActivo ? ' ff-pedido-card--activo' : ''}`}
                                onClick={() => seleccionarPedido(p, setItems)}
                                aria-pressed={estaActivo}
                                disabled={cargandoItemsPedido && !estaActivo}>
                                <span className="ff-pedido-card__id" aria-hidden="true">#{p.id}</span>
                                <span className="ff-pedido-card__fecha" aria-hidden="true">
                                  <time dateTime={p.fecha}>{new Date(p.fecha).toLocaleDateString('es-EC')}</time>
                                </span>
                                <span className="ff-pedido-card__trabajos" aria-hidden="true">
                                  {p.trabajos_nombres || 'Sin descripción'}
                                </span>
                                <span className="ff-pedido-card__total" aria-hidden="true">
                                  ${Number(p.total).toFixed(2)}
                                </span>
                                {estaActivo && <span className="ff-pedido-card__check" aria-hidden="true">✓</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  {cargandoItemsPedido && (
                    <div className="ff-pedidos-cliente__cargando ff-pedidos-cliente__cargando--items" role="status">
                      <span className="ff-pedidos-cliente__spinner" aria-hidden="true" />
                      <span>Cargando ítems…</span>
                    </div>
                  )}
                </section>
              )}

              <div className="ff-grupo">
                <label className="ff-label" htmlFor="ff-obs">
                  Observaciones <span className="ff-opcional">(opcional)</span>
                </label>
                <textarea id="ff-obs" value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="ff-textarea" placeholder="Notas adicionales…" rows={3} />
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div className="ff-paso">
              {errorPedido && (
                <div className="ff-aviso-pedido" role="alert">
                  <AlertCircle size={14} aria-hidden="true" /><span>{errorPedido}</span>
                </div>
              )}
              {pedidoVinculado && (
                <div className="ff-pedido-vinculado" role="status">
                  <span className="ff-pedido-vinculado__icono" aria-hidden="true"><FileText size={14} /></span>
                  <span className="ff-pedido-vinculado__texto">
                    Pedido vinculado: <strong>#{pedidoVinculado.id}</strong> — Referencia:{' '}
                    <strong className="ff-pedido-vinculado__total">${Number(pedidoVinculado.total).toFixed(2)}</strong>
                  </span>
                  <button type="button" className="ff-pedido-vinculado__quitar"
                    onClick={() => desvincularPedido(setItems)}
                    aria-label={`Desvincular pedido #${pedidoVinculado.id}`}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className="ff-paso__header">
                <h3 className="ff-paso__titulo">Productos / Servicios</h3>
                <span className="ff-paso__iva-tag">IVA: {(tasaIva * 100).toFixed(0)}%</span>
              </div>

              <div className="ff-items" role="list" aria-label="Líneas de la factura">
                {items.map((item, idx) => (
                  <ItemRow key={item._id} item={item} idx={idx}
                    tasaIva={tasaIva} errores={errores}
                    onCampo={cambiarCampoItem}
                    onEliminar={eliminarItem}
                    puedeEliminar={items.length > 1} />
                ))}
              </div>

              <button type="button" onClick={agregarItem} className="ff-btn-agregar">
                <Plus size={16} aria-hidden="true" /> Agregar línea
              </button>

              <div className="ff-subtotales">
                <div className="ff-subtotales__fila"><span>Subtotal sin IVA</span><span>${totales.subtotal_sin_iva.toFixed(2)}</span></div>
                <div className="ff-subtotales__fila"><span>Subtotal gravado</span><span>${totales.subtotal_con_iva.toFixed(2)}</span></div>
                <div className="ff-subtotales__fila"><span>IVA ({(tasaIva * 100).toFixed(0)}%)</span><span>${totales.iva.toFixed(2)}</span></div>
                <div className="ff-subtotales__fila ff-subtotales__fila--total"><span>TOTAL</span><span>${totales.total.toFixed(2)}</span></div>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <div className="ff-paso">
              <h3 className="ff-paso__titulo">Revisión final</h3>

              <div className="ff-preview-seccion">
                <h4 className="ff-preview-seccion__titulo">Cliente</h4>
                <dl className="ff-preview-grid">
                  <dt className="ff-preview-grid__clave">Nombre</dt>
                  <dd className="ff-preview-grid__valor">{clienteSeleccionado?.nombre}</dd>
                  {clienteSeleccionado?.identificacion && (<>
                    <dt className="ff-preview-grid__clave">{clienteSeleccionado.tipo_identificacion}</dt>
                    <dd className="ff-preview-grid__valor">{clienteSeleccionado.identificacion}</dd>
                  </>)}
                  {clienteSeleccionado?.telefono && (<>
                    <dt className="ff-preview-grid__clave">Teléfono</dt>
                    <dd className="ff-preview-grid__valor">{clienteSeleccionado.telefono}</dd>
                  </>)}
                  {clienteSeleccionado?.email && (<>
                    <dt className="ff-preview-grid__clave">Email</dt>
                    <dd className="ff-preview-grid__valor">{clienteSeleccionado.email}</dd>
                  </>)}
                  {pedidoVinculado && (<>
                    <dt className="ff-preview-grid__clave">Pedido ref.</dt>
                    <dd className="ff-preview-grid__valor">#{pedidoVinculado.id}</dd>
                  </>)}
                </dl>
              </div>

              <div className="ff-preview-seccion">
                <h4 className="ff-preview-seccion__titulo">Detalle</h4>
                <div className="ff-preview-tabla-wrapper">
                  <table className="ff-preview-tabla">
                    <thead>
                      <tr>
                        <th scope="col">Descripción</th>
                        <th scope="col">Cant.</th>
                        <th scope="col">P. Unit.</th>
                        <th scope="col">Desc.</th>
                        <th scope="col">IVA</th>
                        <th scope="col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const { total } = calcularItem(item, tasaIva);
                        return (
                          <tr key={item._id}>
                            <td>{item.descripcion}</td>
                            <td>{item.cantidad}</td>
                            <td>${parseFloat(item.precio_unitario).toFixed(2)}</td>
                            <td>${parseFloat(item.descuento || 0).toFixed(2)}</td>
                            <td>{item.aplica_iva ? `${(tasaIva * 100).toFixed(0)}%` : '0%'}</td>
                            <td>${total.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ff-preview-seccion">
                <h4 className="ff-preview-seccion__titulo">Totales</h4>
                <dl className="ff-preview-totales">
                  <div className="ff-preview-totales__fila"><dt>Subtotal sin IVA</dt><dd>${totales.subtotal_sin_iva.toFixed(2)}</dd></div>
                  <div className="ff-preview-totales__fila"><dt>Subtotal con IVA</dt><dd>${totales.subtotal_con_iva.toFixed(2)}</dd></div>
                  <div className="ff-preview-totales__fila"><dt>IVA ({(tasaIva * 100).toFixed(0)}%)</dt><dd>${totales.iva.toFixed(2)}</dd></div>
                  <div className="ff-preview-totales__fila ff-preview-totales__fila--total"><dt>TOTAL A PAGAR</dt><dd>${totales.total.toFixed(2)}</dd></div>
                </dl>
              </div>

              {observaciones && (
                <div className="ff-preview-seccion">
                  <h4 className="ff-preview-seccion__titulo">Observaciones</h4>
                  <p className="ff-preview-obs">{observaciones}</p>
                </div>
              )}

              {errorGeneral && (
                <div className="ff-error-general" role="alert" aria-live="assertive">
                  <AlertCircle size={16} aria-hidden="true" /><span>{errorGeneral}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="ff-modal__footer">
          {paso > 1 && (
            <button type="button" onClick={retrocederPaso}
              className="ff-footer-btn ff-footer-btn--back" disabled={guardando}>
              Atrás
            </button>
          )}
          <span className="ff-footer__spacer" aria-hidden="true" />
          {paso < 3 ? (
            <button type="button" onClick={avanzarPaso} className="ff-footer-btn ff-footer-btn--next">
              Continuar
            </button>
          ) : (
            <button type="button" onClick={() => guardar(pedidoVinculado)}
              className="ff-footer-btn ff-footer-btn--guardar"
              disabled={guardando} aria-busy={guardando}>
              <Save size={18} aria-hidden="true" />
              {guardando ? 'Guardando…' : 'Emitir factura'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function ItemRow({ item, idx, tasaIva, errores, onCampo, onEliminar, puedeEliminar }) {
  const [expandido, setExpandido] = useState(false);
  const { subtotal, iva, total }  = calcularItem(item, tasaIva);

  const idDesc   = `ff-desc-${item._id}`;
  const idCant   = `ff-cant-${item._id}`;
  const idPrecio = `ff-precio-${item._id}`;
  const idDescu  = `ff-descu-${item._id}`;
  const idDesc2  = `ff-desc2-${item._id}`;
  const idIva    = `ff-iva-${item._id}`;

  return (
    <div className="ff-item" role="listitem">
      <div className="ff-item__cabecera">
        <span className="ff-item__num" aria-hidden="true">#{idx + 1}</span>
        <button type="button" onClick={() => setExpandido(v => !v)} className="ff-item__toggle"
          aria-expanded={expandido} aria-controls={`ff-item-extra-${item._id}`}>
          {expandido ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
        {puedeEliminar && (
          <button type="button" onClick={() => onEliminar(item._id)} className="ff-item__eliminar">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="ff-item__fila">
        <div className="ff-item__campo">
          <label className="ff-item__label" htmlFor={idDesc}>Descripción <span aria-hidden="true">*</span></label>
          <input id={idDesc} type="text" value={item.descripcion}
            onChange={(e) => onCampo(item._id, 'descripcion', e.target.value)}
            className={`ff-item__input${errores[`item_${item._id}_descripcion`] ? ' ff-item__input--error' : ''}`}
            placeholder="Descripción del producto o servicio" />
          {errores[`item_${item._id}_descripcion`] && (
            <span className="ff-item__error" role="alert">{errores[`item_${item._id}_descripcion`]}</span>
          )}
        </div>
        <div className="ff-item__campo">
          <label className="ff-item__label" htmlFor={idCant}>Cantidad</label>
          <input id={idCant} type="number" min="0.01" step="0.01" value={item.cantidad}
            onChange={(e) => onCampo(item._id, 'cantidad', e.target.value)}
            className={`ff-item__input${errores[`item_${item._id}_cantidad`] ? ' ff-item__input--error' : ''}`} />
          {errores[`item_${item._id}_cantidad`] && (
            <span className="ff-item__error" role="alert">{errores[`item_${item._id}_cantidad`]}</span>
          )}
        </div>
        <div className="ff-item__campo">
          <label className="ff-item__label" htmlFor={idPrecio}>P. Unitario</label>
          <input id={idPrecio} type="number" min="0" step="0.01" value={item.precio_unitario}
            onChange={(e) => onCampo(item._id, 'precio_unitario', e.target.value)}
            className="ff-item__input" />
        </div>
      </div>

      <div id={`ff-item-extra-${item._id}`} className="ff-item__fila ff-item__fila--extra"
        hidden={!expandido} aria-hidden={!expandido}>
        <div className="ff-item__campo">
          <label className="ff-item__label" htmlFor={idDesc2}>
            Desc. adicional <span className="ff-opcional">(opcional)</span>
          </label>
          <input id={idDesc2} type="text" value={item.descripcion_extra ?? ''}
            onChange={(e) => onCampo(item._id, 'descripcion_extra', e.target.value)}
            className="ff-item__input" placeholder="Detalle complementario" />
        </div>
        <div className="ff-item__campo">
          <label className="ff-item__label" htmlFor={idDescu}>Descuento $</label>
          <input id={idDescu} type="number" min="0" step="0.01" value={item.descuento}
            onChange={(e) => onCampo(item._id, 'descuento', e.target.value)}
            className="ff-item__input" />
        </div>
        <div className="ff-item__campo">
          <span className="ff-item__label" id={`ff-iva-label-${item._id}`}>Aplica IVA</span>
          <div className="ff-item__toggle-iva">
            <input id={idIva} type="checkbox" checked={item.aplica_iva}
              onChange={(e) => onCampo(item._id, 'aplica_iva', e.target.checked)}
              className="ff-item__checkbox" aria-labelledby={`ff-iva-label-${item._id}`} />
            <label htmlFor={idIva} className="ff-item__checkbox-label">
              {item.aplica_iva ? `Sí (${(tasaIva * 100).toFixed(0)}%)` : 'No (0%)'}
            </label>
          </div>
        </div>
      </div>

      <div className="ff-item__totales">
        <span aria-hidden="true">Subtotal: <strong>${subtotal.toFixed(2)}</strong></span>
        <span aria-hidden="true">IVA: <strong>${iva.toFixed(2)}</strong></span>
        <span className="ff-item__totales--total" aria-hidden="true">Total: <strong>${total.toFixed(2)}</strong></span>
      </div>
    </div>
  );
}