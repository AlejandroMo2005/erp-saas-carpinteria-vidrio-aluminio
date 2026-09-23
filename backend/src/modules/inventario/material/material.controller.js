// src/modules/inventario/material/material.controller.js
// Sprint 11 — Logger Winston + soft delete + alerta stock bajo
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Migrado a src/modules/inventario/material/
//                models/Material  → ./material.repository
//                utils/logger     → ../../../../utils/logger
//                utils/softDelete → ../../../../utils/softDelete
//                config/database  → ../../../../config/database

'use strict';

const Material           = require('./material.repository');
const logger             = require('../../../../utils/logger');
const { softDelete }     = require('../../../../utils/softDelete');
const db                 = require('../../../../config/database');

const STOCK_BAJO_UMBRAL = 5;

exports.getConColores = async (req, res) => {
  try {
    const materiales = await Material.getConColores(req.empresaId);
    res.json({ success: true, data: materiales });
  } catch (err) {
    logger.error('MATERIAL_GET_CON_COLORES', { event: 'material.getConColores_error', message: err.message });
    res.status(500).json({ success: false, message: 'Error al obtener materiales' });
  }
};

exports.getAllMateriales = async (req, res) => {
  try {
    const materiales = await Material.getAll(req.empresaId);
    res.json({ success: true, data: materiales });
  } catch (err) {
    logger.error('MATERIAL_GET_ALL', { event: 'material.getAll_error', message: err.message });
    res.status(500).json({ success: false, message: 'Error al obtener materiales' });
  }
};

exports.updateVariante = async (req, res) => {
  try {
    const { id }            = req.params;
    const { stock, precio } = req.body;

    await Material.updateVarianteInfo(id, stock, precio);
    const variante = await Material.getById(id);

    if (variante) {
      const [check] = await db.query(
        'SELECT id FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
        [variante.material_id, req.empresaId]
      );
      if (!check.length)
        return res.status(403).json({ success: false, message: 'Material no pertenece a esta empresa' });

      await Material.updateBasePrice(variante.material_id, precio, req.empresaId);

      const stockNum = Number(stock);
      if (Number.isFinite(stockNum) && stockNum <= STOCK_BAJO_UMBRAL) {
        logger.stockLow(variante.material_id, variante.nombre || `Variante #${id}`, stockNum, STOCK_BAJO_UMBRAL);
      }

      logger.info('MATERIAL_UPDATE_VARIANTE', {
        event: 'material.variante_updated', varianteId: id,
        materialId: variante.material_id, stock: stockNum, precio,
        empresaId: req.empresaId, userId: req.user?.id,
      });

      res.json({ success: true, message: 'Sincronización completa. Variante y Material base actualizados.' });
    } else {
      res.status(404).json({ success: false, message: 'No se encontró la variante para sincronizar.' });
    }
  } catch (err) {
    logger.error('MATERIAL_UPDATE_VARIANTE_ERROR', {
      event: 'material.updateVariante_error', varianteId: req.params.id,
      message: err.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al actualizar variante' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.query(
      'SELECT id FROM materiales WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1',
      [id, req.empresaId]
    );
    if (!check.length)
      return res.status(404).json({ success: false, message: 'Material no encontrado' });

    await softDelete(db, 'materiales', id);

    logger.info('MATERIAL_SOFT_DELETE', {
      event: 'material.deleted', materialId: id,
      empresaId: req.empresaId, userId: req.user?.id,
    });
    res.json({ success: true, message: 'Material eliminado correctamente' });
  } catch (err) {
    logger.error('MATERIAL_DELETE_ERROR', {
      event: 'material.delete_error', materialId: req.params.id,
      message: err.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al eliminar material' });
  }
};