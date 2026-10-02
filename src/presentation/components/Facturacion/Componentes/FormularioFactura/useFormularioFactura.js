import { useState, useEffect } from 'react';
import api from '../../../../api/api';
import { IVA_DEFAULT, ITEM_VACIO } from './constants';
import { buildDescripcion, distribuirTotal, calcularTotales } from './utils';

export default function useFormularioFactura({ pedidoId, onFacturaCreada }) {
  const [paso,                setPaso]                = useState(1);
  const [clienteSeleccionado, setCliente]             = useState(null);
  const [items,               setItems]               = useState([ITEM_VACIO()]);
  const [observaciones,       setObservaciones]       = useState('');
  const [tasaIva,             setTasaIva]             = useState(IVA_DEFAULT);
  const [guardando,           setGuardando]           = useState(false);
  const [errores,             setErrores]             = useState({});
  const [errorGeneral,        setErrorGeneral]        = useState(null);
  const [exito,               setExito]               = useState(false);
  const [facturaCreada,       setFacturaCreada]       = useState(null);

  // Cargar IVA y datos del pedido inicial
  useEffect(() => {
    const cargarIVA = async () => {
      const resp = await api.get('/configuracion/IVA').catch(() => null);
      if (resp?.data?.success) {
        const val = parseFloat(resp.data.data?.valor ?? IVA_DEFAULT);
        setTasaIva(isNaN(val) ? IVA_DEFAULT : val);
      }
    };

    const cargarDesdePedido = async () => {
      if (!pedidoId) return;
      try {
        const resp   = await api.get(`/pedidos/${pedidoId}`);
        const pedido = resp.data?.data ?? resp.data?.pedido ?? resp.data;
        if (!pedido) return;
        const raw = pedido.items ?? pedido.detalle ?? [];
        if (raw.length === 0) return;
        const precios = distribuirTotal(raw, parseFloat(pedido.total) || 0);
        setItems(raw.map((d, i) => ({
          _id:             Date.now() + Math.random(),
          descripcion:     buildDescripcion(d),
          cantidad:        parseFloat(d.cantidad) || 1,
          precio_unitario: precios[i],
          descuento:       0,
          aplica_iva:      true,
        })));
      } catch { /* error silencioso — el usuario puede completar manualmente */ }
    };

    cargarIVA();
    cargarDesdePedido();
  }, [pedidoId]);

  // Items
  const agregarItem  = () => setItems(prev => [...prev, ITEM_VACIO()]);
  const eliminarItem = (id) => { if (items.length > 1) setItems(prev => prev.filter(i => i._id !== id)); };
  const cambiarCampoItem = (id, campo, valor) => {
    setItems(prev => prev.map(i => i._id === id ? { ...i, [campo]: valor } : i));
    if (errores[`item_${id}_${campo}`])
      setErrores(prev => { const n = { ...prev }; delete n[`item_${id}_${campo}`]; return n; });
  };

  // Totales derivados
  const totales = calcularTotales(items, tasaIva);

  // Validaciones
  const validarPaso1 = () => {
    const errs = {};
    if (!clienteSeleccionado) errs.cliente = 'Debes seleccionar o crear un cliente';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const validarPaso2 = () => {
    const errs = {};
    items.forEach(item => {
      if (!item.descripcion.trim())
        errs[`item_${item._id}_descripcion`]     = 'Descripción requerida';
      if (!item.cantidad || parseFloat(item.cantidad) <= 0)
        errs[`item_${item._id}_cantidad`]         = 'Cantidad inválida';
      if (parseFloat(item.precio_unitario) < 0)
        errs[`item_${item._id}_precio_unitario`]  = 'Precio inválido';
    });
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const avanzarPaso = () => {
    if (paso === 1 && !validarPaso1()) return;
    if (paso === 2 && !validarPaso2()) return;
    setPaso(p => Math.min(p + 1, 3));
  };
  const retrocederPaso = () => setPaso(p => Math.max(p - 1, 1));

  // Guardar
  const guardar = async (pedidoVinculado) => {
    try {
      setGuardando(true);
      setErrorGeneral(null);
      const payload = {
        cliente_id:                  clienteSeleccionado.id ?? null,
        cliente_nombre:              clienteSeleccionado.nombre,
        cliente_identificacion:      clienteSeleccionado.identificacion      ?? null,
        cliente_tipo_identificacion: clienteSeleccionado.tipo_identificacion ?? 'CONSUMIDOR_FINAL',
        cliente_direccion:           clienteSeleccionado.direccion           ?? null,
        cliente_telefono:            clienteSeleccionado.telefono            ?? null,
        cliente_email:               clienteSeleccionado.email               ?? null,
        pedido_id:                   pedidoVinculado?.id ?? pedidoId ?? null,
        observaciones:               observaciones.trim() || null,
        items: items.map(item => ({
          descripcion:     item.descripcion.trim(),
          cantidad:        parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          descuento:       parseFloat(item.descuento) || 0,
          porcentaje_iva:  item.aplica_iva ? tasaIva * 100 : 0,
        })),
      };
      const resp = await api.post('/facturacion', payload);
      if (resp.data.success) {
        const creada = resp.data.data ?? resp.data.factura;
        setFacturaCreada(creada);
        setExito(true);
        onFacturaCreada?.(creada);
      }
    } catch (err) {
      setErrorGeneral(err.response?.data?.message || 'Error al crear la factura');
    } finally {
      setGuardando(false);
    }
  };

  return {
    paso, clienteSeleccionado, setCliente,
    items, setItems,
    observaciones, setObservaciones,
    tasaIva,
    guardando, errores, setErrores,
    errorGeneral,
    exito, facturaCreada,
    totales,
    agregarItem, eliminarItem, cambiarCampoItem,
    avanzarPaso, retrocederPaso,
    guardar,
  };
}