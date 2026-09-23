// backend/middleware/tenant.js
// Sprint 19 — Multi-empresa
// Va DESPUÉS de protect. empresa_id ya viene en req.user puesto por auth.js.
// auth.js lo consulta directo a BD — no depende del payload del token.

const logger = require('../utils/logger');

exports.tenantMiddleware = (req, res, next) => {
  // Si protect ya rechazó la request, req.user no existe — no hacer nada
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
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

// Para WHERE en queries raw MySQL.
// Uso: const [where, params] = tenantScope(req, 'p', 'p.deleted_at IS NULL', []);
exports.tenantScope = (req, alias = 'p', extraWhere = '', extraParams = []) => {
  const col   = `${alias}.empresa_id`;
  const where = extraWhere ? `${col} = ? AND ${extraWhere}` : `${col} = ?`;
  return [where, [req.empresaId, ...extraParams]];
};

// Para INSERT: devuelve el valor de empresa_id.
exports.tenantInsert = (req) => req.empresaId;