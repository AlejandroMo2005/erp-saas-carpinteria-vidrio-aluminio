// src/shared/middleware/tenant.js
// Sprint 19 — multi-empresa
// Sprint 20 — migrado a src/shared/middleware/
// Sprint 21 — logger path corregido: ../utils/logger (era ../../../utils/logger, ruta legacy)

'use strict';

const logger = require('../utils/logger'); // src/shared/utils/logger

// Va DESPUÉS de protect. Setea req.empresaId desde req.user.empresa_id que auth.js cargó de BD.
exports.tenantMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  const empresaId = req.user.empresa_id;

  if (!empresaId) {
    logger.warn('TENANT_MISSING', {
      event:  'tenant.empresa_id_missing',
      userId: req.user.id,
      path:   req.path,
      ip:     req.ip,
    });
    return res.status(401).json({
      success: false,
      message: 'Usuario sin empresa asignada. Contacta al administrador.',
    });
  }

  req.empresaId = Number(empresaId);
  next();
};

// WHERE clause para queries raw: tenantScope(req, 'p', 'deleted_at IS NULL', [])
exports.tenantScope = (req, alias = 'p', extraWhere = '', extraParams = []) => {
  const col   = `${alias}.empresa_id`;
  const where = extraWhere ? `${col} = ? AND ${extraWhere}` : `${col} = ?`;
  return [where, [req.empresaId, ...extraParams]];
};

// Valor de empresa_id para INSERT
exports.tenantInsert = (req) => req.empresaId;