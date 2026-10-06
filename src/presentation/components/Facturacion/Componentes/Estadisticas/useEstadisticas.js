import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/api';
import { calcularFechas } from './utils';

export default function useEstadisticas() {
  const [periodo, setPeriodo] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [datos,   setDatos]   = useState(null);
  const [resumen, setResumen] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { fechaDesde, fechaHasta } = calcularFechas(periodo);
      const params = `fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
      const [respEstadisticas, respResumen] = await Promise.all([
        api.get(`/facturacion/estadisticas?${params}`),
        api.get(`/facturacion/resumen-periodo?${params}`),
      ]);
      if (respEstadisticas.data.success) setDatos(respEstadisticas.data.data);
      if (respResumen.data.success)      setResumen(respResumen.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return {
    periodo, setPeriodo,
    loading, error,
    datos,   resumen,
    cargarDatos,
  };
}
