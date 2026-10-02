import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../../api/api';
import { NUEVO_CLIENTE_INICIAL } from './constants';
import { validarCedula, validarRUC } from './utils';

export default function useSelectorCliente({ onSeleccionar, onLimpiar }) {
  const [modo,          setModo]          = useState('buscar');
  const [query,         setQuery]         = useState('');
  const [resultados,    setResultados]    = useState([]);
  const [buscando,      setBuscando]      = useState(false);
  const [mostrarLista,  setMostrarLista]  = useState(false);
  const [focusedIndex,  setFocusedIndex]  = useState(-1);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  const [nuevoCliente, setNuevoCliente] = useState(NUEVO_CLIENTE_INICIAL);
  const [erroresForm,  setErroresForm]  = useState({});
  const [guardando,    setGuardando]    = useState(false);

  const inputRef    = useRef(null);
  const listRef     = useRef(null);
  const debounceRef = useRef(null);

  // Búsqueda con debounce
  const buscarClientes = useCallback(async (texto) => {
    if (!texto || texto.trim().length < 2) {
      setResultados([]);
      setMostrarLista(false);
      setErrorBusqueda(null);
      return;
    }
    try {
      setBuscando(true);
      setErrorBusqueda(null);
      const res = await api.get(`/clientes?busqueda=${encodeURIComponent(texto.trim())}&limite=8`);
      if (res.data.success) {
        setResultados(res.data.data ?? res.data.clientes ?? []);
        setMostrarLista(true);
        setFocusedIndex(-1);
      }
    } catch (err) {
      setErrorBusqueda(err.response?.data?.message || 'No se pudo conectar. Intenta de nuevo.');
      setResultados([]);
      setMostrarLista(false);
    } finally {
      setBuscando(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setErrorBusqueda(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarClientes(v), 350);
  };

  // Selección
  const handleSeleccionar = useCallback((cliente) => {
    setMostrarLista(false);
    setQuery('');
    setResultados([]);
    setFocusedIndex(-1);
    setErrorBusqueda(null);
    onSeleccionar?.(cliente);
  }, [onSeleccionar]);

  const handleLimpiar = useCallback(() => {
    setQuery('');
    setResultados([]);
    setMostrarLista(false);
    setModo('buscar');
    setErrorBusqueda(null);
    onLimpiar?.();
  }, [onLimpiar]);

  // Navegación teclado
  const handleKeyDown = (e) => {
    if (!mostrarLista || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSeleccionar(resultados[focusedIndex]);
    } else if (e.key === 'Escape') {
      setMostrarLista(false);
    }
  };

  // Cerrar lista al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (
        listRef.current  && !listRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) setMostrarLista(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Validación del formulario nuevo cliente
  const validarFormulario = () => {
    const err = {};
    if (!nuevoCliente.nombre.trim())
      err.nombre = 'El nombre es obligatorio';
    if (!nuevoCliente.telefono.trim())
      err.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{7,15}$/.test(nuevoCliente.telefono.trim()))
      err.telefono = 'Ingresa un teléfono válido (7-15 dígitos)';
    const tipo = nuevoCliente.tipo_identificacion;
    if (tipo !== 'CONSUMIDOR_FINAL' && !nuevoCliente.identificacion.trim())
      err.identificacion = 'La identificación es obligatoria';
    if (tipo === 'CEDULA' && nuevoCliente.identificacion.trim() &&
        !validarCedula(nuevoCliente.identificacion.trim()))
      err.identificacion = 'Cédula inválida';
    if (tipo === 'RUC' && nuevoCliente.identificacion.trim() &&
        !validarRUC(nuevoCliente.identificacion.trim()))
      err.identificacion = 'RUC inválido';
    if (nuevoCliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCliente.email))
      err.email = 'Correo electrónico inválido';
    setErroresForm(err);
    return Object.keys(err).length === 0;
  };

  // Guardar nuevo cliente
  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    try {
      setGuardando(true);
      const payload = {
        nombre:   nuevoCliente.nombre.trim(),
        telefono: nuevoCliente.telefono.trim(),
        ...(nuevoCliente.identificacion && {
          identificacion:      nuevoCliente.identificacion.trim(),
          tipo_identificacion: nuevoCliente.tipo_identificacion,
        }),
        ...(nuevoCliente.direccion && { direccion: nuevoCliente.direccion.trim() }),
        ...(nuevoCliente.email     && { email:     nuevoCliente.email.trim()     }),
      };
      const res = await api.post('/clientes', payload);
      if (res.data.success) {
        handleSeleccionar(res.data.data ?? res.data.cliente);
        setNuevoCliente(NUEVO_CLIENTE_INICIAL);
        setModo('buscar');
      }
    } catch (err) {
      setErroresForm({ general: err.response?.data?.message || 'Error al crear el cliente' });
    } finally {
      setGuardando(false);
    }
  };

  const handleCampoNuevo = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({ ...prev, [name]: value }));
    if (erroresForm[name])
      setErroresForm(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const cancelarCreacion = () => {
    setModo('buscar');
    setErroresForm({});
  };

  return {
    modo, setModo,
    query, resultados, buscando, mostrarLista, focusedIndex,
    errorBusqueda,
    nuevoCliente, erroresForm, guardando,
    inputRef, listRef,
    handleQueryChange, handleKeyDown,
    handleSeleccionar, handleLimpiar,
    handleGuardarCliente, handleCampoNuevo,
    cancelarCreacion,
  };
}