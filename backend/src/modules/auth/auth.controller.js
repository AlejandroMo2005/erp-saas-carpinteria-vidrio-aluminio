// src/modules/auth/auth.controller.js
// 📦 Sprint 20 — Barrel del módulo auth
//                Equivalente al anterior controllers/authController/index.js
//                Todos los handlers se importan desde ./handlers/

'use strict';

const { login, register }                                    = require('./handlers/login');
const { refresh, logout }                                    = require('./handlers/session');
const { forgotPassword, verifyResetCode, resetPassword }     = require('./handlers/password');
const { getProfile }                                         = require('./handlers/profile');

module.exports = {
  login,
  register,
  refresh,
  logout,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getProfile,
};