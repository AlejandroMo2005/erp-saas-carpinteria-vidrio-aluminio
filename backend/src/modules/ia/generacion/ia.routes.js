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
  console.log(`[IA] ${req.method} ${req.path} — content-type: ${req.headers['content-type'] ?? 'none'}`);
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

// ── Multer: memoria, solo imágenes, máx 10 MB ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
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