import useEstado    from './useEstado';
import { fmt }      from './constants';
import './Estado.css';

export default function Estado() {
  const { data, loading, total } = useEstado();

  if (loading) return <div className="est-loading">Cargando estados…</div>;

  return (
    <div className="est-container">
      <h2 className="est-title">Estado de pedidos</h2>
      <p className="est-hint">Distribución por estado actual</p>

      {data.length === 0 ? (
        <p className="est-empty">No hay pedidos registrados</p>
      ) : (
        <div className="est-lista">
          {data.map(e => {
            const pct = total > 0
              ? Math.round((Number(e.cantidad) / total) * 100)
              : 0;
            return (
              <div key={e.estado} className="est-fila" data-estado={e.estado}>
                <div className="est-fila__info">
                  <span className="est-dot" />
                  <span className="est-nombre">{e.estado}</span>
                  <span className="est-badge">{e.cantidad} pedidos</span>
                  <span className="est-monto">{fmt(e.monto_total)}</span>
                </div>
                <div className="est-progreso">
                  <div className="est-progreso__fill" style={{ width: `${pct}%` }} />
                  <span className="est-progreso__pct">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}