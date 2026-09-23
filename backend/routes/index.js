// backend/routes/index.js
// Sprint 19 — Multi-empresa
// ORDEN CORRECTO: protect → tenantMiddleware → router
// protect valida el JWT y pone req.user.
// tenantMiddleware extrae empresa_id de req.user y pone req.empresaId.
// Si protect ya está dentro de cada router también, no hay problema —
// es idempotente: si req.user ya existe lo sobreescribe con el mismo valor.

'use strict';

const logger               = require('../utils/logger');
const { protect }          = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// Shorthand: protect + tenant juntos para todas las rutas protegidas
const secured = [protect, tenantMiddleware];

// ── Importar routers ───────────────────────────────────────────────────────
const authRoutes          = require('./authRoutes');
const materialRoutes      = require('./materialRoutes');
const pedidoRoutes        = require('./pedidoRoutes');
const proformaRoutes      = require('./proformaRoutes');
const trabajoRoutes       = require('./trabajoRoutes');
const colorRoutes         = require('./colorRoutes');
const dashboardRoutes     = require('./dashboardRoutes');
const facturacionRoutes   = require('./facturacionRoutes');
const configuracionRoutes = require('./configuracionRoutes');
const usuarioRoutes       = require('./usuarioRoutes');
const iaRoutes            = require('./iaRoutes');
const proveedorRoutes     = require('./proveedorRoutes');
const referenciaRoutes    = require('./referenciaRoutes');

function mountRoutes(app) {
  // Auth: sin protect ni tenant (login/register/refresh no necesitan token)
  app.use('/api/auth', authRoutes);

  // Rutas protegidas: protect primero, luego tenant, luego el router
  app.use('/api/materiales',    ...secured, materialRoutes);
  app.use('/api/trabajos',      ...secured, trabajoRoutes);
  app.use('/api/pedidos',       ...secured, pedidoRoutes);
  app.use('/api/proformas',     ...secured, proformaRoutes);
  app.use('/api/colores',       ...secured, colorRoutes);
  app.use('/api/dashboard',     ...secured, dashboardRoutes);
  app.use('/api/facturacion',   ...secured, facturacionRoutes);
  app.use('/api/configuracion', ...secured, configuracionRoutes);
  app.use('/api/usuarios',      ...secured, usuarioRoutes);
  app.use('/api/ia',            ...secured, iaRoutes);
  app.use('/api/proveedores',   ...secured, proveedorRoutes);
  app.use('/api/referencias',   ...secured, referenciaRoutes);

  try {
    const clienteRoutes = require('./clienteRoutes');
    app.use('/api/clientes', ...secured, clienteRoutes);
    logger.info('ROUTE_CLIENTES_OK', { event: 'routes.clientes_loaded' });
  } catch {
    logger.warn('CLIENTE_ROUTES_MISSING', { event: 'routes.clienteRoutes_not_found' });
  }

  logger.info('ROUTES_MOUNTED', { event: 'routes.all_mounted' });
}

module.exports = { mountRoutes };