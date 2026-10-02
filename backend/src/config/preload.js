// backend/config/preload.js
// Sprint 15 — Link preload JS crítico desde dist/assets (Vite)
// Sprint 18.1 — vendor-react, vendor-query, vendor-axios

'use strict';

const fs     = require('fs');
const path   = require('path');
const logger = require('../src/shared/utils/logger');

const buildPath = path.join(__dirname, '../../dist');

const CRITICAL_JS = [
  { prefix: 'vendor-react-', priority: 'high' },
  { prefix: 'vendor-query-', priority: 'auto' },
  { prefix: 'vendor-axios-', priority: 'auto' },
];

function buildPreloadHeaders() {
  const headers = [];

  try {
    const assetsDir = path.join(buildPath, 'assets');
    if (!fs.existsSync(assetsDir)) return headers;

    const files = fs.readdirSync(assetsDir);

    for (const { prefix, priority } of CRITICAL_JS) {
      const file = files.find(f => f.startsWith(prefix) && f.endsWith('.js'));
      if (!file) continue;

      headers.push(
        priority === 'high'
          ? `</assets/${file}>; rel=modulepreload; crossorigin; fetchpriority=high`
          : `</assets/${file}>; rel=modulepreload; crossorigin`
      );
    }

    logger.info('PRELOAD_HEADERS_LOADED', {
      event:   'preload.vite_ok',
      headers: headers.length,
      hints:   headers,
    });
  } catch {
    logger.warn('DIST_NOT_FOUND', {
      event: 'preload.dist_missing',
      note:  'Normal en desarrollo. Ejecuta npm run build para activar preload hints.',
    });
  }

  return headers;
}

// Se construye una sola vez al arrancar el servidor
const PRELOAD_LINK_HEADERS = buildPreloadHeaders();

module.exports = { PRELOAD_LINK_HEADERS, buildPath };