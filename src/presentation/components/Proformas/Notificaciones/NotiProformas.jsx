/**
 * @fileoverview Sistema de notificaciones toast para el módulo Proformas.
 * @module components/Proformas/Notificaciones/NotiProformas
 */

import { memo } from 'react';
import { ToastContainer } from '../../NotificacionesCompartidas/ToastContainer';

export const ProformaToastContainer = memo(function ProformaToastContainer({
  toasts,
  onRemove,
}) {
  return (
    <ToastContainer
      toasts={toasts}
      onRemove={onRemove}
      ariaLabel="Notificaciones de proformas"
    />
  );
});
