// hooks/useProformas.js

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useTrabajos, useColoresTrabajo } from '../../../hooks/useCatalogos';
import { pedidosKeys } from '../../../hooks/usePedidos';
import api from '../../../api/api';
import {
  ITEM_VACIO, MEDIDA_MAX, CANT_MAX,
} from '../constants/proformaConstants';
import {
  sanitizar, normalizarTelefono, mensajeError,
  extraerColor, generarMensajeWA,
} from '../utils/proformaUtils';

export function useProformas({ onAgendar, toastOk, toastError, toastWarning, toastInfo }) {
  const { user }    = useAuth();
  const esCliente   = user?.rol === 'CLIENTE';
  const esSistema   = !esCliente;
  const queryClient = useQueryClient();

  const {
    data: trabajos = [],
    isLoading: loadingTrabajos,
    isError: errorTrabajos,
  } = useTrabajos();

  const {
    data: coloresDB = [],
    isLoading: loadingColores,
    isError: errorColores,
  } = useColoresTrabajo();

  const [cliente,           setCliente]           = useState(esCliente ? (user?.nombre   || '') : '');
  const [telefono,          setTelefono]          = useState(esCliente ? (user?.telefono || '') : '');
  const [fechaAgendamiento, setFechaAgendamiento] = useState('');
  const [clienteVinculado,  setClienteVinculado]  = useState(null);
  const [items,             setItems]             = useState([ITEM_VACIO()]);
  const [calculando,        setCalculando]        = useState(false);
  const [agendando,         setAgendando]         = useState(false);
  const [whatsText,         setWhatsText]         = useState('');
  const [resumen,           setResumen]           = useState({
    subtotal: 0, iva: 0, total: 0, iva_valor: 0.15,
  });

  const fecha = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Mostrar error si fallan los catálogos
  const toastErrorRef = useRef(toastError);
  useEffect(() => { toastErrorRef.current = toastError; }, [toastError]);
  useEffect(() => {
    if (errorTrabajos || errorColores)
      toastErrorRef.current('No se pudieron cargar los catálogos de trabajos y colores.');
  }, [errorTrabajos, errorColores]);

  const mapaColores = useMemo(() => {
    const mapa = {};
    coloresDB.forEach((c) => {
      mapa[String(c.id)] = { hex: extraerColor(c), nombre: c.nombre };
    });
    return mapa;
  }, [coloresDB]);

  const payload = useMemo(() => ({
    cliente:            sanitizar(cliente),
    telefono:           sanitizar(telefono),
    fecha,
    fecha_agendamiento: fechaAgendamiento || null,
    usuario_id:         esSistema ? (clienteVinculado?.id ?? null) : undefined,
    items: items.map((it) => ({
      trabajo_id: it.trabajo_id ? Number(it.trabajo_id) : null,
      ancho:      Math.min(Math.max(Number(it.ancho)    || 0, 0), MEDIDA_MAX),
      alto:       Math.min(Math.max(Number(it.alto)     || 0, 0), MEDIDA_MAX),
      cantidad:   Math.min(Math.max(Number(it.cantidad) || 1, 1), CANT_MAX),
      color_id:   it.color_id ? Number(it.color_id) : null,
      detalle:    sanitizar(it.detalle),
    })),
  }), [cliente, telefono, fecha, fechaAgendamiento, clienteVinculado, items, esSistema]);

  const validarFormulario = useCallback(() => {
    if (!cliente.trim()) { toastWarning('El nombre del cliente es requerido.'); return false; }
    if (!telefono.trim()) { toastWarning('El número de teléfono es requerido.'); return false; }
    const sinTipo = items.filter((it) => !it.trabajo_id);
    if (sinTipo.length > 0) {
      toastWarning(`${sinTipo.length > 1 ? `${sinTipo.length} trabajos no tienen` : 'Un trabajo no tiene'} tipo seleccionado.`);
      return false;
    }
    const medidasMalas = items.filter((it) =>
      Number(it.ancho) <= 0 || Number(it.alto) <= 0 || Number(it.cantidad) <= 0
    );
    if (medidasMalas.length > 0) {
      toastWarning('Revisa las medidas: ancho, alto y cantidad deben ser mayores a 0.');
      return false;
    }
    return true;
  }, [cliente, telefono, items, toastWarning]);

  const handleSeleccionarCliente = useCallback((usuarioSel) => {
    const nombreFinal = usuarioSel.nombre_completo || usuarioSel.nombre || '';
    setCliente(nombreFinal);
    if (!telefono || (clienteVinculado && telefono === (clienteVinculado.telefono || '')))
      setTelefono(usuarioSel.telefono || '');
    setClienteVinculado({ ...usuarioSel, nombre: nombreFinal });
    toastInfo(`Cliente "${nombreFinal}" cargado desde el registro.`);
  }, [telefono, clienteVinculado, toastInfo]);

  const handleDesvincular   = useCallback(() => setClienteVinculado(null), []);

  const handleClienteChange = useCallback((nuevoValor) => {
    setCliente(nuevoValor);
    if (clienteVinculado && nuevoValor !== (clienteVinculado.nombre || ''))
      setClienteVinculado(null);
  }, [clienteVinculado]);

  const handleAddItem    = useCallback(() => setItems((prev) => [...prev, ITEM_VACIO()]), []);
  const handleRemoveItem = useCallback((id) =>
    setItems((prev) => prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)), []);

  const handleUpdate = useCallback((id, campo, valor) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const act = { ...it, [campo]: valor };
      if (campo === 'trabajo_id') {
        const t = trabajos.find((x) => String(x.id) === String(valor));
        act.nombre_trabajo = t?.nombre ?? '';
        act.subtotal = 0;
      }
      if (campo === 'color_id') {
        const entrada = mapaColores[String(valor)];
        act.nombre_color = entrada?.nombre ?? '';
        act.color_hex    = entrada?.hex    ?? '';
        act.subtotal = 0;
      }
      if (['ancho', 'alto', 'cantidad'].includes(campo)) act.subtotal = 0;
      return act;
    }));
  }, [trabajos, mapaColores]);

  const calcularProforma = useCallback(async () => {
    if (calculando) return false;
    if (!validarFormulario()) return false;
    setCalculando(true);
    try {
      const res  = await api.post('/proformas/calcular', payload);
      const data = res?.data?.data;
      if (!data) throw new Error('Respuesta inválida del servidor');
      setItems((prev) =>
        prev.map((it, i) => ({ ...it, subtotal: Number(data.items?.[i]?.subtotal ?? 0) }))
      );
      const nuevoResumen = {
        subtotal:  Number(data.subtotal  ?? 0),
        iva:       Number(data.iva       ?? 0),
        total:     Number(data.total     ?? 0),
        iva_valor: Number(data.iva_valor ?? 0.15),
      };
      setResumen(nuevoResumen);
      setWhatsText(data.whatsapp_text?.trim() ?? '');
      toastInfo(`Proforma calculada: $${nuevoResumen.total.toFixed(2)}`);
      return { ok: true, resumen: nuevoResumen };
    } catch (e) {
      toastError(mensajeError(e));
      return false;
    } finally {
      setCalculando(false);
    }
  }, [calculando, validarFormulario, payload, toastInfo, toastError]);

  const enviarWhatsApp = useCallback(() => {
    if (!telefono.trim()) { toastWarning('Ingresa el número de teléfono antes de enviar.'); return; }
    if (resumen.total <= 0) { toastWarning('Primero calcula la proforma antes de enviar por WhatsApp.'); return; }
    const digits = normalizarTelefono(telefono);
    if (digits.length < 11) { toastWarning('Número de teléfono inválido. Usa formato: 0999999999'); return; }
    const texto = whatsText.trim() || generarMensajeWA(cliente, items, resumen);
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  }, [telefono, whatsText, resumen, cliente, items, toastWarning]);

  const agendar = useCallback(async () => {
    if (agendando) return;
    if (!validarFormulario()) return;
    setAgendando(true);
    let totalFinal = resumen.total;
    if (!totalFinal) {
      const resultado = await calcularProforma();
      if (!resultado) { setAgendando(false); return; }
      totalFinal = resultado.resumen.total;
    }
    try {
      const res = await api.post('/proformas/agendar', { ...payload, total: totalFinal });
      if (!res.data?.success) throw new Error(res.data?.message || 'No se pudo agendar el pedido');
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
      onAgendar?.();
      toastOk(esCliente
        ? '¡Tu solicitud fue enviada! Nos pondremos en contacto para confirmar.'
        : `Pedido agendado correctamente para ${sanitizar(cliente)}.`
      );
    } catch (e) {
      toastError(mensajeError(e));
    } finally {
      setAgendando(false);
    }
  }, [agendando, validarFormulario, resumen, calcularProforma, payload, cliente,
      onAgendar, toastOk, toastError, esCliente, queryClient]);

  return {
    // auth
    esCliente, esSistema, user,
    // catálogos
    trabajos, loadingTrabajos,
    coloresDB, loadingColores,
    mapaColores,
    // estado formulario
    cliente, setCliente: handleClienteChange,
    telefono, setTelefono,
    fecha,
    fechaAgendamiento, setFechaAgendamiento,
    clienteVinculado,
    // items
    items,
    handleAddItem, handleRemoveItem, handleUpdate,
    // cliente autocomplete
    handleSeleccionarCliente, handleDesvincular,
    // acciones
    calculando, agendando, resumen,
    calcularProforma, enviarWhatsApp, agendar,
  };
}