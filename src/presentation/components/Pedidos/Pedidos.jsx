import { useState, useCallback } from 'react';
// src/presentation/components/Pedidos/Pedidos.jsx
// Sprint 14 — Migración a React Query
// 🐛 Fix Sprint 18  — useActualizarEstadoPedido → PUT /pedidos/:id/estado
// 🎨 Sprint 16 v1   — Badge clickeable reemplaza botón "Cambiar estado"
// 🎨 Sprint 16 v2   — Filtros para todos los roles + períodos para ADMIN
// 🎨 Sprint 16 v3   — Eliminado estado PROCESADO (no usado en el negocio)
// ♻️  Sprint 18     — Refactorización modular: hook + subcomponentes + CSS por responsabilidad...

import './Pedidos.css';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/useAuth';
import { usePedidos, useActualizarEstadoPedido, pedidosKeys } from '../../hooks/usePedidos';
import { usePedidosFiltros } from './hooks/usePedidosFiltros';
import { mensajeError } from './utils/pedidosUtils';
import { TRANSICIONES } from './constants/pedidosConstants';
import FiltrosBar from './FiltrosBar/FiltrosBar';
import PedidoCard from './PedidoCard/PedidoCard';
import VisualizadorModal from './VisualizadorModal';
import { PedidoToastContainer } from './Notificaciones/NotiPedidos';
import { usePedidoToasts } from './Notificaciones/usePedidoToasts';

function IconReload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}

export default function Pedidos() {
  const { user }    = useAuth();
  const esCliente   = user?.rol === 'CLIENTE';
  const esAdmin     = user?.rol === 'ADMIN';
  const queryClient = useQueryClient();

  const { toasts, remove: removeToast, ok, error: toastError, warning } = usePedidoToasts();

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cambiando,          setCambiando]          = useState({});

  const {
    data:      listaPedidos = [],
    isLoading: cargando,
    refetch:   cargarPedidos,
  } = usePedidos();

  const actualizarEstado = useActualizarEstadoPedido();

  const {
    filtroEstado,  setFiltroEstado,
    filtroPeriodo, setFiltroPeriodo,
    pedidosFiltrados,
    contadores,
    mensajeVacio,
  } = usePedidosFiltros(listaPedidos, esAdmin, esCliente);

  const handleCambiarEstado = useCallback(async (id, nuevoEstado) => {
    if (cambiando[id] || esCliente) return;

    const pedido = listaPedidos.find((p) => p.id === id);
    if (!pedido) { toastError('Pedido no encontrado.'); return; }

    const permitidos = TRANSICIONES[pedido.estado] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      warning(`No se puede cambiar de ${pedido.estado} a ${nuevoEstado}.`);
      return;
    }

    const estadoAnterior = pedido.estado;
    setCambiando((prev) => ({ ...prev, [id]: true }));
    const queryKey = pedidosKeys.list({});

    queryClient.setQueryData(queryKey, (old = []) =>
      old.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );

    try {
      await actualizarEstado.mutateAsync({ id, estado: nuevoEstado });
      const mensajes = {
        ENTREGADO: `Pedido #${id} entregado correctamente.`,
        CANCELADO: `Pedido #${id} cancelado.`,
      };
      ok(mensajes[nuevoEstado] ?? `Pedido #${id} actualizado a ${nuevoEstado}.`);
    } catch (err) {
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map((p) => (p.id === id ? { ...p, estado: estadoAnterior } : p))
      );
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
      const status = err?.response?.status;
      if (status === 409) toastError(`El pedido #${id} fue modificado por otro usuario.`);
      else if (status === 403) toastError('Sin permisos para cambiar el estado.');
      else toastError(`No se pudo actualizar el pedido #${id}: ${mensajeError(err)}`);
    } finally {
      setCambiando((prev) => ({ ...prev, [id]: false }));
    }
  }, [cambiando, listaPedidos, ok, toastError, warning, esCliente, actualizarEstado, queryClient]);

  return (
    <div className="view-container">
      <PedidoToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="pedidos-header">
        <h1 className="header-title">
          {esCliente ? 'Mis Pedidos' : 'Gestión de Pedidos'}
        </h1>
        <button
          className="btn-reload-icon"
          onClick={() => void cargarPedidos()}
          disabled={cargando}
          aria-label="Recargar lista de pedidos"
          aria-busy={cargando}
          title={cargando ? 'Cargando…' : 'Actualizar lista'}
        >
          <span className={cargando ? 'spin' : ''}><IconReload /></span>
        </button>
      </div>

      <FiltrosBar
        esAdmin={esAdmin}
        esCliente={esCliente}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroPeriodo={filtroPeriodo}
        setFiltroPeriodo={setFiltroPeriodo}
        contadores={contadores}
      />

      {cargando && listaPedidos.length === 0 && (
        <div className="pedidos-estado" aria-live="polite">Cargando…</div>
      )}

      {!cargando && pedidosFiltrados.length === 0 && (
        <div className="pedidos-estado" role="status">{mensajeVacio}</div>
      )}

      {pedidosFiltrados.length > 0 && (
        <div className="pedidos-grid" role="list" aria-label="Lista de pedidos" aria-busy={cargando}>
          {pedidosFiltrados.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onVerDetalle={setPedidoSeleccionado}
              onCambiarEstado={handleCambiarEstado}
              cambiando={!!cambiando[p.id]}
              soloLectura={esCliente}
            />
          ))}
        </div>
      )}

      {pedidoSeleccionado && (
        <VisualizadorModal
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
        />
      )}
    </div>
  );
}
