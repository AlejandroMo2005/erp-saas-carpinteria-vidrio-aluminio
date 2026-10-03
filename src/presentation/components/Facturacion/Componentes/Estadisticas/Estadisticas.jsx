import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, FileText, Users, AlertCircle,
  BarChart3, RefreshCw,
} from 'lucide-react';
import { useAccessibility }   from '../../../../context/useAccessibility';
import useEstadisticas         from './useEstadisticas';
import { COLORES_ESTADO, COLORES_GRAFICO, PERIODOS } from './constants';
import { formatearMoneda, formatearMes, estiloLinea } from './utils';
import './Estadisticas.css';

export default function Estadisticas() {
  const { darkMode, highContrast } = useAccessibility();
  const { periodo, setPeriodo, loading, error, datos, resumen, cargarDatos } = useEstadisticas();

  const tickColor = highContrast ? '#ffff00' : (darkMode ? '#f8fafc' : '#0f172a');

  if (loading) return <LoadingEstadisticas />;

  if (error) return (
    <div className="est-error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <span>{error}</span>
      <button onClick={cargarDatos} className="est-error__retry">
        <RefreshCw size={16} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );

  const facturacionMensual  = datos?.facturacionMensual  ?? [];
  const topClientes         = datos?.topClientes         ?? [];
  const distribucionEstados = datos?.distribucionEstados ?? [];

  return (
    <div className="estadisticas">

      {/* Header */}
      <div className="est-header">
        <div className="est-header__titulo">
          <BarChart3 size={22} aria-hidden="true" />
          <h2>Estadísticas de Facturación</h2>
        </div>
        <div className="est-header__filtros">
          {PERIODOS.map(({ valor, label }) => (
            <button key={valor} onClick={() => setPeriodo(valor)}
              className={`est-periodo-btn${periodo === valor ? ' est-periodo-btn--active' : ''}`}
              aria-pressed={periodo === valor}>
              {label}
            </button>
          ))}
          <button onClick={cargarDatos} className="est-refresh-btn" aria-label="Actualizar">
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      {resumen && (
        <div className="est-kpis">
          <KpiCard icono={<DollarSign size={22} />} label="Total facturado"
            valor={formatearMoneda(resumen.totalFacturado)}
            variacion={resumen.variacionVsMesAnterior} color="green" highContrast={highContrast} />
          <KpiCard icono={<FileText size={22} />} label="Facturas emitidas"
            valor={resumen.totalFacturas ?? 0}
            variacion={resumen.variacionFacturas} color="blue" highContrast={highContrast} />
          <KpiCard icono={<DollarSign size={22} />} label="Ticket promedio"
            valor={formatearMoneda(resumen.ticketPromedio)}
            variacion={null} color="purple" highContrast={highContrast} />
          <KpiCard icono={<Users size={22} />} label="Clientes únicos"
            valor={resumen.clientesUnicos ?? 0}
            variacion={null} color="orange" highContrast={highContrast} />
        </div>
      )}

      {/* Gráficos fila 1 */}
      <div className="est-grid est-grid--2col">

        <div className="est-card">
          <h3 className="est-card__titulo">Facturación mensual</h3>
          {facturacionMensual.length === 0 ? <Vacio mensaje="Sin datos para el periodo" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={facturacionMensual} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="mes" tickFormatter={formatearMes} interval={0}
                  padding={{ left: 12, right: 12 }}
                  tick={{ fontSize: 12, fontWeight: 700, fill: tickColor }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fontWeight: 700, fill: tickColor }} width={48} />
                <Tooltip content={<TooltipMoneda highContrast={highContrast} />} />
                <Legend wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 700 }}
                  formatter={(value) => (
                    <span style={{ color: tickColor, fontWeight: 700 }}>{value}</span>
                  )} />
                <Line type="monotone" dataKey="total" name="Total facturado"
                  {...estiloLinea('#6366f1', darkMode, highContrast)} />
                <Line type="monotone" dataKey="cantidad" name="Nº facturas"
                  strokeDasharray="5 3"
                  {...estiloLinea('#10b981', darkMode, highContrast)}
                  strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="est-card">
          <h3 className="est-card__titulo">Distribución por estado</h3>
          {distribucionEstados.length === 0 ? <Vacio mensaje="Sin datos para el periodo" /> : (
            <div className="est-pie-wrapper">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={distribucionEstados} dataKey="cantidad" nameKey="estado"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {distribucionEstados.map((entry, i) => (
                      <Cell key={entry.estado}
                        fill={COLORES_ESTADO[entry.estado] ?? COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipEstado highContrast={highContrast} />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="est-pie-leyenda">
                {distribucionEstados.map((entry, i) => (
                  <li key={entry.estado} className="est-pie-leyenda__item">
                    <span className="est-pie-leyenda__dot" style={{
                      background: COLORES_ESTADO[entry.estado] ?? COLORES_GRAFICO[i % COLORES_GRAFICO.length],
                    }} />
                    <span className="est-pie-leyenda__label">{entry.estado}</span>
                    <span className="est-pie-leyenda__valor">{entry.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos fila 2 */}
      <div className="est-grid est-grid--full">
        <div className="est-card">
          <h3 className="est-card__titulo">Top clientes por monto facturado</h3>
          {topClientes.length === 0 ? <Vacio mensaje="Sin datos para el periodo" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topClientes} layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                  tick={{ fontSize: 12, fontWeight: 700, fill: tickColor }} />
                <YAxis type="category" dataKey="cliente_nombre" width={140}
                  tick={{ fontSize: 12, fontWeight: 700, fill: tickColor }}
                  tickFormatter={(v) => v.length > 18 ? `${v.slice(0, 18)}…` : v} />
                <Tooltip content={<TooltipMoneda highContrast={highContrast} />} />
                <Bar dataKey="total" name="Total facturado" radius={[0, 4, 4, 0]}>
                  {topClientes.map((_, i) => (
                    <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function KpiCard({ icono, label, valor, variacion, color, highContrast }) {
  const tendencia =
    variacion  >  0 ? 'up'    :
    variacion  <  0 ? 'down'  :
    variacion === 0 ? 'equal' : null;

  return (
    <div className={`est-kpi est-kpi--${color}`}>
      <div className="est-kpi__icono">{icono}</div>
      <div className="est-kpi__info">
        <span className="est-kpi__label"
          style={highContrast ? { color: '#ffff00' } : {}}>
          {label}
        </span>
        <span className="est-kpi__valor">{valor}</span>
        {tendencia && (
          <span className={`est-kpi__variacion est-kpi__variacion--${tendencia}`}>
            {tendencia === 'up'    && <TrendingUp   size={14} aria-hidden="true" />}
            {tendencia === 'down'  && <TrendingDown size={14} aria-hidden="true" />}
            {tendencia === 'equal' && <Minus        size={14} aria-hidden="true" />}
            {Math.abs(variacion)}% vs mes anterior
          </span>
        )}
      </div>
    </div>
  );
}

function Vacio({ mensaje }) {
  return (
    <div className="est-vacio">
      <BarChart3 size={40} aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}

function LoadingEstadisticas() {
  return (
    <div className="est-loading" role="status" aria-live="polite">
      <div className="est-loading__spinner" aria-hidden="true" />
      <p>Cargando estadísticas...</p>
    </div>
  );
}

function TooltipMoneda({ active, payload, label, highContrast }) {
  if (!active || !payload?.length) return null;
  const estiloLabel = highContrast ? { color: '#ffff00' } : {};
  return (
    <div className={`est-tooltip${highContrast ? ' est-tooltip--hc' : ''}`}>
      {label && (
        <p className="est-tooltip__label" style={estiloLabel}>
          {formatearMes(label) || label}
        </p>
      )}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="est-tooltip__item"
          style={{ color: highContrast ? '#ffff00' : entry.color }}>
          {entry.name}: {entry.dataKey === 'total' ? formatearMoneda(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function TooltipEstado({ active, payload, highContrast }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const estiloTexto = highContrast ? { color: '#ffff00' } : {};
  return (
    <div className={`est-tooltip${highContrast ? ' est-tooltip--hc' : ''}`}>
      <p className="est-tooltip__label" style={estiloTexto}>{name}</p>
      <p className="est-tooltip__item"  style={estiloTexto}>{value} facturas</p>
    </div>
  );
}