// src/modules/auth/handlers/profile.js
// 📦 Sprint 20 — Migrado a src/modules/auth/handlers/
//                helpers → ../auth.service
//                models  → ../../../../models/Usuario  (hasta migrar módulo usuario)

'use strict';

// Módulo usuario migrado en Sprint 20
const Usuario = require('../../usuario/usuario.repository');
const logger  = require('../../../../utils/logger');
const { actualizarActividad } = require('../auth.service');

// ═══════════════════════════════════════════════════════
// GET /api/auth/profile
// ═══════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.getById(req.user.id);
    if (!usuario)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    actualizarActividad(req.user.id);
    return res.json({ success: true, data: usuario });
  } catch (error) {
    logger.error('PROFILE_ERROR', {
      event:   'auth.profile_error',
      message: error.message,
      userId:  req.user?.id,
    });
    return res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};