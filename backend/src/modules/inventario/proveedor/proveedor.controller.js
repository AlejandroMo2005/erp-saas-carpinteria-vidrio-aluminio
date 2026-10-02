// src/modules/inventario/proveedor/proveedor.controller.js
// Sprint 11 — Logger Winston + soft delete
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Migrado a src/modules/inventario/proveedor/
//                models/Proveedor       → ./proveedor.repository
//                services/proveedorService → ../../../../services/proveedorService
//                utils/logger           → ../../../../utils/logger
//                utils/softDelete       → ../../../../utils/softDelete
//                config/database        → ../../../../config/database

'use strict';

const Proveedor            = require('./proveedor.repository');
const { generarPlantilla } = require('../../../shared/services/proveedorService');
const logger               = require('../../../shared/utils/logger');
const { softDelete }       = require('../../../shared/utils/softDelete');
const db                   = require('../../../config/database.js');

const ok   = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, msg, status = 500)  => res.status(status).json({ success: false, message: msg });

exports.listar = async (req, res) => {
  try {
    ok(res, await Proveedor.getAll(req.empresaId));
  } catch (e) {
    logger.error('PROVEEDOR_LISTAR', { event: 'proveedor.listar_error', message: e.message });
    fail(res, 'Error al obtener proveedores');
  }
};

exports.obtener = async (req, res) => {
  try {
    const proveedor = await Proveedor.getById(req.params.id, req.empresaId);
    if (!proveedor) return fail(res, 'Proveedor no encontrado', 404);
    ok(res, proveedor);
  } catch (e) {
    logger.error('PROVEEDOR_OBTENER', { event: 'proveedor.obtener_error', proveedorId: req.params.id, message: e.message });
    fail(res, 'Error al obtener proveedor');
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, ciudad, telefono_whatsapp, email, notas, material_ids = [] } = req.body;
    if (!nombre) return fail(res, 'El nombre es requerido', 400);

    const proveedor = await Proveedor.create(
      { nombre, ciudad, telefono_whatsapp, email, notas, empresa_id: req.empresaId },
      material_ids
    );

    logger.info('PROVEEDOR_CREADO', {
      event: 'proveedor.created', proveedorId: proveedor?.id,
      empresaId: req.empresaId, userId: req.user?.id,
    });
    ok(res, proveedor, 201);
  } catch (e) {
    logger.error('PROVEEDOR_CREAR', { event: 'proveedor.crear_error', message: e.message, userId: req.user?.id });
    fail(res, 'Error al crear proveedor');
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre, ciudad, telefono_whatsapp, email, notas, material_ids = [] } = req.body;
    if (!nombre) return fail(res, 'El nombre es requerido', 400);

    const proveedor = await Proveedor.update(
      req.params.id,
      { nombre, ciudad, telefono_whatsapp, email, notas },
      material_ids,
      req.empresaId
    );

    logger.info('PROVEEDOR_ACTUALIZADO', {
      event: 'proveedor.updated', proveedorId: req.params.id,
      empresaId: req.empresaId, userId: req.user?.id,
    });
    ok(res, proveedor);
  } catch (e) {
    logger.error('PROVEEDOR_ACTUALIZAR', { event: 'proveedor.actualizar_error', proveedorId: req.params.id, message: e.message, userId: req.user?.id });
    fail(res, 'Error al actualizar proveedor');
  }
};

exports.eliminar = async (req, res) => {
  try {
    const [check] = await db.query(
      'SELECT id FROM proveedores WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1',
      [req.params.id, req.empresaId]
    );
    if (!check.length) return fail(res, 'Proveedor no encontrado', 404);

    await softDelete(db, 'proveedores', req.params.id);

    logger.info('PROVEEDOR_ELIMINADO', {
      event: 'proveedor.deleted', proveedorId: req.params.id,
      empresaId: req.empresaId, userId: req.user?.id,
    });
    ok(res, { message: 'Proveedor eliminado' });
  } catch (e) {
    logger.error('PROVEEDOR_ELIMINAR', { event: 'proveedor.eliminar_error', proveedorId: req.params.id, message: e.message, userId: req.user?.id });
    fail(res, 'Error al eliminar proveedor');
  }
};

