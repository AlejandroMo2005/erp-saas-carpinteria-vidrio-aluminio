import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useIngresos              from './useIngresos';
import { PERIODOS, PERIODO_LBL, LINE_COLOR } from './constants';
import './Ingresos.css';

const CustomTooltip = ({ active, payload, label, highContrast }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const valFormateado = val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val}`;
  const colorValor = highContrast ? '#ffff00' : payload[0].color;
  return (
    <div className={`ing-tooltip${highContrast ? ' ing-tooltip--hc' : ''}`}>
      <span className="ing-tooltip__label"
        style={highContrast ? { color: '#ffff00' } : {}}>
        {label}
      </span>
      <span className="ing-tooltip__value" style={{ color: colorValor }}>
        {valFormateado}
      </span>
    </div>
  );
};

export default function Ingresos({ darkMode, highContrast }) {
  const { periodo, setPeriodo, data, loading } = useIngresos();

  const tickColor = highContrast ? '#ffff00' : (darkMode ? '#f8fafc' : '#0f172a');

  return (
    <div className="ing-container">
      <header className="ing-header">
        <div className="ing-header-center">
          <h2 className="ing-title">
            Ingresos por {PERIODO_LBL[periodo].toLowerCase()}
          </h2>
        </div>
        <div className="ing-toggle">
          {PERIODOS.map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`ing-toggle__btn${periodo === p ? ' ing-toggle__btn--active' : ''}`}>
              {PERIODO_LBL[p]}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="ing-loading">Cargando…</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
            <XAxis dataKey="periodo" interval={0} padding={{ left: 12, right: 12 }}
              tick={{ fill: tickColor, fontSize: 13, fontWeight: 600 }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 13, fontWeight: 600 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip highContrast={highContrast} />} />
            <Line type="monotone" dataKey="ingresos"
              stroke={LINE_COLOR} strokeWidth={3}
              dot={{ fill: LINE_COLOR, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}