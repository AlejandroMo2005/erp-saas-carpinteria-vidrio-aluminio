import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useUsuarios           from './useUsuarios';
import { PALETTE, PALETTE_HC } from './constants';
import './Usuarios.layout.css';
import './Usuarios.tooltip.css';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="usu-tooltip">
      <span className="usu-tooltip__label">{payload[0].payload.nombre}</span>
      <span className="usu-tooltip__value" style={{ color: payload[0].color }}>
        {payload[0].value >= 1000
          ? `$${(payload[0].value / 1000).toFixed(1)}k`
          : `$${payload[0].value}`}
      </span>
      <span className="usu-tooltip__pedidos">
        {payload[0].payload.total_pedidos} pedidos
      </span>
    </div>
  );
};

export default function Usuarios({ darkMode, highContrast }) {
  const { data, loading } = useUsuarios();

  const tickColor = highContrast ? '#ffff00' : (darkMode ? '#cbd5e1' : '#475569');
  const palette   = highContrast ? PALETTE_HC : PALETTE;

  if (loading) return <div className="usu-loading">Cargando usuarios…</div>;

  return (
    <div className="usu-container">
      <h2 className="usu-title">Ingresos por usuario</h2>
      <p className="usu-hint">Top usuarios con más ventas</p>

      {data.length === 0 ? (
        <p className="usu-empty">No hay datos de usuarios</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 35)}>
          <BarChart data={data} layout="vertical"
            margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <XAxis type="number"
              tick={{ fill: tickColor, fontSize: 13, fontWeight: 600 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <YAxis type="category" dataKey="nombre"
              tick={{ fill: tickColor, fontSize: 13, fontWeight: 600 }}
              axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ingresos_totales" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}