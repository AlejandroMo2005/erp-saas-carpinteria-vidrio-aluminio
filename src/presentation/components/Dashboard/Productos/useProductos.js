import { useState, useEffect } from 'react';
import api from '../../../api/api';

export function generarDatosGrafico(material) {
  if (!material.variantes || material.variantes.length === 0) return [];
  const periodos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  return periodos.map((periodo, idx) => {
    const punto = { periodo };
    material.variantes.forEach(v => {
      const baseStock = Number(v.stock) || 0;
      const variacion = (Math.random() - 0.5) * 20;
      punto[v.color_nombre] = Math.max(0, baseStock + variacion * (idx + 1) / 6);
    });
    return punto;
  });
}

export default function useProductos() {
  const [data,         setData]         = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/dashboard/materiales-variantes');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const toggleSeleccionado = (id) =>
    setSeleccionado(prev => prev === id ? null : id);

  const materialSeleccionado = data.find(m => m.material_id === seleccionado);

  return { data, seleccionado, loading, toggleSeleccionado, materialSeleccionado };
}