import { RefreshCw, Users,
  Plus, Pencil, Trash2, Phone, MapPin, Package,
} from 'lucide-react';
import ModalProveedor    from '../ModalProveedor/ModalProveedor';
import AlertasStock      from '../AlertasStock/AlertasStock';
import ModalSolicitud    from '../ModalSolicitud/ModalSolicitud';
import useProveedoresMain from './useProveedoresMain';
import { TABS }          from './constants';
import './ProveedoresMain.css';

const panelId = id => `prov-panel-${id}`;
const tabId   = id => `prov-tab-${id}`;

export default function ProveedoresMain() {
  const {
    tab, setTab,
    proveedores, alertas, historial,
    loading, error,
    modalProv,      setModalProv,
    modalSolicitud, setModalSolicitud,
    cargarHistorial,
    refrescarTab,
    onGuardado,
    eliminar,
    onGenerarPedido,
  } = useProveedoresMain();

  return (
    <div className="prov-main">

      {/* Tabs */}
      <nav aria-label="Secciones de proveedores">
        <div className="prov-tabs" role="tablist" aria-label="Módulos de proveedores">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              id={tabId(id)}
              role="tab"
              onClick={() => setTab(id)}
              className={`prov-tab${tab === id ? ' prov-tab--active' : ''}`}
              aria-selected={tab === id}
              aria-controls={panelId(id)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
              {id === 'alertas' && alertas.length > 0 && (
                <span className="prov-tab__badge"
                  aria-label={`${alertas.length} alertas`}>
                  {alertas.length}
                </span>
              )}
            </button>
          ))}
          <button className="prov-refresh" onClick={refrescarTab}
            aria-label="Actualizar lista">
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {error && <p className="prov-error" role="alert">{error}</p>}

      {/* Panel: Proveedores */}
      <section id={panelId('proveedores')} role="tabpanel"
        aria-labelledby={tabId('proveedores')}
        hidden={tab !== 'proveedores'} className="prov-section">

        <div className="prov-section__header">
          <h2 className="prov-section__title">Mis proveedores</h2>
          <button className="prov-btn-nuevo" onClick={() => setModalProv({})}>
            <Plus size={16} aria-hidden="true" />
            Nuevo proveedor
          </button>
        </div>

        {loading && (
          <p className="prov-loading" role="status" aria-live="polite">Cargando…</p>
        )}

        {!loading && proveedores.length === 0 && (
          <div className="prov-empty" role="status">
            <Users size={40} aria-hidden="true" />
            <h3 className="prov-empty__titulo">No hay proveedores registrados</h3>
            <p className="prov-empty__desc">
              Crea tu primer proveedor para gestionar solicitudes.
            </p>
          </div>
        )}

        <div className="prov-grid">
          {proveedores.map(p => (
            <div key={p.id} className="prov-card">
              <div className="prov-card__top">
                <h3 className="prov-card__nombre">{p.nombre}</h3>
                <div className="prov-card__actions">
                  <button className="prov-card__btn"
                    onClick={() => setModalProv({ proveedor: p })}
                    aria-label={`Editar proveedor ${p.nombre}`}>
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button className="prov-card__btn prov-card__btn--danger"
                    onClick={() => eliminar(p.id)}
                    aria-label={`Eliminar proveedor ${p.nombre}`}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="prov-card__meta">
                {p.ciudad && (
                  <span className="prov-card__meta-item">
                    <MapPin size={13} aria-hidden="true" />{p.ciudad}
                  </span>
                )}
                {p.telefono_whatsapp && (
                  <span className="prov-card__meta-item">
                    <Phone size={13} aria-hidden="true" />{p.telefono_whatsapp}
                  </span>
                )}
                <span className="prov-card__meta-item">
                  <Package size={13} aria-hidden="true" />
                  {p.total_materiales} material{p.total_materiales !== 1 ? 'es' : ''}
                </span>
              </div>
              {p.notas && <p className="prov-card__notas">{p.notas}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Panel: Alertas */}
      <section id={panelId('alertas')} role="tabpanel"
        aria-labelledby={tabId('alertas')}
        hidden={tab !== 'alertas'} className="prov-section">

        <div className="prov-section__header prov-section__header--center">
          <h2 className="prov-section__title">Alertas de stock bajo</h2>
        </div>

        {loading
          ? <p className="prov-loading" role="status" aria-live="polite">Cargando…</p>
          : <AlertasStock alertas={alertas} onGenerarPedido={onGenerarPedido} />
        }
      </section>

      {/* Panel: Historial */}
      <section id={panelId('historial')} role="tabpanel"
        aria-labelledby={tabId('historial')}
        hidden={tab !== 'historial'} className="prov-section">

        <div className="prov-section__header">
          <h2 className="prov-section__title">Historial de solicitudes</h2>
        </div>

        {loading && (
          <p className="prov-loading" role="status" aria-live="polite">Cargando…</p>
        )}

        {!loading && historial.length === 0 && (
          <div className="prov-empty" role="status">
            <History size={40} aria-hidden="true" />
            <h3 className="prov-empty__titulo">Sin solicitudes registradas</h3>
          </div>
        )}

        <div className="hist-lista">
          {historial.map(s => (
            <div key={s.id} className={`hist-item hist-item--${s.estado}`}>
              <div className="hist-item__header">
                <span className="hist-item__prov">{s.proveedor_nombre ?? '—'}</span>
                <span className={`hist-item__estado hist-item__estado--${s.estado}`}>
                  {s.estado === 'enviada' ? 'Enviada ✓' : 'Pendiente'}
                </span>
                <span className="hist-item__fecha">
                  {new Date(s.created_at).toLocaleDateString('es-EC', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              <ul className="hist-item__items" aria-label="Materiales solicitados">
                {s.items?.map((item, i) => (
                  <li key={i}>{item.nombre_material} — {item.cantidad} {item.unidad}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Modales */}
      {modalProv !== null && (
        <ModalProveedor
          proveedor={modalProv.proveedor ?? null}
          onClose={() => setModalProv(null)}
          onGuardado={onGuardado}
        />
      )}

      {modalSolicitud && (
        <ModalSolicitud
          {...modalSolicitud}
          onClose={() => setModalSolicitud(null)}
          onEnviada={() => {
            setModalSolicitud(null);
            cargarHistorial();
          }}
        />
      )}
    </div>
  );
}