import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/api';

export default function useProveedoresMain() {
  const [tab,            setTab]            = useState('proveedores');
  const [proveedores,    setProveedores]    = useState([]);
  const [alertas,        setAlertas]        = useState([]);
  const [historial,      setHistorial]      = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [modalProv,      setModalProv]      = useState(null);
  const [modalSolicitud, setModalSolicitud] = useState(null);

  const cargarProveedores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const r = await api.get('/proveedores');
      setProveedores(r.data.data);
    } catch {
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarAlertas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const r = await api.get('/proveedores/alertas/stock');
      setAlertas(r.data.data);
    } catch {
      setError('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const r = await api.get('/proveedores/solicitudes/historial');
      setHistorial(r.data.data);
    } catch {
      setError('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'proveedores') void cargarProveedores();
    if (tab === 'alertas')     void cargarAlertas();
    if (tab === 'historial')   void cargarHistorial();
  }, [tab, cargarProveedores, cargarAlertas, cargarHistorial]);

  const refrescarTab = () => {
    if (tab === 'proveedores') void cargarProveedores();
    if (tab === 'alertas')     void cargarAlertas();
    if (tab === 'historial')   void cargarHistorial();
  };

  const onGuardado = (prov) => {
    setProveedores(prev => {
      const idx = prev.findIndex(p => p.id === prov.id);

      return idx >= 0
        ? prev.map(p => p.id === prov.id ? prov : p)
        : [...prev, prov];
    });

    setModalProv(null);
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;

    try {
      await api.delete(`/proveedores/${id}`);
      setProveedores(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('No se pudo eliminar');
    }
  };

  const onGenerarPedido = async (
    proveedorId,
    nombreProv,
    telefono,
    items
  ) => {
    try {
      const r = await api.post('/proveedores/solicitudes/generar', {
        proveedor_id: proveedorId,
        items,
      });

      setModalSolicitud({
        proveedor_id:      proveedorId,
        nombreProveedor:   nombreProv,
        telefono_whatsapp: telefono,
        plantilla:         r.data.data.plantilla_texto,
        solicitudId:       r.data.data.solicitud_id,
      });
    } catch {
      setError('Error al generar la solicitud');
    }
  };

  return {
    tab,
    setTab,
    proveedores,
    alertas,
    historial,
    loading,
    error,
    modalProv,
    setModalProv,
    modalSolicitud,
    setModalSolicitud,
    cargarHistorial,
    refrescarTab,
    onGuardado,
    eliminar,
    onGenerarPedido,
  };
}
