import { useState, useEffect } from 'react';
import api from '../../../../api/api';

export default function useModalProveedor({ proveedor, onGuardado }) {
  const esEdicion = !!proveedor;

  const [form, setForm] = useState({
    nombre:            proveedor?.nombre            ?? '',
    ciudad:            proveedor?.ciudad            ?? '',
    telefono_whatsapp: proveedor?.telefono_whatsapp ?? '',
    email:             proveedor?.email             ?? '',
    notas:             proveedor?.notas             ?? '',
  });

  const [materiales,    setMateriales]    = useState([]);
  const [seleccionados, setSeleccionados] = useState(
    proveedor?.materiales?.map(m => m.id) ?? []
  );
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    api.get('/proveedores/materiales')
      .then(r => setMateriales(r.data.data))
      .catch(() => setError('No se pudieron cargar los materiales'));
  }, []);

  const cambiar = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleMaterial = (id) =>
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setGuardando(true);
    setError(null);
    try {
      const payload = { ...form, material_ids: seleccionados };
      const res = esEdicion
        ? await api.put(`/proveedores/${proveedor.id}`, payload)
        : await api.post('/proveedores', payload);
      onGuardado(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return {
    esEdicion,
    form, cambiar,
    materiales, seleccionados, toggleMaterial,
    guardando, error,
    guardar,
  };
}