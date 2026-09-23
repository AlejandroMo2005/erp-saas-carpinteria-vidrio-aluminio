import { useState, useEffect } from 'react';
import api from '../../../api/api';

export default function useUsuarios() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/dashboard/usuarios-ingresos');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return { data, loading };
}