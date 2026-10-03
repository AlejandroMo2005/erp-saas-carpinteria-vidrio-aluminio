import { useState, lazy, Suspense } from 'react';
import { Package, Activity } from 'lucide-react';
import { useAccessibility }    from '../../context/useAccessibility';
import { useDashboardResumen } from '../../hooks/useDashboard';
import { KPI_CONFIG }          from './constants';
import { fmt }                 from './utils';
import './dashboard_.css';      // tokens KPI vars
import './Dashboard.page.css';  // layout, header, contenedor, error
import './Dashboard.kpi.css';   // tarjetas KPI + skeleton
import './Dashboard.nav.css';   // botones secundarios
import './Dashboard.loading.css'; // spinner + loading view

const Ingresos  = lazy(() => import('./Ingresos/Ingresos'));
const Pedidos   = lazy(() => import('./Pedidos/Pedidos'));
const Usuarios  = lazy(() => import('./Usuarios/Usuarios'));
const Ticket    = lazy(() => import('./Ticket/Ticket'));
const Productos = lazy(() => import('./Productos/Productos'));
const Estado    = lazy(() => import('./Estado/Estado'));

const KPICard = ({ label, value, icon: Icon, color, active, onClick, highContrast, skeleton }) => {
  const iconBg    = highContrast ? '#000000' : `${color}22`;
  const iconColor = highContrast ? '#ffff00' : color;
  return (
    <button
      className={`db-kpi${active ? ' db-kpi--active' : ''}${skeleton ? ' db-kpi--skeleton' : ''}`}
      onClick={onClick}
      aria-pressed={active}
      disabled={skeleton}
    >
      <div className="db-kpi__icon" style={{
        background: iconBg,
        border: highContrast ? '2px solid #ffff00' : 'none',
      }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div className="db-kpi__body">
        <div className={`db-kpi__value${skeleton ? ' db-kpi__value--skeleton' : ''}`}>
          {value}
        </div>
        <div className={`db-kpi__label${skeleton ? ' db-kpi__label--skeleton' : ''}`}>
          {label}
        </div>
      </div>
    </button>
  );
};

const LoadingView = () => (
  <div className="db-loading-view">
    <div className="db-spinner" />
    <p>Cargando datos…</p>
  </div>
);

export default function Dashboard() {
  const { darkMode, highContrast } = useAccessibility();
  const [vistaActiva, setVistaActiva] = useState(null);

  const { data: resumen, isLoading, isPlaceholderData, isError } = useDashboardResumen();

  const mostrarSkeleton = isLoading || isPlaceholderData;
  const toggleVista = (vista) => setVistaActiva((prev) => (prev === vista ? null : vista));

  return (
    <div className="db-page">

      <header className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">Métricas de ventas e inventario</p>
        </div>
      </header>

      {isError && (
        <div className="db-error-banner" role="alert">
          No se pudieron cargar las métricas. Los datos mostrados pueden estar desactualizados.
        </div>
      )}

      <section className="db-kpi-row" aria-label="Indicadores clave">
        {KPI_CONFIG.map(({ key, label, icon, color, vista, getValue, format }) => (
          <KPICard
            key={key}
            label={label}
            value={format === 'money' ? fmt(getValue(resumen)) : (getValue(resumen) ?? '—')}
            icon={icon}
            color={color}
            active={vistaActiva === vista}
            onClick={() => toggleVista(vista)}
            highContrast={highContrast}
            skeleton={mostrarSkeleton}
          />
        ))}
      </section>

      <section className="db-secondary-row">
        <button
          className={`db-secondary-btn${vistaActiva === 'productos' ? ' db-secondary-btn--active' : ''}`}
          onClick={() => toggleVista('productos')}
        >
          <Package size={18} /><span>Productos</span>
        </button>
        <button
          className={`db-secondary-btn${vistaActiva === 'estado' ? ' db-secondary-btn--active' : ''}`}
          onClick={() => toggleVista('estado')}
        >
          <Activity size={18} /><span>Estados de pedido</span>
        </button>
      </section>

      {vistaActiva && (
        <Suspense fallback={<LoadingView />}>
          <div className="db-vista-container">
            {vistaActiva === 'ingresos'  && <Ingresos  darkMode={darkMode} highContrast={highContrast} />}
            {vistaActiva === 'pedidos'   && <Pedidos   darkMode={darkMode} highContrast={highContrast} />}
            {vistaActiva === 'usuarios'  && <Usuarios  darkMode={darkMode} highContrast={highContrast} />}
            {vistaActiva === 'ticket'    && <Ticket    darkMode={darkMode} highContrast={highContrast} />}
            {vistaActiva === 'productos' && <Productos darkMode={darkMode} highContrast={highContrast} />}
            {vistaActiva === 'estado'    && <Estado    darkMode={darkMode} highContrast={highContrast} />}
          </div>
        </Suspense>
      )}
    </div>
  );
}