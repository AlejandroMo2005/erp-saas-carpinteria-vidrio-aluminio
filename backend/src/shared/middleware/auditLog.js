// src/shared/middleware/auditLog.js
// 📦 Sprint 20 — Movido de middleware/auditLog.js
'use strict';

const db     = require('../../config/database.js');
const logger = require('../utils/logger');

function esAnulacion(req) {
  if (!req.body) return false;
  const estadosAnulacion = ['ANULADA','ANULADO','CANCELADA','CANCELADO'];
  for (const campo of ['estado','status','estado_factura']) {
    if (req.body[campo] && estadosAnulacion.includes(req.body[campo]?.toString().toUpperCase())) return true;
  }
  return false;
}

async function insertarAuditoria(datos) {
  try {
    await db.query(
      `INSERT INTO auditoria_acciones (usuario_id, usuario_nombre, accion, tabla_afectada, registro_id, detalle, ip_address, user_agent) VALUES (?,?,?,?,?,?,?,?)`,
      [datos.usuario_id||null, datos.usuario_nombre||'Sistema', datos.accion, datos.tabla_afectada||null, datos.registro_id||null, datos.detalle ? JSON.stringify(datos.detalle) : null, datos.ip||null, datos.user_agent||null]
    );
  } catch (error) {
    logger.warn('AUDIT_INSERT_FAIL', { event: 'audit.insert_error', message: error.message, accion: datos.accion, tabla: datos.tabla_afectada });
  }
}

const auditarOperacion = (tabla) => (req, res, next) => {
  const metodo   = req.method.toUpperCase();
  const esDelete = metodo === 'DELETE';
  const esAnular = (metodo === 'PATCH' || metodo === 'PUT') && esAnulacion(req);
  if (!esDelete && !esAnular) return next();
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const accion = esDelete ? 'DELETE' : 'ANULACION';
      const registroId = req.params.id || req.params.facturaId || req.params.pedidoId || body?.data?.id || null;
      void insertarAuditoria({ usuario_id: req.user?.id, usuario_nombre: req.user?.nombre||req.user?.email, accion, tabla_afectada: tabla, registro_id: registroId, detalle: { method: req.method, path: req.path, params: req.params, body: esAnular ? { estado: req.body?.estado } : undefined, respuesta: body?.message||null }, ip: req.ip||req.headers['x-forwarded-for']?.split(',')[0]?.trim(), user_agent: req.headers['user-agent']?.slice(0,255) });
    }
    return originalJson(body);
  };
  next();
};

const registrarAuditoria = async (req, accion, tabla, registroId, detalle = {}) => {
  await insertarAuditoria({ usuario_id: req.user?.id, usuario_nombre: req.user?.nombre||req.user?.email, accion, tabla_afectada: tabla, registro_id: registroId, detalle, ip: req.ip||req.headers['x-forwarded-for']?.split(',')[0]?.trim(), user_agent: req.headers['user-agent']?.slice(0,255) });
};

module.exports = { auditarOperacion, registrarAuditoria };