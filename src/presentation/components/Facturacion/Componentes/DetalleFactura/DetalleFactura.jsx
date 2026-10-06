import { useState, useEffect, useRef } from 'react';
import {
  FileText, X, Calendar, User, XCircle, AlertCircle, Clock, Download, Printer,
  RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import useDetalleFactura          from './useDetalleFactura';
import { CONFIG_ESTADO, CONFIG_ESTADO_SRI } from './constants';
import { formatearFecha, formatearFechaHora, formatearMoneda } from './utils';
import './DetalleFactura.css';

export default function DetalleFactura({ facturaId, onCerrar, onAnulada }) {
  const [seccionCliente, setSecCliente] = useState(true);
  const [seccionItems,   setSecItems]   = useState(true);
  const modalRef = useRef(null);

  const {
    factura, loading, error,
    anulando, modalAnular,
    motivo, setMotivo,
    errorMotivo,
    cargarFactura,
    handleAnular,
    handleDescargarPDF,
    handleImprimir,
    abrirModalAnular,
    cerrarModalAnular,
  } = useDetalleFactura({ facturaId, onAnulada });

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !anulando && !modalAnular) onCerrar?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [anulando, modalAnular, onCerrar]);

  return (
    <div
      className="df-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de factura"
      onClick={(e) => { if (e.target === e.currentTarget && !modalAnular) onCerrar?.(); }}
    >
      <div className="df-modal" ref={modalRef}>

        <div className="df-modal__header">
          <div className="df-modal__header-info">
            <FileText size={20} aria-hidden="true" />
            <h2>
              {loading ? 'Cargando...' : factura ? factura.numero_factura : 'Detalle de Factura'}
            </h2>
            {factura && <EstadoBadge estado={factura.estado} />}
            {factura?.created_at && (
              <span className="df-header__meta">
                <Clock size={13} aria-hidden="true" />
                {formatearFechaHora(factura.created_at)}
              </span>
            )}
          </div>
          <button onClick={onCerrar} className="df-modal__cerrar" aria-label="Cerrar detalle">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="df-modal__body">

          {loading && (
            <div className="df-loading" role="status" aria-live="polite">
              <div className="df-loading__spinner" aria-hidden="true" />
              <p>Cargando factura...</p>
            </div>
          )}

          {!loading && error && (
            <div className="df-error" role="alert">
              <AlertCircle size={20} aria-hidden="true" />
              <span>{error}</span>
              <button onClick={cargarFactura} className="df-error__retry">
                <RotateCcw size={14} aria-hidden="true" />
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && factura && (
            <>
              <div className="df-resumen">
                <div className="df-resumen__item">
                  <Calendar size={15} aria-hidden="true" />
                  <span className="df-resumen__label">Emisión</span>
                  <span className="df-resumen__valor">{formatearFecha(factura.fecha_emision)}</span>
                </div>
                <div className="df-resumen__sep" aria-hidden="true" />
                <div className="df-resumen__item">
                  <span className="df-resumen__label">#</span>
                  <span className="df-resumen__valor df-resumen__valor--mono">{factura.numero_factura}</span>
                </div>
                <div className="df-resumen__sep" aria-hidden="true" />
                <div className="df-resumen__item">
                  <span className="df-resumen__label">Estado SRI</span>
                  <EstadoSriBadge estado={factura.estado_sri} />
                </div>
                <div className="df-resumen__sep" aria-hidden="true" />
                <div className="df-resumen__item">
                  <span className="df-resumen__label">Total</span>
                  <span className="df-resumen__valor df-resumen__valor--total">
                    {formatearMoneda(factura.total)}
                  </span>
                </div>
              </div>

              {factura.clave_acceso && (
                <div className="df-clave">
                  <span className="df-clave__label">Clave de acceso</span>
                  <span className="df-clave__valor">{factura.clave_acceso}</span>
                </div>
              )}

              <Seccion
                titulo="Datos del cliente"
                icono={<User size={15} />}
                abierto={seccionCliente}
                onToggle={() => setSecCliente(v => !v)}
              >
                <div className="df-grid-datos">
                  <DatoFila label="Nombre" valor={factura.cliente_nombre} />
                  <DatoFila
                    label={factura.cliente_tipo_identificacion ?? 'Identificación'}
                    valor={factura.cliente_identificacion ?? 'Consumidor Final'}
                  />
                  {factura.cliente_telefono  && <DatoFila label="Teléfono"  valor={factura.cliente_telefono}  />}
                  {factura.cliente_email     && <DatoFila label="Email"     valor={factura.cliente_email}     />}
                  {factura.cliente_direccion && <DatoFila label="Dirección" valor={factura.cliente_direccion} />}
                  {factura.usuario_nombre    && <DatoFila label="Vendedor"  valor={factura.usuario_nombre}    />}
                </div>
              </Seccion>

              <Seccion
                titulo="Detalle de productos / servicios"
                icono={<FileText size={15} />}
                abierto={seccionItems}
                onToggle={() => setSecItems(v => !v)}
              >
                <div className="df-tabla-wrapper">
                  <table className="df-tabla" aria-label="Detalle de ítems">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Descripción</th>
                        <th scope="col">Cant.</th>
                        <th scope="col">P. Unit.</th>
                        <th scope="col">Desc.</th>
                        <th scope="col">IVA</th>
                        <th scope="col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(factura.detalle ?? factura.items ?? []).map((item, idx) => {
                        const sub   = Number.parseFloat(item.precio_total_sin_iva) || 0;
                        const iva   = Number.parseFloat(item.valor_iva)            || 0;
                        const total = sub + iva;
                        return (
                          <tr key={item.id ?? idx}>
                            <td className="df-tabla__idx">{idx + 1}</td>
                            <td className="df-tabla__desc">
                              <span className="df-tabla__desc-principal">{item.descripcion}</span>
                              {item.codigo_principal && (
                                <span className="df-tabla__desc-codigo">Cód: {item.codigo_principal}</span>
                              )}
                            </td>
                            <td>{Number.parseFloat(item.cantidad).toFixed(2)}</td>
                            <td>{formatearMoneda(item.precio_unitario)}</td>
                            <td>{formatearMoneda(item.descuento ?? 0)}</td>
                            <td>{Number.parseFloat(item.porcentaje_iva).toFixed(0)}%</td>
                            <td className="df-tabla__total">{formatearMoneda(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="df-totales">
                  <div className="df-totales__fila"><span>Subtotal sin IVA</span><span>{formatearMoneda(factura.subtotal_sin_iva)}</span></div>
                  <div className="df-totales__fila"><span>Subtotal con IVA</span><span>{formatearMoneda(factura.subtotal_con_iva)}</span></div>
                  <div className="df-totales__fila"><span>IVA</span><span>{formatearMoneda(factura.iva)}</span></div>
                  {Number.parseFloat(factura.descuento) > 0 && (
                    <div className="df-totales__fila"><span>Descuento</span><span>- {formatearMoneda(factura.descuento)}</span></div>
                  )}
                  <div className="df-totales__fila df-totales__fila--total">
                    <span>TOTAL</span><span>{formatearMoneda(factura.total)}</span>
                  </div>
                </div>
              </Seccion>

              {factura.observaciones && (
                <div className="df-obs">
                  <span className="df-obs__label">Observaciones</span>
                  <p className="df-obs__texto">{factura.observaciones}</p>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && !error && factura && (
          <div className="df-modal__footer">
            <button onClick={handleImprimir} className="df-footer-btn df-footer-btn--imprimir">
              <Printer size={16} aria-hidden="true" /><span>Imprimir</span>
            </button>
            <button onClick={() => handleDescargarPDF(factura.numero_factura)}
              className="df-footer-btn df-footer-btn--pdf">
              <Download size={16} aria-hidden="true" /><span>Descargar PDF</span>
            </button>
            <span className="df-footer__spacer" />
            {factura.updated_at && (
              <span className="df-footer__meta">
                <Clock size={13} aria-hidden="true" />
                <span>Actualizado: {formatearFechaHora(factura.updated_at)}</span>
              </span>
            )}
            {factura.estado !== 'ANULADA' && (
              <button onClick={abrirModalAnular} className="df-footer-btn df-footer-btn--anular">
                <XCircle size={16} aria-hidden="true" /><span>Anular</span>
              </button>
            )}
          </div>
        )}
      </div>

      {modalAnular && (
        <div className="df-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmar anulación">
          <div className="df-confirm">
            <div className="df-confirm__header">
              <XCircle size={22} className="df-confirm__icono" aria-hidden="true" />
              <h3>Anular factura</h3>
            </div>
            <p className="df-confirm__texto">
              Estás a punto de anular la factura <strong>{factura?.numero_factura}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="df-confirm__grupo">
              <label className="df-confirm__label" htmlFor="df-motivo">
                Motivo de anulación <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="df-motivo"
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); }}
                className="df-confirm__textarea"
                placeholder="Describe el motivo (mín. 10 caracteres)"
                rows={3}
                disabled={anulando}
              />
              {errorMotivo && (
                <span className="df-confirm__error" role="alert">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errorMotivo}
                </span>
              )}
            </div>
            <div className="df-confirm__acciones">
              <button onClick={cerrarModalAnular}
                className="df-confirm__btn df-confirm__btn--cancelar"
                disabled={anulando}>
                Cancelar
              </button>
              <button onClick={handleAnular}
                className="df-confirm__btn df-confirm__btn--confirmar"
                disabled={anulando}>
                {anulando ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Seccion({ titulo, icono, abierto, onToggle, children }) {
  return (
    <div className="df-seccion">
      <button type="button" className="df-seccion__header" onClick={onToggle} aria-expanded={abierto}>
        <span className="df-seccion__header-izq">
          {icono}
          <span className="df-seccion__titulo">{titulo}</span>
        </span>
        {abierto
          ? <ChevronUp   size={16} aria-hidden="true" />
          : <ChevronDown size={16} aria-hidden="true" />}
      </button>
      {abierto && <div className="df-seccion__cuerpo">{children}</div>}
    </div>
  );
}

function DatoFila({ label, valor }) {
  return (
    <>
      <span className="df-grid-datos__clave">{label}</span>
      <span className="df-grid-datos__valor">{valor ?? '—'}</span>
    </>
  );
}

function EstadoBadge({ estado }) {
  const { label, color, Icon } = CONFIG_ESTADO[estado] ?? CONFIG_ESTADO.BORRADOR;
  return (
    <span className={`df-badge df-badge--${color}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

function EstadoSriBadge({ estado }) {
  const { label, color } = CONFIG_ESTADO_SRI[estado] ?? CONFIG_ESTADO_SRI.SIN_ENVIAR;
  return <span className={`df-badge df-badge--${color} df-badge--sm`}>{label}</span>;
}
