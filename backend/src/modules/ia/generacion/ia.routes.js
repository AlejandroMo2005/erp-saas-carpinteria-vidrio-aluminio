// src/modules/ia/generacion/ia.routes.js
// Sprint 8  — POST /inpaint
// Sprint 17 — DT-IA: visualizar + trabajos/:id/colores
// Sprint 18 — DT-IA-07: mascara-auto SAM
// 📦 Sprint 20 — Migrado a src/modules/ia/generacion/
//                controller  → ./ia.controller
//                middleware  → ../../../shared/middleware/{auth,validateZod}
//                validators  → ../../../shared/validators/ia.validators

'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { inpaint, getTrabajoConColores, visualizarEspacio, mascaraAuto } = require('./ia.controller');
const { validateBody } = require('../../../shared/middleware/validateZod');
const { inpaintSchema, visualizarSchema } = require('../../../shared/validators/ia.validators');

// ── Log de diagnóstico ────────────────────────────────────────────────────
router.use((req, res, next) => {
  const metodo = String(req.method).replace(/[\r\n]/g, '');
  const ruta = String(req.path).replace(/[\r\n]/g, '');
  const contentType = String(req.headers['content-type'] ?? 'none').replace(/[\r\n]/g, '');

  console.log(`[IA] ${metodo} ${ruta} — content-type: ${contentType}`);
  next();
});

// ── Auth opcional (el protect ya se aplicó en modules/index.js) ───────────
// Se conserva el helper optionalAuth interno para mantener compatibilidad
// con la lógica original de iA que permite req.user = null si no hay token.
let optionalAuth;
try {
  const { protect } = require('../../../shared/middleware/auth');
  optionalAuth = (req, res, next) => {
    if (!req.headers.authorization) return next();
    protect(req, res, (err) => { if (err) req.user = null; next(); });
  };
} catch (_) {
  optionalAuth = (req, res, next) => next();
}

// ── Multer: memoria, solo imágenes, máx 5 MB ──────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo se permiten archivos de imagen'), false);
    cb(null, true);
  },
});

router.post('/inpaint',
  optionalAuth,
  validateBody(inpaintSchema),
  inpaint
);

router.get('/visualizar/trabajos/:id/colores',
  optionalAuth,
  getTrabajoConColores
);

router.post('/visualizar',
  optionalAuth,
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'mascara', maxCount: 1 }]),
  validateBody(visualizarSchema),
  visualizarEspacio
);

router.post('/mascara-auto',
  optionalAuth,
  upload.fields([{ name: 'imagen', maxCount: 1 }]),
  mascaraAuto
);

module.exports = router;
