import { useState } from "react";
// src/presentation/components/Auth/ForgotPassword.jsx
// 🎨 Sprint 18 — inline style del input de código movido a .forgot-group__input--code

import { useNavigate }     from "react-router-dom";
import api                 from "../../api/api";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step,        setStep]        = useState(1); // 1: email · 2: código · 3: nueva contraseña
  const [email,       setEmail]       = useState("");
  const [code,        setCode]        = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token,       setToken]       = useState("");
  const [message,     setMessage]     = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  // ─── Paso 1: Enviar email ─────────────────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault();
    setMessage(""); setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data.success) {
        setToken(res.data.token);
        setMessage("✅ Código enviado a tu correo");
        setTimeout(() => setStep(2), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  };

  // ─── Paso 2: Verificar código ─────────────────────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setMessage(""); setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/verify-code", { token, code });
      if (res.data.success) {
        setMessage("✅ Código verificado");
        setTimeout(() => setStep(3), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  // ─── Paso 3: Nueva contraseña ─────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage(""); setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { token, code, newPassword });
      if (res.data.success) {
        setMessage("✅ Contraseña actualizada");
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-container" role="main">
      <section className="forgot-card">
        <header className="forgot-header">
          <h1>Recuperar Contraseña</h1>
          <p>
            {step === 1 && "Ingresa tu correo registrado"}
            {step === 2 && "Ingresa el código enviado a tu correo"}
            {step === 3 && "Crea tu nueva contraseña"}
          </p>
        </header>

        {/* ─── Paso 1: Email ─────────────────────────────────────────────── */}
        {step === 1 && (
          <form className="forgot-form" onSubmit={handleSendCode}>
            {message && <div className="forgot-alert success">{message}</div>}
            {error   && <div className="forgot-alert error">{error}</div>}

            <div className="forgot-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                required
              />
            </div>

            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Código"}
            </button>
          </form>
        )}

        {/* ─── Paso 2: Código ────────────────────────────────────────────── */}
        {step === 2 && (
          <form className="forgot-form" onSubmit={handleVerifyCode}>
            {message && <div className="forgot-alert success">{message}</div>}
            {error   && <div className="forgot-alert error">{error}</div>}

            <div className="forgot-group">
              <label htmlFor="code">Código de 6 dígitos</label>
              {/* Antes: style={{ fontSize: '2em', textAlign: 'center', letterSpacing: '0.5em' }}
                  Ahora: clase .forgot-group__input--code en ForgotPassword.css */}
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength="6"
                required
                className="forgot-group__input--code"
              />
            </div>

            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? "Verificando..." : "Verificar Código"}
            </button>
          </form>
        )}

        {/* ─── Paso 3: Nueva contraseña ──────────────────────────────────── */}
        {step === 3 && (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            {message && <div className="forgot-alert success">{message}</div>}
            {error   && <div className="forgot-alert error">{error}</div>}

            <div className="forgot-group">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
              />
            </div>

            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
