import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/api';

export default function useDetalleFactura({ facturaId, onAnulada }) {
  const [factura,     setFactura]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [anulando,    setAnulando]    = useState(false);
  const [modalAnular, setModalAnular] = useState(false);
  const [motivo,      setMotivo]      = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');

  const cargarFactura = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await api.get(`/facturacion/${facturaId}`);
      if (resp.data.success) {
        setFactura(resp.data.data ?? resp.data.factura);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  }, [facturaId]);

  useEffect(() => {
    void cargarFactura();
  }, [cargarFactura]);

  const handleAnular = async () => {
    if (motivo.trim().length < 10) {
      setErrorMotivo('El motivo debe tener al menos 10 caracteres');
      return;
    }
    try {
      setAnulando(true);
      setErrorMotivo('');
      await api.put(`/facturacion/${facturaId}/anular`, { motivo: motivo.trim() });
      await cargarFactura();
      setModalAnular(false);
      setMotivo('');
      onAnulada?.();
    } catch (err) {
      setErrorMotivo(err.response?.data?.message || 'Error al anular la factura');
    } finally {
      setAnulando(false);
    }
  };

  const handleDescargarPDF = async (numeroFactura) => {
    try {
      const response = await api.get(`/facturacion/${facturaId}/pdf`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `RIDE_${String(numeroFactura ?? facturaId).replace(/-/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    }
  };

  const handleImprimir = async () => {
    try {
      const response = await api.get(`/facturacion/${facturaId}/pdf`, { responseType: 'blob' });
      const url     = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const ventana = window.open(url);
      ventana?.addEventListener('load', () => {
        ventana.print();
        window.URL.revokeObjectURL(url);
      });
    } catch {
      alert('No se pudo generar el PDF para imprimir.');
    }
  };

  const abrirModalAnular  = () => setModalAnular(true);
  const cerrarModalAnular = () => {
    setModalAnular(false);
    setMotivo('');
    setErrorMotivo('');
  };

  return {
    factura, loading, error,
    anulando, modalAnular,
    motivo, setMotivo,
    errorMotivo, setErrorMotivo,
    cargarFactura,
    handleAnular,
    handleDescargarPDF,
    handleImprimir,
    abrirModalAnular,
    cerrarModalAnular,
  };
}
