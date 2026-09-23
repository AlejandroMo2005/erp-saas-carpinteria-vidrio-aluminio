// routes/iaRoutes.js
// Sprint 8  — POST /inpaint (HF) con validación Zod
// Sprint 17 — DT-07: validación Zod en POST /inpaint
// Sprint 17 — DT-IA: GET  /visualizar/trabajos/:id/colores
//                    POST /visualizar (Stability AI, multipart)
// Sprint 18 — DT-IA-07: POST /mascara-auto (SAM via Replicate)

'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { inpaint, getTrabajoConColores, visualizarEspacio, mascaraAuto } = require('../controllers/iaController');
const { validateBody }    = require('../middleware/validateZod');
const { inpaintSchema, visualizarSchema } = require('../validators/ia.validators');

// ── Log de diagnóstico ────────────────────────────────────────────────────
router.use((req, res, next) => {
  console.log(`[IA] ${req.method} ${req.path} — content-type: ${req.headers['content-type'] ?? 'none'}`);
  next();
});

// ── Autenticación ─────────────────────────────────────────────────────────
let optionalAuth;
try {
  const { protect } = require('../middleware/auth');
  optionalAuth = (req, res, next) => {
    if (!req.headers.authorization) return next();
    protect(req, res, (err) => {
      if (err) req.user = null;
      next();
    });
  };
} catch (_) {
  optionalAuth = (req, res, next) => next();
}

// ── Multer: memoria, solo imágenes, máx 10 MB ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'), false);
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/ia/inpaint  (Sprint 8)
// ─────────────────────────────────────────────────────────────────────────
router.post('/inpaint',
  optionalAuth,
  validateBody(inpaintSchema),
  inpaint
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ia/visualizar/trabajos/:id/colores
// ─────────────────────────────────────────────────────────────────────────
router.get('/visualizar/trabajos/:id/colores',
  optionalAuth,
  getTrabajoConColores
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/ia/visualizar  (Stability AI)
// ─────────────────────────────────────────────────────────────────────────
router.post('/visualizar',
  optionalAuth,
  upload.fields([
    { name: 'imagen',  maxCount: 1 },
    { name: 'mascara', maxCount: 1 },
  ]),
  validateBody(visualizarSchema),
  visualizarEspacio
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/ia/mascara-auto  (Sprint 18 — SAM via Replicate)
// ─────────────────────────────────────────────────────────────────────────
router.post('/mascara-auto',
  optionalAuth,
  upload.fields([{ name: 'imagen', maxCount: 1 }]),
  mascaraAuto
);

module.exports = router;