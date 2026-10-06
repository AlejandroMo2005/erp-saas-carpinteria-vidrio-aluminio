import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/api';

export default function useTicket() {
  const [periodo, setPeriodo] = useState('mes');
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get(`/dashboard/ingresos?periodo=${periodo}`);
      const raw  = res.data.data;
      const procesado = raw.map(d => ({
        periodo:         d.periodo,
        ticket_promedio: d.total_pedidos > 0
          ? Math.round(d.ingresos / d.total_pedidos)
          : 0,
        total_pedidos:   d.total_pedidos,
      }));
      setData(procesado);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { periodo, setPeriodo, data, loading };
}
