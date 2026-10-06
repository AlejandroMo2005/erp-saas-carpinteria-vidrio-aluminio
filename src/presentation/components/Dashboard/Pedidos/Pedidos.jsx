import { useState, useEffect } from 'react';
import api from '../../../api/api';
import './Pedidos.css';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  const num = Number(n);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `$${(num / 1_000).toFixed(1)}k`;
  return `$${num.toFixed(0)}`;
};

export default function Pedidos({ _darkMode, _highContrast }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/dashboard/pedidos-recientes?limite=10');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, []);

  if (loading) return <div className="ped-loading">Cargando pedidos…</div>;

  return (
    <div className="ped-container">
      <h2 className="ped-title">Últimos pedidos</h2>

      {data.length === 0 ? (
        <p className="ped-empty">No hay pedidos registrados</p>
      ) : (
        <div className="ped-table-wrap">
          <table className="ped-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id}>
                  <td className="ped-table__id">{p.id}</td>
                  <td>{p.fecha}</td>
                  <td>{p.usuario || '—'}</td>
                  <td>
                    <span className="ped-badge" data-estado={p.estado}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="ped-table__total">{fmt(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
