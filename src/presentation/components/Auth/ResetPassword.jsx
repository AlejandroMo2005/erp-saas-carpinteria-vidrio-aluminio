// src/presentation/components/Auth/ResetPassword.jsx

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./ResetPassword.css";

export default function ResetPassword() {
  const { token }   = useParams();
  const navigate    = useNavigate();

  const [password,  setPassword]  = useState("");
  const [message,   setMessage]   = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword: password,
      });

      setIsSuccess(true);
      setMessage(res.data.message || "✅ Contraseña actualizada");
      // Redirigir al login tras 2 s para que el usuario lea el mensaje
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-container" role="main">
      <section className="reset-card" aria-labelledby="reset-title">

        <header className="reset-header">
          <h1 id="reset-title">Nueva Contraseña</h1>
          <p>Establece tu nueva contraseña</p>
        </header>

        <form className="reset-form" onSubmit={handleSubmit} noValidate>

          {message && (
            <div
              className={`reset-alert${isSuccess ? ' success' : ' error'}`}
              role="alert"
              aria-live="assertive"
            >
              {message}
            </div>
          )}

          <div className="reset-group">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            className="reset-btn"
            disabled={loading || isSuccess}
            aria-busy={loading}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>

        </form>

      </section>
    </main>
  );
}