exports.alertasStock = async (req, res) => {
  try {
    const alertas = await Proveedor.getAlertasStock(req.empresaId);
    if (Array.isArray(alertas) && alertas.length > 0) {
      alertas.forEach(a => {
        const nombre = a.color ? `${a.material} - ${a.color}` : a.material;
        logger.stockLow(a.material_id, nombre, a.stock, a.stock_minimo);
      });
    }
    ok(res, alertas);
  } catch (e) {
    logger.error('PROVEEDOR_ALERTAS_STOCK', { event: 'proveedor.alertasStock_error', message: e.message });
    fail(res, 'Error al obtener alertas de stock');
  }
};

exports.generarSolicitud = async (req, res) => {
  try {
    const { proveedor_id, items } = req.body;
    if (!proveedor_id || !items?.length)
      return fail(res, 'proveedor_id e items son requeridos', 400);

    for (const item of items) {
      if (!item.nombre_material || !item.cantidad)
        return fail(res, 'Cada item requiere nombre_material y cantidad', 400);
    }

    const proveedor = await Proveedor.getById(proveedor_id, req.empresaId);
    if (!proveedor) return fail(res, 'Proveedor no encontrado', 404);

    const itemsNormalizados = items.map(item => ({
      material_id:     item.material_id     ?? null,
      variante_id:     item.variante_id     ?? null,
      nombre_material: item.nombre_material,
      color:           item.color           ?? null,
      cantidad:        Number(item.cantidad),
      unidad:          item.unidad          ?? 'unidad',
    }));

    const plantilla_texto = generarPlantilla(proveedor.nombre, itemsNormalizados);
    const usuario_id      = req.user?.id ?? null;

    const solicitud = await Proveedor.createSolicitud(
      { proveedor_id, usuario_id, plantilla_texto, empresa_id: req.empresaId },
      itemsNormalizados
    );

    logger.info('SOLICITUD_GENERADA', {
      event: 'proveedor.solicitud_generada', solicitudId: solicitud?.id,
      proveedorId: proveedor_id, empresaId: req.empresaId,
      userId: usuario_id, items: itemsNormalizados.length,
    });

    ok(res, { solicitud_id: solicitud.id, plantilla_texto, telefono_whatsapp: proveedor.telefono_whatsapp }, 201);
  } catch (e) {
    logger.error('PROVEEDOR_GENERAR_SOLICITUD', { event: 'proveedor.generarSolicitud_error', message: e.message, userId: req.user?.id });
    fail(res, 'Error al generar solicitud: ' + e.message);
  }
};

exports.marcarEnviada = async (req, res) => {
  try {
    ok(res, await Proveedor.marcarEnviada(req.params.id));
  } catch (e) {
    logger.error('PROVEEDOR_MARCAR_ENVIADA', { event: 'proveedor.marcarEnviada_error', solicitudId: req.params.id, message: e.message });
    fail(res, 'Error al marcar solicitud');
  }
};

exports.historialSolicitudes = async (req, res) => {
  try {
    ok(res, await Proveedor.getSolicitudes(req.empresaId));
  } catch (e) {
    logger.error('PROVEEDOR_HISTORIAL', { event: 'proveedor.historial_error', message: e.message });
    fail(res, 'Error al obtener historial');
  }
};

exports.getMateriales = async (req, res) => {
  try {
    ok(res, await Proveedor.getMateriales(req.empresaId));
  } catch (e) {
    logger.error('PROVEEDOR_GET_MATERIALES', { event: 'proveedor.getMateriales_error', message: e.message });
    fail(res, 'Error al obtener materiales');
  }
};