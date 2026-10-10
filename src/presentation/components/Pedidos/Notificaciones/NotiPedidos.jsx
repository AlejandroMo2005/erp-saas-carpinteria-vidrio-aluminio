/**
 * @fileoverview Sistema de notificaciones toast para el módulo Pedidos.
 * @module components/Pedidos/Notificaciones/NotiPedidos
 */

import { memo } from 'react';
import { ToastContainer } from '../../NotificacionesCompartidas/ToastContainer';

export const PedidoToastContainer = memo(function PedidoToastContainer({
  toasts,
  onRemove,
}) {
  return (
    <ToastContainer
      toasts={toasts}
      onRemove={onRemove}
      ariaLabel="Notificaciones de pedidos"
    />
  );
});
