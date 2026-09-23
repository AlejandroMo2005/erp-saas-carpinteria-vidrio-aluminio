import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useTicket                                  from './useTicket';
import { PERIODOS, PERIODO_LBL, TICKET_COLOR, PEDIDOS_COLOR } from './constants';
import './Ticket.layout.css';
import './Ticket.tooltip.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tkt-tooltip">
      <span className="tkt-tooltip__label">{label}</span>
      {payload.map((p, i) => (
        <span key={i} className="tkt-tooltip__value" style={{ color: p.color }}>
          {p.name}: {p.value}
        </span>
      ))}
    </div>
  );
};

export default function Ticket({ darkMode, highContrast }) {
  const { periodo, setPeriodo, data, loading } = useTicket();

  const tickColor = highContrast ? '#ffff00' : (darkMode ? '#cbd5e1' : '#475569');

  return (
    <div className="tkt-container">
      <header className="tkt-header">
        <div className="tkt-header-center">
          <h2 className="tkt-title">Ticket promedio</h2>
          <p className="tkt-hint">
            Evolución del ticket promedio por {PERIODO_LBL[periodo].toLowerCase()}
          </p>
        </div>
        <div className="tkt-toggle">
          {PERIODOS.map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`tkt-toggle__btn${periodo === p ? ' tkt-toggle__btn--active' : ''}`}>
              {PERIODO_LBL[p]}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="tkt-loading">Cargando…</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
            <XAxis dataKey="periodo"
              tick={{ fill: tickColor, fontSize: 13, fontWeight: 600 }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: tickColor, fontSize: 13, fontWeight: 600 }}
              axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="ticket_promedio" name="Ticket promedio"
              stroke={TICKET_COLOR} strokeWidth={3}
              dot={{ fill: TICKET_COLOR, r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="total_pedidos" name="Pedidos"
              stroke={PEDIDOS_COLOR} strokeWidth={2}
              dot={{ fill: PEDIDOS_COLOR, r: 3 }} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}