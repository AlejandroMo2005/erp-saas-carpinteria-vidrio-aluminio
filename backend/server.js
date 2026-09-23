// backend/server.js
// Sprint 20 — Rutas migradas a src/modules/ (registerRoutes)

'use strict';

// Atrapar cualquier error no manejado ANTES de que mate el proceso
process.on('uncaughtException',  (err) => { console.error('💥 UNCAUGHT EXCEPTION:', err); });
process.on('unhandledRejection', (err) => { console.error('💥 UNHANDLED REJECTION:', err); });

const fs           = require('fs');
const path         = require('path');
const cluster      = require('cluster');
const express      = require('express');
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const compression  = require('compression');
require('dotenv').config();

// ── Config + utils ─────────────────────────────────────────────────────────
const db     = require('./config/database');
const logger = require('./utils/logger');
const { PRELOAD_LINK_HEADERS, buildPath } = require('./config/preload');
const { helmetMiddleware, customHeaders }  = require('./config/helmet');
const { corsMiddleware, ALLOWED_ORIGINS }  = require('./config/cors');

// ── Middleware ─────────────────────────────────────────────────────────────
const { emitirCsrfCookie, verificarCsrf }                                                        = require('./middleware/csrf');
const { errorHandler, notFoundHandler }                                                          = require('./middleware/errorHandler');
const { trackActivity }                                                                          = require('./middleware/activityTracker');
const { globalLimiter, xssProtect, sqlInjectionProtect, additionalSecurityHeaders, httpLogger } = require('./middleware/security');
const { cacheHeaders, referenciasStatic, buildStatic, publicStatic }                            = require('./middleware/staticCache');

// ── Rutas (Sprint 20 — módulos migrados a src/) ────────────────────────────
let registerRoutes;
try {
  ({ registerRoutes } = require('./src/modules/index'));
} catch (err) {
  console.error('💥 ERROR cargando src/modules/index.js:', err.message);
  console.error(err.stack);
  process.exit(1);
}

const app       = express();
const PORT      = process.env.PORT || 5000;
const IS_PROD   = process.env.NODE_ENV === 'production';
const WORKER_ID = cluster.isWorker ? `worker-${cluster.worker.id}` : 'primary';

// ═══════════════════════════════════════════════════════════════════════════
// SEGURIDAD
// ═══════════════════════════════════════════════════════════════════════════
app.use(helmetMiddleware);
app.use(customHeaders);
app.use(additionalSecurityHeaders);

// ═══════════════════════════════════════════════════════════════════════════
// COMPRESSION + CORS
// ═══════════════════════════════════════════════════════════════════════════
app.use(compression({
  filter: (req, res) =>
    req.headers['x-no-compression'] ? false : compression.filter(req, res),
  level: 6,
}));
app.use(corsMiddleware);

// ═══════════════════════════════════════════════════════════════════════════
// BODY + COOKIE PARSER
// ═══════════════════════════════════════════════════════════════════════════
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// ═══════════════════════════════════════════════════════════════════════════
// CSRF
// ═══════════════════════════════════════════════════════════════════════════
app.use(emitirCsrfCookie);
app.use('/api', (req, res, next) => {
  const esVisualizarIA = req.path === '/ia/visualizar'        && req.method === 'POST';
  const esMascaraAuto  = req.path === '/ia/mascara-auto'      && req.method === 'POST';
  const esReferencia   = req.path.startsWith('/referencias/') && req.method === 'POST';
  if (esVisualizarIA || esMascaraAuto || esReferencia) return next();
  verificarCsrf(req, res, next);
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING + RATE LIMIT + SANITIZACIÓN + ACTIVIDAD
// ═══════════════════════════════════════════════════════════════════════════
app.use(httpLogger);
app.use('/api', globalLimiter);
app.use('/api', xssProtect);
app.use('/api', sqlInjectionProtect);
app.use('/api', trackActivity);

// ═══════════════════════════════════════════════════════════════════════════
// ARCHIVOS ESTÁTICOS
// ═══════════════════════════════════════════════════════════════════════════
app.use('/referencias', ...referenciasStatic);
app.use(cacheHeaders);
app.use(buildStatic);
app.use(publicStatic);

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS BASE
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api', (req, res) => {
  res.json({
    success:  true,
    message:  'API de Sistema de Gestión de Inventario',
    version:  '1.23.0',
    endpoints: {
      auth:          '/api/auth',
      materiales:    '/api/materiales',
      pedidos:       '/api/pedidos',
      proformas:     '/api/proformas',
      trabajos:      '/api/trabajos',
      colores:       '/api/colores',
      dashboard:     '/api/dashboard',
      facturacion:   '/api/facturacion',
      configuracion: '/api/configuracion',
      usuarios:      '/api/usuarios',
      ia:            '/api/ia',
      proveedores:   '/api/proveedores',
      referencias:   '/api/referencias',
    },
  });
});

