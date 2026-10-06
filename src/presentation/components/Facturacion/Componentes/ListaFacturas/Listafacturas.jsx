import { Search, FileText, Eye, XCircle, 
         AlertCircle, Download, Plus, X } from 'lucide-react';
import FormularioFactura from '../FormularioFactura/FormularioFactura';
import DetalleFactura    from '../DetalleFactura/DetalleFactura';
import useToasts         from './useToasts';
import useListaFacturas  from './useListaFacturas';
import { ESTADO_CONFIG } from './constants';
import './Listafacturas.css';

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="lf-toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map(t => (
        <div key={t.id} className={`lf-toast lf-toast--${t.tipo}`} role="alert">
          <span className="lf-toast__msg">{t.msg}</span>
          <button className="lf-toast__close" onClick={() => onRemove(t.id)}
            aria-label="Cerrar notificación">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const { label, color, Icon } = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.BORRADOR;
  return (
    <span className={`lf-badge lf-badge--${color}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-EC', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

export default function ListaFacturas() {
  const { toasts, remove: removeToast, error: toastError, success: toastSuccess } = useToasts();

  const {
    facturas, loading, error,
    filtros, paginacion,
    modalFormulario,  setModalFormulario,
    facturaDetalleId, setFacturaDetalleId,
    handleBusquedaChange,
    handleEstadoChange,
    handleFacturaCreada,
    handleDescargarPDF,
    paginaAnterior,
    paginaSiguiente,
    cargarFacturas,
    rangoDesde,
    rangoHasta,
  } = useListaFacturas({ onToastError: toastError, onToastSuccess: toastSuccess });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="lista-facturas">

        <div className="lf-filtros">
          <div className="lf-filtros__busqueda">
            <Search size={20} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por cliente o número..."
              value={filtros.busqueda}
              onChange={handleBusquedaChange}
              className="lf-filtros__input"
              aria-label="Buscar facturas"
            />
          </div>

          <select value={filtros.estado} onChange={handleEstadoChange}
            className="lf-filtros__select" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="EMITIDA">Emitida</option>
            <option value="AUTORIZADA">Autorizada</option>
            <option value="ANULADA">Anulada</option>
          </select>

          <button onClick={() => setModalFormulario(true)}
            className="lf-filtros__btn-new" aria-label="Crear nueva factura">
            <Plus size={20} aria-hidden="true" />
            <span>Nueva Factura</span>
          </button>
        </div>

        {loading ? (
          <div className="lf-loading" role="status" aria-live="polite">
            <div className="lf-loading__spinner" aria-hidden="true" />
            <p>Cargando facturas...</p>
          </div>

        ) : error ? (
          <div className="lf-error" role="alert">
            <AlertCircle size={20} aria-hidden="true" />
            <span>{error}</span>
            <button className="lf-error__retry" onClick={cargarFacturas}>
              Reintentar
            </button>
          </div>

        ) : facturas.length === 0 ? (
          <div className="lf-empty">
            <FileText size={48} className="lf-empty__icon" aria-hidden="true" />
            <p className="lf-empty__text">No hay facturas para mostrar</p>
          </div>

        ) : (
          <>
            <div className="lf-tabla-wrapper">
              <table className="lf-tabla" aria-label="Lista de facturas">
                <thead>
                  <tr>
                    <th scope="col">Número</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(factura => (
                    <tr key={factura.id}>
                      <td className="lf-tabla__numero">{factura.numero_factura}</td>
                      <td>{formatearFecha(factura.fecha_emision)}</td>
                      <td className="lf-tabla__cliente">{factura.cliente_nombre}</td>
                      <td className="lf-tabla__monto">${Number.parseFloat(factura.total).toFixed(2)}</td>
                      <td><EstadoBadge estado={factura.estado} /></td>
                      <td>
                        <div className="lf-tabla__acciones">
                          <button
                            onClick={() => setFacturaDetalleId(factura.id)}
                            className="lf-btn lf-btn--ver"
                            aria-label={`Ver detalle de factura ${factura.numero_factura}`}>
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          {factura.estado !== 'ANULADA' && (
                            <button
                              onClick={() => setFacturaDetalleId(factura.id)}
                              className="lf-btn lf-btn--anular"
                              aria-label={`Anular factura ${factura.numero_factura}`}>
                              <XCircle size={16} aria-hidden="true" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDescargarPDF(factura.id, factura.numero_factura)}
                            className="lf-btn lf-btn--descargar"
                            aria-label={`Descargar PDF de factura ${factura.numero_factura}`}>
                            <Download size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lf-paginacion">
              <p className="lf-paginacion__info">
                Mostrando {rangoDesde}–{rangoHasta} de {paginacion.total} facturas
              </p>
              <div className="lf-paginacion__controles">
                <button onClick={paginaAnterior}
                  disabled={paginacion.pagina === 1}
                  className="lf-paginacion__btn" aria-label="Página anterior">
                  Anterior
                </button>
                <span className="lf-paginacion__pagina">
                  Página {paginacion.pagina} de {paginacion.totalPaginas}
                </span>
                <button onClick={paginaSiguiente}
                  disabled={paginacion.pagina === paginacion.totalPaginas}
                  className="lf-paginacion__btn" aria-label="Página siguiente">
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalFormulario && (
        <FormularioFactura
          onCerrar={() => setModalFormulario(false)}
          onFacturaCreada={handleFacturaCreada}
        />
      )}

      {facturaDetalleId && (
        <DetalleFactura
          facturaId={facturaDetalleId}
          onCerrar={() => setFacturaDetalleId(null)}
          onAnulada={cargarFacturas}
        />
      )}
    </>
  );
}
