// backend/controllers/authController/index.js
'use strict';

const { login, register }                          = require('./login');
const { refresh, logout }                          = require('./session');
const { forgotPassword, verifyResetCode, resetPassword } = require('./password');
const { getProfile }                               = require('./profile');

module.exports = {
  login, register,
  refresh, logout,
  forgotPassword, verifyResetCode, resetPassword,
  getProfile,
};