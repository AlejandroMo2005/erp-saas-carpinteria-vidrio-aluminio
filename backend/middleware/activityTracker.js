// backend/middleware/activityTracker.js
// ⭐ Sprint 11 — Seguimiento real de inactividad de sesión
// 🔒 Sprint 12 — Fix inactivityGuard: blacklist jti al expirar por inactividad
//               + MAX_INACTIVIDAD_MS configurable por env
//               + clearActivityCache exportado (llamar desde logout)
//
// BUGS CORREGIDOS Sprint 12:
//   • BUG 3: inactivityGuard borraba sesiones y ponía token_id = NULL
//     pero NO blacklisteaba el jti → access token seguía válido ≤15 min.
//     Fix: se llama a blacklistJti(req.user.jti) antes de invalidar.
//   • BUG 4 (en auth.js): jti no llegaba a req.user → inactivityGuard
//     no podía acceder a él. Fix: auth.js ahora incluye jti en req.user.
//   • MAX_INACTIVIDAD_MS ahora usa SESSION_INACTIVITY_MINUTES del .env
//     (default: 15 min — alineado con el access token).
//
// Uso en server.js (después de protect, ANTES de las rutas protegidas):
//   const { trackActivity } = require('./middleware/activityTracker');
//   router.use(protect, trackActivity);
//
// Para endpoints sensibles usar inactivityGuard además:
//   router.put('/perfil', protect, inactivityGuard, updateMe)

const db     = require('../config/database');
const logger = require('../utils/logger');

// ── Configuración ────────────────────────────────────────────────────────
//
// SESSION_INACTIVITY_MINUTES en .env:
//   15  → sesión cierra si no hay actividad en 15 min (default, alineado con JWT)
//   60  → cierre por hora de inactividad
//   10080 → 7 días (comportamiento Sprint 11)
//
const INACTIVIDAD_MINUTOS  = parseInt(process.env.SESSION_INACTIVITY_MINUTES || '15');
const MAX_INACTIVIDAD_MS   = INACTIVIDAD_MINUTOS * 60 * 1000;

// Solo hacer UPDATE en BD si pasaron más de N ms desde el último update.
// Evita un UPDATE por cada request en rutas con mucha frecuencia.
const MIN_UPDATE_INTERVAL_MS = 60 * 1000; // 60 segundos

// Cache en memoria: { userId: lastUpdateTimestamp }
const activityCache = new Map();

// ── Helper privado: blacklist de JTI ─────────────────────────────────────
// Copia local del helper de authController para no crear dependencia circular.
// Inserta el jti en token_blacklist con TTL = tiempo restante del access token.
const blacklistJti = async (jti) => {
  if (!jti) return;
  try {
    const expireMinutes = parseInt(process.env.JWT_EXPIRE_MINUTES || '15');
    const expiresAt     = new Date(Date.now() + expireMinutes * 60 * 1000);
    await db.query(
      'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
      [jti, expiresAt]
    );
  } catch (err) {
    // No crítico — no bloquear el flujo
    logger.warn('BLACKLIST_INSERT_FAIL', {
      event:   'activity.blacklist_insert_fail',
      jti,
      message: err.message,
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════
// trackActivity
// Middleware liviano: actualiza last_activity cada MIN_UPDATE_INTERVAL_MS.
// Solo actúa si req.user existe (rutas protegidas).
// ═════════════════════════════════════════════════════════════════════════
const trackActivity = async (req, res, next) => {
  if (!req.user?.id) return next();

  const userId = req.user.id;
  const ahora  = Date.now();

  try {
    const ultimoUpdate          = activityCache.get(userId) || 0;
    const tiempoDesdeCacheUpdate = ahora - ultimoUpdate;

    if (tiempoDesdeCacheUpdate >= MIN_UPDATE_INTERVAL_MS) {
      await db.query(
        'UPDATE usuarios SET last_activity = NOW() WHERE id = ?',
        [userId]
      );
      activityCache.set(userId, ahora);
    }
  } catch (err) {
    // Error no crítico — no bloquear el request
    logger.warn('TRACK_ACTIVITY_FAIL', {
      event:   'activity.track_fail',
      userId,
      message: err.message,
    });
  }

  next();
};

// ═════════════════════════════════════════════════════════════════════════
// inactivityGuard
// Guard estricto: consulta last_activity en BD y rechaza si superó
// MAX_INACTIVIDAD_MS. Usar en endpoints sensibles junto a protect:
//   router.delete('/:id', protect, inactivityGuard, authorize('ADMIN'), ...)
//
// Sprint 12: ahora blacklistea el jti antes de invalidar la sesión.
// Requiere que auth.js incluya jti en req.user (fix en auth.js Sprint 12).
// ═════════════════════════════════════════════════════════════════════════
const inactivityGuard = async (req, res, next) => {
  if (!req.user?.id) return next();

  try {
    const [rows] = await db.query(
      'SELECT last_activity FROM usuarios WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida.',
        expired: true
      });
    }

    const lastActivity = rows[0].last_activity;

    // Sin actividad registrada aún → primera sesión, dejar pasar
    if (!lastActivity) return next();

    const tiempoInactivo = Date.now() - new Date(lastActivity).getTime();

    if (tiempoInactivo > MAX_INACTIVIDAD_MS) {
      // ── Sprint 12: invalidar sesión completa ─────────────────────────
      //
      // ANTES (bug): solo borraba sesiones y ponía token_id = NULL.
      // El access token seguía válido ≤15 min porque no estaba en blacklist.
      //
      // AHORA:
      //   1. Blacklistear jti del access token actual (via req.user.jti)
      //   2. Borrar todas las sesiones de refresh
      //   3. Poner token_id = NULL (segunda línea de defensa)
      //
      // req.user.jti fue agregado en auth.js Sprint 12.
      // Si por alguna razón no llegara, blacklistJti(undefined) es no-op.
      //
      await blacklistJti(req.user.jti);
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [req.user.id]);
      await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [req.user.id]);

      // Limpiar cache local
      activityCache.delete(req.user.id);

      logger.warn('SESSION_EXPIRED_INACTIVITY', {
        event:           'activity.session_expired',
        userId:          req.user.id,
        ip:              req.ip,
        inactivoMinutos: Math.round(tiempoInactivo / 60000),
        limiteMinutos:   INACTIVIDAD_MINUTOS,
      });

      return res.status(401).json({
        success: false,
        message: `Sesión expirada por inactividad (${INACTIVIDAD_MINUTOS} min). Inicia sesión nuevamente.`,
        expired: true
      });
    }

    next();
  } catch (err) {
    // Error técnico: no bloquear el request por un fallo de BD en el guard
    logger.error('INACTIVITY_GUARD_ERROR', {
      event:   'activity.guard_error',
      message: err.message,
      userId:  req.user?.id,
    });
    next();
  }
};

// ═════════════════════════════════════════════════════════════════════════
// clearActivityCache
// Elimina la entrada del usuario del cache en memoria.
// Sprint 12: DEBE llamarse desde authController.logout para que
// en el próximo login no herede el timestamp anterior del cache.
//
// Uso en authController.js:
//   const { clearActivityCache } = require('./activityTracker'); // ← al inicio
//   // ... dentro de exports.logout:
//   clearActivityCache(usuarioId);
// ═════════════════════════════════════════════════════════════════════════
const clearActivityCache = (userId) => {
  activityCache.delete(userId);
};

module.exports = { trackActivity, inactivityGuard, clearActivityCache };