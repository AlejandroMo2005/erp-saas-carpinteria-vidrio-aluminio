import { ShoppingCart, AlertTriangle } from 'lucide-react';
import GrupoProveedor       from './GrupoProveedor';
import { agruparPorProveedor } from './utils';
import './AlertasStock.css';

export default function AlertasStock({ alertas, onGenerarPedido }) {
  const grupos = agruparPorProveedor(alertas);

  if (!alertas || alertas.length === 0) {
    return (
      <div className="alerta-vacio">
        <ShoppingCart size={40} aria-hidden="true" />
        <h3 className="alerta-vacio__titulo">Sin alertas de stock bajo</h3>
        <p className="alerta-vacio__desc">
          Todos los materiales están sobre su mínimo configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="alertas-container">
      <p className="alertas-resumen">
        <AlertTriangle size={16} className="alertas-resumen__icon" aria-hidden="true" />
        <span>
          {alertas.length} variante{alertas.length !== 1 ? 's' : ''} por debajo del mínimo
        </span>
      </p>
      {grupos.map(grupo => (
        <GrupoProveedor
          key={grupo.proveedor_id ?? 'sin-proveedor'}
          grupo={grupo}
          onGenerarPedido={onGenerarPedido}
        />
      ))}
    </div>
  );
}