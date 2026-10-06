// src/modules/cliente/cliente.controller.js
// Sprint 10 — seguridad + endpoints para rol CLIENTE
// Sprint 13 — GET /clientes?busqueda= (nombre O teléfono)
// Sprint 20 — migrado a src/modules/cliente/
// Sprint 21 — empresa_id agregado a todas las queries (fix multi-empresa)
//             imports actualizados a src/config/ y src/shared/utils/

'use strict';

const db     = require('../../config/database.js');
const logger = require('../../shared/utils/logger');

function sanitizeHTML(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// GET /api/clientes?busqueda=XXX&limite=8
exports.listar = async (req, res) => {
  try {
    const { busqueda = '', limite = 8 } = req.query;
    const lim = Math.min(Number.parseInt(limite) || 8, 50);

    if (!busqueda.trim() || busqueda.trim().length < 2)
      return res.status(200).json({ success: true, data: [] });

    const term = `%${busqueda.trim()}%`;
    const [rows] = await db.query(
      `SELECT id, nombre, telefono
       FROM clientes
       WHERE empresa_id = ? AND activo = 1
         AND (nombre LIKE ? OR telefono LIKE ?)
       ORDER BY nombre ASC LIMIT ?`,
      [req.empresaId, term, term, lim]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(c => ({
        id:       c.id,
        nombre:   sanitizeHTML(c.nombre),
        telefono: sanitizeHTML(c.telefono),
      })),
    });
  } catch (error) {
    logger.error('CLIENTE_LISTAR_ERROR', { event: 'clientes.listar_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, message: 'Error al buscar clientes' });
  }
};

// GET /api/clientes/buscar?telefono=XXX (legacy)
exports.buscarPorTelefono = async (req, res) => {
  try {
    const { telefono } = req.query;
    if (!telefono?.trim())
      return res.status(400).json({ success: false, message: 'Teléfono es requerido' });

    const [rows] = await db.query(
      `SELECT * FROM clientes
       WHERE empresa_id = ? AND telefono LIKE ? AND activo = 1
       LIMIT 20`,
      [req.empresaId, `%${telefono.trim()}%`]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(c => ({ ...c, nombre: sanitizeHTML(c.nombre), telefono: sanitizeHTML(c.telefono) })),
    });
  } catch (error) {
    logger.error('CLIENTE_BUSCAR_TELEFONO_ERROR', { event: 'clientes.buscarTelefono_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, message: 'Error al buscar cliente' });
  }
};

// POST /api/clientes
exports.crear = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    if (!nombre?.trim())   return res.status(400).json({ success: false, message: 'Nombre es requerido' });
    if (!telefono?.trim()) return res.status(400).json({ success: false, message: 'Teléfono es requerido' });

    const nombreLimpio   = sanitizeHTML(nombre.trim());
    const telefonoLimpio = sanitizeHTML(telefono.trim());

    // Unicidad por teléfono DENTRO de la empresa — distintas empresas pueden tener el mismo teléfono
    const [existe] = await db.query(
      'SELECT id FROM clientes WHERE empresa_id = ? AND telefono = ?',
      [req.empresaId, telefonoLimpio]
    );
    if (existe.length > 0)
      return res.status(409).json({ success: false, message: 'Ya existe un cliente con ese teléfono' });

    const [result] = await db.query(
      `INSERT INTO clientes (empresa_id, nombre, telefono, activo, created_at, updated_at)
       VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [req.empresaId, nombreLimpio, telefonoLimpio]
    );

    logger.info('CLIENTE_CREADO', { event: 'clientes.creado', clienteId: result.insertId, nombre: nombreLimpio, userId: req.user?.id, empresaId: req.empresaId });
    return res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      data:    { id: result.insertId, nombre: nombreLimpio, telefono: telefonoLimpio },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Ya existe un cliente con ese teléfono' });
    logger.error('CLIENTE_CREAR_ERROR', { event: 'clientes.crear_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, message: 'Error al crear cliente' });
  }
};

// GET /api/clientes/mis-datos (solo rol CLIENTE)
exports.getMisDatos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.nombre, c.telefono, c.activo, c.created_at
       FROM clientes c
       WHERE c.empresa_id = ?
         AND c.telefono = (SELECT u.telefono FROM usuarios u WHERE u.id = ? LIMIT 1)
         AND c.activo = 1
       LIMIT 1`,
      [req.empresaId, req.user.id]
    );

    if (rows.length === 0)
      return res.json({ success: true, data: { nombre: req.user.nombre, telefono: null, vinculado: false } });

    return res.json({ success: true, data: { ...rows[0], vinculado: true } });
  } catch (error) {
    logger.error('CLIENTE_MIS_DATOS_ERROR', { event: 'clientes.getMisDatos_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, message: 'Error al obtener tus datos' });
  }
};

// PUT /api/clientes/mis-datos (solo rol CLIENTE)
exports.updateMisDatos = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    if (!nombre?.trim() && !telefono?.trim())
      return res.status(400).json({ success: false, message: 'Debes enviar al menos nombre o teléfono para actualizar' });

    const campos = [], valores = [];
    if (nombre?.trim())   { campos.push('nombre = ?');   valores.push(sanitizeHTML(nombre.trim())); }
    if (telefono?.trim()) { campos.push('telefono = ?'); valores.push(sanitizeHTML(telefono.trim())); }
    campos.push('updated_at = NOW()');
    const [resultado] = await db.query(
      `UPDATE clientes SET ${campos.join(', ')}
       WHERE empresa_id = ?
         AND telefono = (SELECT telefono FROM usuarios WHERE id = ? LIMIT 1)
         AND activo = 1`,
      [...valores, req.empresaId, req.user.id]
    );
    if (resultado.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'No se encontró tu registro de cliente para actualizar' });

    return res.json({ success: true, message: 'Tus datos han sido actualizados correctamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Ese teléfono ya está registrado por otro cliente' });
    logger.error('CLIENTE_UPDATE_ERROR', { event: 'clientes.updateMisDatos_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, message: 'Error al actualizar tus datos' });
  }
};
