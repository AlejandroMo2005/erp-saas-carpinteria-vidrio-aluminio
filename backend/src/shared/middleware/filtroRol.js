// src/shared/middleware/filtroRol.js
// 📦 Sprint 20 — Movido de middleware/filtroRol.js (sin cambios, no tiene imports internos)
'use strict';

const filtroCliente = (req, res, next) => {
  if (req.user?.rol === 'CLIENTE') {
    req.filtroUsuario = { soloPropio: true, usuarioId: req.user.id, nombre: req.user.nombre, email: req.user.email };
  } else {
    req.filtroUsuario = { soloPropio: false };
  }
  next();
};

const soloSistema = (req, res, next) => {
  if (req.user?.rol === 'CLIENTE')
    return res.status(403).json({ success: false, message: 'No tienes permisos para acceder a este recurso' });
  next();
};

module.exports = { filtroCliente, soloSistema };