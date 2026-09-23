// src/modules/index.js
// Sprint 19 — multi-empresa: protect → tenantMiddleware → router
// Sprint 20 — reemplaza routes/index.js
// Sprint 21 — paths corregidos a src/shared/:
//               ../../utils/logger      → ../shared/utils/logger
//               ../../middleware/auth   → ../shared/middleware/auth
//               ../../middleware/tenant → ../shared/middleware/tenant

'use strict';

const path   = require('path');
const logger = require('../shared/utils/logger');

function loadModule(relPath) {
  const full = path.resolve(__dirname, relPath);
  try {
    return require(full);
  } catch (err) {
    console.error('\n❌ ERROR cargando módulo:', full);
    console.error('   Motivo:', err.message, '\n');
    throw err;
  }
}

function registerRoutes(app) {
  const { protect }          = require('../shared/middleware/auth');
  const { tenantMiddleware } = require('../shared/middleware/tenant');
  const secured              = [protect, tenantMiddleware];

  // ── Auth (sin protect ni tenant) ──────────────────────────────────────
  app.use('/api/auth',          loadModule('./auth/auth.routes'));

  // ── Usuarios / Clientes ───────────────────────────────────────────────
  app.use('/api/usuarios',      ...secured, loadModule('./usuario/usuario.routes'));
  app.use('/api/clientes',      ...secured, loadModule('./cliente/cliente.routes'));

  // ── Inventario ────────────────────────────────────────────────────────
  app.use('/api/proveedores',   ...secured, loadModule('./inventario/proveedor/proveedor.routes'));
  app.use('/api/materiales',    ...secured, loadModule('./inventario/material/material.routes'));
  app.use('/api/colores',       ...secured, loadModule('./inventario/color/color.routes'));

  // ── Comercial ─────────────────────────────────────────────────────────
  app.use('/api/trabajos',      ...secured, loadModule('./comercial/trabajo/trabajo.routes'));
  app.use('/api/pedidos',       ...secured, loadModule('./comercial/pedido/pedido.routes'));
  app.use('/api/proformas',     ...secured, loadModule('./comercial/proforma/proforma.routes'));
  app.use('/api/facturacion',   ...secured, loadModule('./comercial/facturacion/facturacion.routes'));

  // ── Dashboard ─────────────────────────────────────────────────────────
  app.use('/api/dashboard',     ...secured, loadModule('./dashboard/dashboard.routes'));

  // ── Configuración ─────────────────────────────────────────────────────
  app.use('/api/configuracion', ...secured, loadModule('./configuracion/configuracion.routes'));

  // ── IA ────────────────────────────────────────────────────────────────
  app.use('/api/ia',            ...secured, loadModule('./ia/generacion/ia.routes'));
  app.use('/api/referencias',   ...secured, loadModule('./ia/referencia/referencia.routes'));

  logger.info('ROUTES_MOUNTED', { event: 'routes.all_mounted' });
}

module.exports = { registerRoutes };