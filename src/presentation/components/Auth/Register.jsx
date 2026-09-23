// src/presentation/components/Auth/Register.jsx
// ⭐ Sprint 10 — Ajuste para dual-token (accessToken + refreshToken)
//
// Cambio quirúrgico — solo la llamada a login():
//   Antes: login(res.data.data.user, res.data.data.token)
//   Ahora: login({ user, accessToken, refreshToken })

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import "./Register.css";

export default function Register() {
  const { login } = useAuth();

  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);

      if (res.data.success) {
        // ⭐ Sprint 10: mismo patrón que Login
        const { user, accessToken, refreshToken } = res.data.data;
        login({ user, accessToken, refreshToken });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-container" role="main">
      <section className="register-card" aria-labelledby="register-title">

        <header className="register-header">
          <h1 id="register-title">Crear Cuenta</h1>
          <p>Registro de nuevo usuario</p>
        </header>

        <form className="register-form" onSubmit={handleSubmit} noValidate>

          {error && (
            <div className="register-alert" role="alert">
              {error}
            </div>
          )}

          <div className="register-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-group">
            <label htmlFor="email">Correo Gmail</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="register-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Creando..." : "Registrarse"}
          </button>

        </form>

      </section>
    </main>
  );
}