app.get('/api/recetas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM recetas');
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('RECETAS_ERROR', { event: 'recetas.getAll_error', message: error.message });
    res.status(500).json({ success: false, message: 'Error al obtener recetas' });
  }
});

app.get('/health', async (req, res) => {
  const dbConnected = await db.testConnection();
  let blacklistOk = false, referenciasOk = false, empresasOk = false;
  try { await db.query('SELECT 1 FROM token_blacklist LIMIT 1');      blacklistOk   = true; } catch { /* no activa */ }
  try { await db.query('SELECT 1 FROM trabajo_referencias LIMIT 1');  referenciasOk = true; } catch { /* falta sql */ }
  try { await db.query('SELECT 1 FROM empresas LIMIT 1');             empresasOk    = true; } catch { /* falta migración */ }
  res.json({
    success:          true,
    status:           'OK',
    version:          '1.23.0',
    database:         dbConnected   ? 'Conectada'                       : 'Desconectada',
    blacklist:        blacklistOk   ? 'Activa'                          : 'Tabla no encontrada',
    referencias:      referenciasOk ? 'Tabla activa'                    : 'Ejecutar sprint17_referencias.sql',
    multiempresa:     empresasOk    ? 'Activo ✅'                       : 'Pendiente migración Sprint 19',
    ia_hf_token:      !!process.env.HF_API_TOKEN        ? 'Configurado'                        : 'No configurado',
    ia_stability_key: !!process.env.STABILITY_API_KEY   ? 'Configurado (v2beta)'               : 'Mock activo',
    ia_anthropic_key: !!process.env.ANTHROPIC_API_KEY   ? 'Configurado (Claude Vision activo)' : 'No configurado',
    ia_replicate_key: !!process.env.REPLICATE_API_TOKEN ? 'Configurado (SAM activo)'           : 'Mock activo',
    preload_hints:    PRELOAD_LINK_HEADERS.length,
    worker:           WORKER_ID,
    timestamp:        new Date().toISOString(),
  });
});

app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  logger.warn('CSP_VIOLATION', { event: 'csp.violation', body: req.body });
  res.status(204).end();
});

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS API — Sprint 20
// ═══════════════════════════════════════════════════════════════════════════
try {
  registerRoutes(app);
} catch (err) {
  console.error('💥 ERROR registrando rutas:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// SPA FALLBACK
// ═══════════════════════════════════════════════════════════════════════════
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(buildPath, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  if (PRELOAD_LINK_HEADERS.length) res.setHeader('Link', PRELOAD_LINK_HEADERS.join(', '));
  res.sendFile(indexPath);
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  if (err?.message?.includes('queueLimit')) {
    logger.warn('DB_QUEUE_LIMIT', { event: 'db.queue_limit_reached', path: req.path, ip: req.ip });
    return res.status(503).json({ success: false, message: 'Servidor ocupado. Intenta nuevamente en unos segundos.', retryAfter: 5 });
  }
  next(err);
});
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════════════════
// ARRANQUE
// ═══════════════════════════════════════════════════════════════════════════
const startServer = async () => {
  try {
    await db.testConnection();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info('SERVIDOR_INICIADO', {
        event: 'server.start', puerto: PORT, version: '1.23.0',
        entorno: process.env.NODE_ENV || 'development',
        worker: WORKER_ID, preload_hints: PRELOAD_LINK_HEADERS.length,
      });

      if (!IS_PROD) {
        const stability = process.env.STABILITY_API_KEY   ? '✅ v2beta activo'        : '⚠️  mock activo';
        const anthropic = process.env.ANTHROPIC_API_KEY   ? '✅ Claude Vision activo' : '⚠️  descriptores manuales';
        const replicate = process.env.REPLICATE_API_TOKEN ? '✅ SAM activo'           : '⚠️  mock activo';
        console.log('='.repeat(60));
        console.log(`🚀 SERVIDOR INICIADO — Sprint 20`);
        console.log(`📍 Puerto:      ${PORT}`);
        console.log(`🔗 URL:         http://localhost:${PORT}`);
        console.log(`📂 Módulos:     src/modules/ ✅`);
        console.log(`🏢 Multi-emp:   tenantMiddleware activo ✅`);
        console.log(`🔒 Blacklist:   token_blacklist activa ✅`);
        console.log(`🍪 Cookie:      refreshToken httpOnly ✅`);
        console.log(`🤖 Stability:   ${stability}`);
        console.log(`🔍 Anthropic:   ${anthropic}`);
        console.log(`🎯 Replicate:   ${replicate}`);
        console.log(`🌐 CORS:        ${ALLOWED_ORIGINS.slice(0, 3).join(', ')}`);
        console.log('='.repeat(60));
      }
    });
  } catch (error) {
    logger.error('SERVER_START_FAIL', { event: 'server.start_error', message: error.message });
    console.error('💥 Error al iniciar servidor:', error.message);
    process.exit(1);
  }
};

startServer();
module.exports = app;