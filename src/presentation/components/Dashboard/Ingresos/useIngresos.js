import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/api';

export default function useIngresos() {
  const [periodo, setPeriodo] = useState('mes');
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/ingresos?periodo=${periodo}`);
      setData(res.data.data);
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
