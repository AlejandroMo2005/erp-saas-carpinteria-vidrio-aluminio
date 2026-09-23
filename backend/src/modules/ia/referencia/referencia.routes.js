// src/modules/ia/referencia/referencia.routes.js
// Sprint 17 — DT-IA: imágenes de referencia por tipo de trabajo
// 📦 Sprint 20 — Migrado a src/modules/ia/referencia/

'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { subirReferencia, listarReferencias, actualizarReferencia, eliminarReferencia } = require('./referencia.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'), false);
    cb(null, true);
  },
});

// Auth opcional — reutiliza el mismo patrón que ia.routes.js
let requireAuth;
try {
  const { protect } = require('../../../shared/middleware/auth');
  requireAuth = protect;
} catch (_) {
  requireAuth = (_req, _res, next) => next();
}

router.get('/trabajos/:trabajo_id',  requireAuth, listarReferencias);
router.post('/trabajos/:trabajo_id', requireAuth, upload.single('imagen'), subirReferencia);
router.patch('/:id',                 requireAuth, actualizarReferencia);
router.delete('/:id',                requireAuth, eliminarReferencia);

module.exports = router;