// src/presentation/components/Perfil/usePerfil.js
// Sprint 7 — extraído de Perfil.jsx

import { useState } from 'react';
import api from '../../api/api';

export function usePerfil({ usuario, onGuardado }) {
  /* ── Estado del formulario ─────────────────────────────────────────────── */
  const [form, setForm] = useState({
    nombre_completo : usuario?.nombre_completo || '',
    telefono        : usuario?.telefono        || '',
    email           : usuario?.email           || '',
    cedula_ruc      : usuario?.cedula_ruc      || '',
    direccion       : usuario?.direccion       || '',
  });

  const [cambiarPass, setCambiarPass] = useState(false);
  const [passForm, setPassForm] = useState({
    passwordActual  : '',
    password        : '',
    passwordConfirm : '',
  });

  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');
  const [exito,    setExito]    = useState('');

  /* ── Handlers de cambio ────────────────────────────────────────────────── */
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handlePassChange = (e) => {
    setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const toggleCambiarPass = () => {
    setCambiarPass(v => !v);
    setError('');
  };

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (cambiarPass) {
      if (!passForm.passwordActual) {
        setError('Ingresa tu contraseña actual para cambiarla.');
        return;
      }
      if (passForm.password.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (passForm.password !== passForm.passwordConfirm) {
        setError('Las contraseñas nuevas no coinciden.');
        return;
      }
    }

    const body = { ...form };
    if (cambiarPass) {
      body.passwordActual = passForm.passwordActual;
      body.password       = passForm.password;
    }

    setCargando(true);
    try {
      const res = await api.put('/usuarios/me', body);
      if (res.data.success) {
        setExito('Perfil actualizado correctamente.');
        setTimeout(() => { onGuardado?.(res.data.data); }, 900);
      } else {
        setError(res.data.message || 'Error al guardar.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return {
    form, handleChange,
    cambiarPass, toggleCambiarPass,
    passForm, handlePassChange,
    cargando, error, exito,
    handleSubmit,
  };
}