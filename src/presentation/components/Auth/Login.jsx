import { useState, useId } from 'react';
// src/presentation/components/Auth/Login.jsx
// ⭐ Sprint 10 — Con fallback directo por si AuthContext no está actualizado aún...
// 🔒 Sprint 12 — sessionExpired banner + pasar expiresIn al login()..
// ♿ Sprint 14 — Fix accesibilidad: aria-invalid, aria-describedby, aria-live
// 🎨 Sprint 18 — Inline styles del banner movidos a .alert-warning / .alert-dismiss...

import { useAuth }           from '../../context/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import api                   from '../../api/api';
import './auth.css';
import './AuthLayout.css';
import './Login.css';

export default function Login({ sessionExpired = false, onDismissExpired = () => {} }) {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // IDs estables para aria-describedby — useId garantiza unicidad
  // incluso si hay dos instancias de Login en el árbol.
  const errorId   = useId();
  const expiredId = useId();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpiar error al editar — evita mensaje de intento anterior mientras escribe.
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);

      if (res.data.success) {
        const { user, accessToken, refreshToken, expiresIn } = res.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        await login({ user, accessToken, refreshToken, expiresIn });
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  // aria-describedby compuesto — conecta inputs con el mensaje de error
  // activo (errorId) y/o el banner de sesión expirada (expiredId).
  const describedBy = [
    error          ? errorId   : null,
    sessionExpired ? expiredId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <main className="auth-container" role="main">
      <div className="auth-card">

        <header className="auth-header">
          <h1 id="login-title">Sistema de Gestión</h1>
          <p>Ingresa tus credenciales</p>
        </header>

        {/* Banner de sesión expirada ─────────────────────────────────────────
            aria-live="assertive" — alerta de seguridad.
            Layout flex gestionado por .alert-warning en Login.css. */}
        {sessionExpired && (
          <div
            id={expiredId}
            className="alert alert-warning"
            role="alert"
            aria-live="assertive"
          >
            <span>⏱️ Tu sesión expiró por inactividad. Inicia sesión nuevamente.</span>
            <button
              className="alert-dismiss"
              onClick={onDismissExpired}
              aria-label="Cerrar aviso de sesión expirada"
            >
              ✕
            </button>
          </div>
        )}

        <form
          className="login-form"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          aria-labelledby="login-title"
          noValidate
        >
          {/* aria-live="assertive" para errores de submit */}
          {error && (
            <div
              id={errorId}
              className="alert alert-error"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="ejemplo@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <footer className="login-footer">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <br />
          <Link to="/register">Crear cuenta</Link>
        </footer>

      </div>
    </main>
  );
}
