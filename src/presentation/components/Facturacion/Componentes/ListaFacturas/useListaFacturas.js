import { useState, useCallback, useEffect } from 'react';
import api from '../../../../api/api';
import { FILTROS_INICIAL, PAGINACION_INICIAL } from './constants';

export default function useListaFacturas({ onToastError, onToastSuccess }) {
  const [facturas,  setFacturas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [filtros,   setFiltros]   = useState(FILTROS_INICIAL);
  const [paginacion, setPaginacion] = useState(PAGINACION_INICIAL);

  const [modalFormulario,  setModalFormulario]  = useState(false);
  const [facturaDetalleId, setFacturaDetalleId] = useState(null);

  const cargarFacturas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        pagina: paginacion.pagina,
        limite: paginacion.limite,
        ...(filtros.busqueda   && { clienteNombre: filtros.busqueda   }),
        ...(filtros.estado     && { estado:        filtros.estado     }),
        ...(filtros.fechaDesde && { fechaDesde:    filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta:    filtros.fechaHasta }),
      });
      const response = await api.get(`/facturacion?${params}`);
      if (response.data.success) {
        setFacturas(response.data.data.facturas);
        setPaginacion(prev => ({
          ...prev,
          total:        response.data.data.paginacion.total,
          totalPaginas: response.data.data.paginacion.totalPaginas,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacion.pagina, paginacion.limite]);

  useEffect(() => { cargarFacturas(); }, [cargarFacturas]);

  const handleBusquedaChange = (e) => {
    setFiltros(prev => ({ ...prev, busqueda: e.target.value }));
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const handleEstadoChange = (e) => {
    setFiltros(prev => ({ ...prev, estado: e.target.value }));
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const handleFacturaCreada = () => {
    setModalFormulario(false);
    cargarFacturas();
    onToastSuccess('Factura creada correctamente.');
  };

  const handleDescargarPDF = async (id, numeroFactura) => {
    try {
      const response = await api.get(`/facturacion/${id}/pdf`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `RIDE_${String(numeroFactura ?? id).replace(/-/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      onToastError(err.response?.data?.message || 'No se pudo generar el PDF.');
    }
  };

  const paginaAnterior  = () => setPaginacion(p => ({ ...p, pagina: p.pagina - 1 }));
  const paginaSiguiente = () => setPaginacion(p => ({ ...p, pagina: p.pagina + 1 }));

  const rangoDesde = paginacion.total === 0
    ? 0
    : (paginacion.pagina - 1) * paginacion.limite + 1;
  const rangoHasta = Math.min(
    paginacion.pagina * paginacion.limite,
    paginacion.total
  );

  return {
    facturas, loading, error,
    filtros, paginacion,
    modalFormulario,  setModalFormulario,
    facturaDetalleId, setFacturaDetalleId,
    handleBusquedaChange,
    handleEstadoChange,
    handleFacturaCreada,
    handleDescargarPDF,
    paginaAnterior,
    paginaSiguiente,
    cargarFacturas,
    rangoDesde,
    rangoHasta,
  };
}