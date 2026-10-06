import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/api';
import { buildDescripcion, distribuirTotal } from './utils';
import { ITEM_VACIO } from './constants';

// Re-export para que useFormularioFactura no importe de dos sitios
export { ITEM_VACIO };

export default function usePedidosCliente({ clienteId }) {
  const [pedidosCliente,      setPedidosCliente]     = useState([]);
  const [cargandoPedidos,     setCargandoPedidos]     = useState(false);
  const [pedidoVinculado,     setPedidoVinculado]     = useState(null);
  const [errorPedidosCliente, setErrorPedidosCliente] = useState(null);
  const [cargandoItemsPedido, setCargandoItemsPedido] = useState(false);
  const [errorPedido,         setErrorPedido]         = useState(null);

  useEffect(() => {
    if (!clienteId) {
      setPedidosCliente([]);
      setPedidoVinculado(null);
      setErrorPedidosCliente(null);
      return;
    }
    let cancelado = false;
    setCargandoPedidos(true);
    setErrorPedidosCliente(null);
    api.get(`/facturacion/pedidos-cliente/${clienteId}`)
      .then(resp => { if (!cancelado) setPedidosCliente(resp.data?.data ?? []); })
      .catch(() => { if (!cancelado) setErrorPedidosCliente('No se pudieron cargar los pedidos de este cliente.'); })
      .finally(() => { if (!cancelado) setCargandoPedidos(false); });
    return () => { cancelado = true; };
  }, [clienteId]);

  const seleccionarPedido = useCallback(async (pedido, setItems) => {
    if (pedidoVinculado?.id === pedido.id) {
      setPedidoVinculado(null);
      setItems([ITEM_VACIO()]);
      setErrorPedido(null);
      return;
    }
    setPedidoVinculado(pedido);
    setErrorPedido(null);
    setCargandoItemsPedido(true);
    try {
      const resp          = await api.get(`/pedidos/${pedido.id}`);
      const pedidoDetalle = resp.data?.data ?? resp.data?.pedido ?? resp.data ?? {};
      const totalPedido   = Number.parseFloat(pedido.total) || 0;
      const raw = pedidoDetalle.items ?? pedidoDetalle.detalle ?? [];
      if (raw.length > 0) {
        const precios = distribuirTotal(raw, totalPedido);
        setItems(raw.map((item, i) => ({
          _id:             Date.now() + Math.random(),
          descripcion:     buildDescripcion(item),
          cantidad:        Number.parseFloat(item.cantidad) || 1,
          precio_unitario: precios[i],
          descuento:       0,
          aplica_iva:      true,
        })));
      } else {
        setItems([{
          ...ITEM_VACIO(),
          descripcion:     pedido.trabajos_nombres || 'Servicio',
          cantidad:        1,
          precio_unitario: totalPedido,
        }]);
      }
    } catch (err) {
      setErrorPedido(err.response?.data?.message || 'No se pudieron cargar los ítems. Completa los campos manualmente.');
    } finally {
      setCargandoItemsPedido(false);
    }
  }, [pedidoVinculado?.id]);

  const desvincularPedido = useCallback((setItems) => {
    setPedidoVinculado(null);
    setItems([ITEM_VACIO()]);
    setErrorPedido(null);
  }, []);

  return {
    pedidosCliente,
    cargandoPedidos,
    pedidoVinculado,
    errorPedidosCliente,
    cargandoItemsPedido,
    errorPedido,
    setErrorPedido,
    seleccionarPedido,
    desvincularPedido,
  };
}
