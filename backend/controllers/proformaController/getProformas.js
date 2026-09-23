// backend/controllers/proformaController/getProformas.js
// Sprint 10 — Filtrado por rol
// Sprint 11 — Logger Winston + soft delete
// Sprint 19 — empresa_id en todos los SELECT

'use strict';

const database = require('../../config/database');
const logger   = require('../../utils/logger');

// ═══════════════════════════════════════════════════════
// GET /api/proformas
// ═══════════════════════════════════════════════════════
exports.getAllProformas = async (req, res) => {
  try {
    const { soloPropio, usuarioId } = req.filtroUsuario || {};
    let rows;

    if (soloPropio) {
      [rows] = await database.query(
        `SELECT * FROM proformas
         WHERE empresa_id = ? AND usuario_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [req.empresaId, usuarioId]
      );
    } else {
      [rows] = await database.query(
        `SELECT * FROM proformas
         WHERE empresa_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [req.empresaId]
      );
    }

    res.json(rows);
  } catch (error) {
    logger.error('PROFORMA_GET_ALL', {
      event:   'proforma.getAll_error',
      message: error.message,
      userId:  req.user?.id,
    });
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/proformas/search — solo ADMIN/VENDEDOR
// ═══════════════════════════════════════════════════════
exports.searchByCliente = async (req, res) => {
  try {
    const [rows] = await database.query(
      `SELECT * FROM proformas
       WHERE empresa_id = ? AND cliente LIKE ? AND deleted_at IS NULL`,
      [req.empresaId, `%${req.query.cliente || ''}%`]
    );
    res.json(rows);
  } catch (error) {
    logger.error('PROFORMA_SEARCH', {
      event:   'proforma.search_error',
      message: error.message,
      userId:  req.user?.id,
    });
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/proformas/:id — CLIENTE solo la suya
// ═══════════════════════════════════════════════════════
exports.getProformaById = async (req, res) => {
  try {
    const { soloPropio, usuarioId } = req.filtroUsuario || {};
    let rows;

    if (soloPropio) {
      [rows] = await database.query(
        `SELECT * FROM proformas
         WHERE id = ? AND empresa_id = ? AND usuario_id = ? AND deleted_at IS NULL`,
        [req.params.id, req.empresaId, usuarioId]
      );
    } else {
      [rows] = await database.query(
        `SELECT * FROM proformas
         WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
        [req.params.id, req.empresaId]
      );
    }

    if (!rows?.length) {
      return res.status(404).json({ success: false, message: 'Proforma no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error('PROFORMA_GET_BY_ID', {
      event:      'proforma.getById_error',
      proformaId: req.params.id,
      message:    error.message,
      userId:     req.user?.id,
    });
    res.status(500).json({ error: error.message });
  }
};