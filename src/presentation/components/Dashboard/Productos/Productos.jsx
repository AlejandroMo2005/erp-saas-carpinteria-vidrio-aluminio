import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useProductos, { generarDatosGrafico } from './useProductos';
import { iconoMaterial }                      from './constants';
import { obtenerEstiloLinea }                 from './IdentificadorUtils';
import './Productos.layout.css';
import './Productos.card.css';
import './Productos.chart.css';
import './Productos.tooltip.css';

const CustomTooltip = ({ active, payload, label, highContrast }) => {
  if (!active || !payload?.length) return null;
  const estiloTexto = highContrast ? { color: '#ffff00' } : {};
  return (
    <div className={`prod-tooltip${highContrast ? ' prod-tooltip--hc' : ''}`}>
      <span className="prod-tooltip__label" style={estiloTexto}>{label}</span>
      {payload.map((p, i) => (
        <div key={i} className="prod-tooltip__item">
          <span className="prod-tooltip__dot" style={{ background: p.color }} />
          <span className="prod-tooltip__text" style={estiloTexto}>
            <strong>{p.name}:</strong> {Number(p.value).toFixed(0)} uds
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Productos({ darkMode, highContrast }) {
  const { data, seleccionado, loading, toggleSeleccionado, materialSeleccionado } = useProductos();

  const tickColor   = highContrast ? '#ffff00' : (darkMode ? '#f8fafc' : '#0f172a');
  const legendColor = highContrast ? '#ffff00' : (darkMode ? '#f8fafc' : '#0f172a');

  const datosGrafico = materialSeleccionado
    ? generarDatosGrafico(materialSeleccionado)
    : [];

  if (loading) return <div className="prod-loading">Cargando productos…</div>;

  return (
    <div className="prod-container">
      <div className="prod-header-center">
        <h2 className="prod-title">Inventario de materiales</h2>
        <p className="prod-hint">Selecciona un material para ver la evolución de sus variantes</p>
      </div>

      {data.length === 0 ? (
        <p className="prod-empty">No hay materiales registrados</p>
      ) : (
        <>
          <div className="prod-grid">
            {data.map(mat => {
              const Icon     = iconoMaterial(mat.material);
              const isActive = seleccionado === mat.material_id;
              return (
                <button key={mat.material_id}
                  onClick={() => toggleSeleccionado(mat.material_id)}
                  className={`prod-card${isActive ? ' prod-card--active' : ''}`}
                  aria-pressed={isActive}>
                  <div className="prod-card__icon"><Icon size={24} /></div>
                  <span className="prod-card__nombre">{mat.material}</span>
                </button>
              );
            })}
          </div>

          {materialSeleccionado && (
            <div className="prod-grafico">
              <div className="prod-grafico__header">
                <div className="prod-grafico__info-center">
                  <h3 className="prod-grafico__title">{materialSeleccionado.material}</h3>
                  <p className="prod-grafico__hint">
                    Evolución de stock por color ({materialSeleccionado.variantes.length} variantes)
                  </p>
                </div>
                <button onClick={() => toggleSeleccionado(materialSeleccionado.material_id)}
                  className="prod-grafico__close" aria-label="Cerrar gráfica">
                  <X size={16} />
                </button>
              </div>

              {materialSeleccionado.variantes.length === 0 ? (
                <p className="prod-grafico__empty">Este material no tiene variantes de color</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={datosGrafico}
                    margin={{ top: 8, right: 20, left: -20, bottom: 4 }}>
                    <XAxis dataKey="periodo" interval={0} padding={{ left: 16, right: 16 }}
                      tick={{ fill: tickColor, fontSize: 13, fontWeight: 700 }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: tickColor, fontSize: 13, fontWeight: 700 }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip highContrast={highContrast} />} />
                    <Legend
                      wrapperStyle={{ fontSize: '0.875rem', fontWeight: 700, color: legendColor }}
                      iconType="line"
                      formatter={value => (
                        <span style={{ color: legendColor, fontWeight: 700 }}>{value}</span>
                      )} />
                    {materialSeleccionado.variantes.map(v => (
                      <Line key={v.color_id} type="monotone"
                        dataKey={v.color_nombre} name={v.color_nombre}
                        {...obtenerEstiloLinea(v.color_hex || '#888', darkMode, highContrast)} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}