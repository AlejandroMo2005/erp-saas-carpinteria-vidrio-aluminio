import { useState, useEffect } from 'react';
import api from '../../../api/api';

export default function useEstado() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/dashboard/estados');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const total = data.reduce((s, e) => s + Number(e.cantidad), 0);

  return { data, loading, total };
}