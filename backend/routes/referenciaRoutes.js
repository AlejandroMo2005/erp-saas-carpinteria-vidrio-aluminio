// routes/referenciaRoutes.js
// Sprint 17 — DT-IA: Rutas para imágenes de referencia por tipo de trabajo

'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const {
  subirReferencia,
  listarReferencias,
  actualizarReferencia,
  eliminarReferencia,
} = require('../controllers/referenciaController');

// Multer: memoria, solo imágenes, máx 8 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo imágenes'), false);
    }
    cb(null, true);
  },
});

// Autenticación — reutilizar el mismo helper que iaRoutes
let requireAuth;
try {
  const { protect } = require('../middleware/auth');
  requireAuth = protect;
} catch (_) {
  // Sin middleware auth (dev) — todas las rutas son libres
  requireAuth = (_req, _res, next) => next();
}

// ─── Rutas ───────────────────────────────────────────────────────────────────

// Listar referencias de un trabajo
router.get('/trabajos/:trabajo_id', requireAuth, listarReferencias);

// Subir nueva referencia + auto-describir con Claude Vision
router.post('/trabajos/:trabajo_id', requireAuth, upload.single('imagen'), subirReferencia);

// Actualizar descriptores / peso / estado de una referencia
router.patch('/:id', requireAuth, actualizarReferencia);

// Eliminar referencia (BD + disco)
router.delete('/:id', requireAuth, eliminarReferencia);

module.exports = router;