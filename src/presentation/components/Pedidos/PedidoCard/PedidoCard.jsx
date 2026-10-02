import { memo } from 'react';
// src/presentation/components/Pedidos/PedidoCard/PedidoCard.jsx
// Sprint 18 — Refactorización modular

import './PedidoCard.css';
import BadgeEstado from '../BadgeEstado/BadgeEstado';
import { sanitizeForDisplay } from '../utils/pedidosUtils';

function Icon3D() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12V22" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

const PedidoCard = memo(function PedidoCard({
  pedido, onVerDetalle, onCambiarEstado, cambiando, soloLectura,
}) {
  const p = pedido;

  return (
    <article className="pedido-card" aria-label={`Pedido ${p.id} — ${p.cliente}`}>
      <div className="card-top-info">
        <span>
          <span className="id-label">ID:</span>{' '}
          <span className="id-numero">#{p.id}</span>
        </span>
        <time dateTime={p.fecha}>{new Date(p.fecha).toLocaleDateString('es-EC')}</time>
      </div>

      {!soloLectura && (
        <div className="cliente-nombre-estilo" aria-label={`Cliente: ${p.cliente}`}>
          {sanitizeForDisplay(p.cliente) || 'CLIENTE'}
        </div>
      )}

      <div className="detalles-box">
        <div className="total-linea" aria-label={`Total: $${Number(p.total).toFixed(2)}`}>
          TOTAL: ${Number(p.total).toFixed(2)}
        </div>
        <div className="detalles-label">Servicios Solicitados:</div>
        <div className="servicio-detalle-texto">{sanitizeForDisplay(p.trabajos_nombres)}</div>
      </div>

      <div className="pedido-footer-actions">
        <BadgeEstado
          pedidoId={p.id}
          estadoActual={p.estado}
          onCambiar={onCambiarEstado}
          cambiando={!!cambiando}
          soloLectura={soloLectura}
        />
        <button
          className="btn-visualizar"
          onClick={() => onVerDetalle(p)}
          aria-label={`Ver visualización 3D del pedido ${p.id}`}
          title="Ver en 3D"
        >
          <Icon3D />
        </button>
      </div>
    </article>
  );
});

export default PedidoCard;
