// backend/server.js
// Sprint 20 — Punto de entrada del servidor

'use strict';

// Atrapar cualquier error no manejado ANTES de que mate el proceso
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION:', err);
});

require('dotenv').config();

const cluster = require('cluster');

const db = require('./src/config/database.js');
const logger = require('./src/shared/utils/logger');
const {
  PRELOAD_LINK_HEADERS,
} = require('./src/config/preload');
const {
  ALLOWED_ORIGINS,
} = require('./src/config/cors');

const app = require('./app');

const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';
const WORKER_ID = cluster.isWorker
  ? `worker-${cluster.worker.id}`
  : 'primary';

// ═══════════════════════════════════════════════════════════════════════════
// ARRANQUE
// ═══════════════════════════════════════════════════════════════════════════
const startServer = async () => {
  try {
    await db.testConnection();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info('SERVIDOR_INICIADO', {
        event: 'server.start',
        puerto: PORT,
        version: '1.23.0',
        entorno: process.env.NODE_ENV || 'development',
        worker: WORKER_ID,
        preload_hints: PRELOAD_LINK_HEADERS.length,
      });

      if (!IS_PROD) {
        const stability =
          process.env.STABILITY_API_KEY
            ? '✅ v2beta activo'
            : '⚠️  mock activo';

        const anthropic =
          process.env.ANTHROPIC_API_KEY
            ? '✅ Claude Vision activo'
            : '⚠️  descriptores manuales';

        const replicate =
          process.env.REPLICATE_API_TOKEN
            ? '✅ SAM activo'
            : '⚠️  mock activo';

        console.log('='.repeat(60));
        console.log('🚀 SERVIDOR INICIADO — Sprint 20');
        console.log(`📍 Puerto:      ${PORT}`);
        console.log(`🔗 URL:         http://localhost:${PORT}`);
        console.log('📂 Módulos:     src/modules/ ✅');
        console.log('🏢 Multi-emp:   tenantMiddleware activo ✅');
        console.log('🔒 Blacklist:   token_blacklist activa ✅');
        console.log('🍪 Cookie:      refreshToken httpOnly ✅');
        console.log(`🤖 Stability:   ${stability}`);
        console.log(`🔍 Anthropic:   ${anthropic}`);
        console.log(`🎯 Replicate:   ${replicate}`);
        console.log(
          `🌐 CORS:        ${ALLOWED_ORIGINS.slice(0, 3).join(', ')}`
        );
        console.log('='.repeat(60));
      }
    });
  } catch (error) {
    logger.error('SERVER_START_FAIL', {
      event: 'server.start_error',
      message: error.message,
    });

    console.error(
      '💥 Error al iniciar servidor:',
      error.message
    );

    process.exit(1);
  }
};

startServer();