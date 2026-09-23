import { lazy, Suspense, useState } from 'react';
import { FileText, BarChart3, Truck } from 'lucide-react';
import './facturacion_.css';
import './Facturacion.page.css';
import './Facturacion.tabs.css';
import './Facturacion.content.css';
import './Facturacion.states.css';

const ListaFacturas   = lazy(() => import('./Componentes/ListaFacturas/ListaFacturas'));
const Estadisticas    = lazy(() => import('./Componentes/Estadisticas/Estadisticas'));
const ProveedoresMain = lazy(() => import('./Proveedores/ProveedoresMain/ProveedoresMain'));

const TABS = [
  { id: 'lista',        label: 'Facturas',     Icon: FileText  },
  { id: 'estadisticas', label: 'Estadísticas', Icon: BarChart3 },
  { id: 'proveedores',  label: 'Proveedores',  Icon: Truck     },
];

const panelId = id => `fact-panel-${id}`;
const tabId   = id => `fact-tab-${id}`;

export default function Facturacion() {
  const [vistaActiva, setVistaActiva] = useState('lista');
  const [visitados,   setVisitados]   = useState(new Set(['lista']));

  const handleTab = (id) => {
    setVistaActiva(id);
    setVisitados(prev => new Set([...prev, id]));
  };

  return (
    <div className="facturacion-container">

      <header className="fact-header">
        <div className="fact-header__info">
          <h1 className="fact-header__title">Facturación Electrónica</h1>
          <p className="fact-header__subtitle">
            Gestión de comprobantes electrónicos y reportes
          </p>
        </div>
      </header>

      <nav aria-label="Módulos de facturación">
        <div className="fact-tabs" role="tablist" aria-label="Módulos de facturación">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              id={tabId(id)}
              role="tab"
              onClick={() => handleTab(id)}
              className={`fact-tab${vistaActiva === id ? ' fact-tab--active' : ''}`}
              aria-selected={vistaActiva === id}
              aria-controls={panelId(id)}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="fact-content">
        {TABS.map(({ id }) => (
          <div
            key={id}
            id={panelId(id)}
            role="tabpanel"
            aria-labelledby={tabId(id)}
            className={`fact-panel${vistaActiva === id ? ' fact-panel--visible' : ''}`}
            aria-hidden={vistaActiva !== id}
          >
            {visitados.has(id) && (
              <Suspense fallback={<LoadingFallback />}>
                {id === 'lista'        && <ListaFacturas />}
                {id === 'estadisticas' && <Estadisticas />}
                {id === 'proveedores'  && <ProveedoresMain />}
              </Suspense>
            )}
          </div>
        ))}
      </main>

    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="fact-loading" role="status" aria-live="polite">
      <div className="fact-loading__spinner" aria-hidden="true" />
      <p className="fact-loading__text">Cargando módulo...</p>
    </div>
  );
}