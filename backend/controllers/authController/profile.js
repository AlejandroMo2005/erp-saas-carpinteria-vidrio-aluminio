// backend/controllers/authController/profile.js
'use strict';

const Usuario = require('../../models/Usuario');
const logger  = require('../../utils/logger');
const { actualizarActividad } = require('./helpers');

exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.getById(req.user.id);
    if (!usuario)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    actualizarActividad(req.user.id);
    return res.json({ success: true, data: usuario });
  } catch (error) {
    logger.error('PROFILE_ERROR', { event: 'auth.profile_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};