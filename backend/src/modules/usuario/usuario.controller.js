```js
// src/modules/usuario/usuario.controller.js
// Sprint 7  — Perfil de usuario + autocompletado en Proformas
// Sprint 11 — Logger Winston + soft delete
// Sprint 19 — empresa_id en queries de admin (usuarios de la misma empresa)
// 📦 Sprint 20 — Migrado a src/modules/usuario/
//                models/Usuario → ./usuario.repository
//                utils/logger   → ../../../utils/logger
//                utils/softDelete → ../../../utils/softDelete
//                config/database  → ../../../config/database

'use strict';

const Usuario    = require('./usuario.repository');
const logger     = require('../../shared/utils/logger');
const db         = require('../../config/database.js');

function validarCedulaRuc(valor) {
  if (!valor) return true;
  const limpio = valor.trim();
  if (!/^\d{10}$/.test(limpio) && !/^\d{13}$/.test(limpio)) return false;
  if (limpio.length === 13 && !limpio.endsWith('001')) return false;
  return true;
}

const ROLES_VALIDOS = ['ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE'];

// ─────────────────────────────────────────────────────
// GET /api/usuarios/me
// ─────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const usuario = await Usuario.getById(req.user.id);
    if (!usuario)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    logger.error('USUARIO_GET_ME', {
      event: 'usuario.getMe_error', userId: req.user?.id, message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al obtener el perfil' });
  }
};

// ─────────────────────────────────────────────────────
// PUT /api/usuarios/me
// ─────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const { password, passwordActual, cedula_ruc, email, ...resto } = req.body;

    if (cedula_ruc !== undefined && !validarCedulaRuc(cedula_ruc))
      return res.status(400).json({ success: false, message: 'cedula_ruc debe ser cédula (10) o RUC (13) ecuatoriano' });

    if (email !== undefined && email !== '' && !/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(email))
      return res.status(400).json({ success: false, message: 'El formato del email no es válido' });

    let newPasswordPlain = null;
    if (password) {
      if (!passwordActual)
        return res.status(400).json({ success: false, message: 'Debes proporcionar tu contraseña actual para cambiarla' });

      const usuarioConHash = await Usuario.getByEmail(req.user.email);
      const esValida = await Usuario.validatePassword(passwordActual, usuarioConHash.password);
      if (!esValida)
        return res.status(400).json({ success: false, message: 'La contraseña actual no es correcta' });
      if (password.length < 6)
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });

      newPasswordPlain = password;
    }

    const datosActualizar = { ...resto };
    if (cedula_ruc !== undefined) datosActualizar.cedula_ruc = cedula_ruc;
    if (email      !== undefined) datosActualizar.email      = email;

    const usuarioActualizado = await Usuario.updatePerfil(req.user.id, datosActualizar, newPasswordPlain);

    if (newPasswordPlain)
      logger.info('USUARIO_PASSWORD_CHANGED', { event: 'usuario.password_changed', userId: req.user.id });

    return res.status(200).json({
      success: true, message: 'Perfil actualizado correctamente', data: usuarioActualizado,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const campo = error.message.includes('email') ? 'email' : 'cédula/RUC';
      return res.status(409).json({ success: false, message: `El ${campo} ya está registrado en otra cuenta` });
    }
    logger.error('USUARIO_UPDATE_ME', {
      event: 'usuario.updateMe_error', userId: req.user?.id, message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al actualizar el perfil' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/usuarios/buscar?q=texto
// ─────────────────────────────────────────────────────
exports.buscarClientes = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2)
      return res.status(400).json({ success: false, message: 'El parámetro "q" debe tener al menos 2 caracteres' });

    const limite   = Math.min(Number.parseInt(req.query.limite) || 10, 20);
    const clientes = await Usuario.findByNombre(q, { limite, empresaId: req.empresaId });

    return res.status(200).json({ success: true, data: clientes });
  } catch (error) {
    logger.error('USUARIO_BUSCAR', {
      event: 'usuario.buscarClientes_error', userId: req.user?.id, message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error en la búsqueda de clientes' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/usuarios — solo ADMIN
// Sprint 19: solo usuarios de la misma empresa
// ─────────────────────────────────────────────────────
exports.getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, nombre_completo, email, rol, activo, created_at
       FROM usuarios
       WHERE empresa_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [req.empresaId]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('USUARIO_GET_ALL', { event: 'usuario.getAll_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

// ─────────────────────────────────────────────────────
// POST /api/usuarios — solo ADMIN
// Sprint 19: nuevo usuario hereda empresa_id del admin
// ─────────────────────────────────────────────────────
exports.createUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol)
      return res.status(400).json({ success: false, message: 'nombre, email, password y rol son obligatorios' });

    if (!ROLES_VALIDOS.includes(rol))
      return res.status(400).json({ success: false, message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });

    const existe = await Usuario.getByEmail(email);
    if (existe)
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });

    const id      = await Usuario.create({ nombre, email, password, rol, activo: 1, empresa_id: req.empresaId });
    const usuario = await Usuario.getById(id);

    logger.info('USUARIO_CREATED', {
      event: 'usuario.created', nuevoId: id, rol,
      empresaId: req.empresaId, creadoPor: req.user?.id,
    });

    return res.status(201).json({ success: true, message: 'Usuario creado correctamente', data: usuario });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });
    logger.error('USUARIO_CREATE', {
      event: 'usuario.create_error', message: error.message, userId: req.user?.id,
    });
    return res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
};

// ─────────────────────────────────────────────────────
// PUT /api/usuarios/:id/rol — solo ADMIN
// Sprint 19: verifica que el usuario pertenece a la empresa
// ─────────────────────────────────────────────────────
exports.updateRol = async (req, res) => {
  try {
    const { id }  = req.params;
    const { rol } = req.body;

    if (!ROLES_VALIDOS.includes(rol))
      return res.status(400).json({ success: false, message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` });

    if (Number.parseInt(id) === req.user.id && rol !== 'ADMIN')
      return res.status(400).json({ success: false, message: 'No puedes cambiar tu propio rol de ADMIN' });

    // Sprint 19: solo usuarios de la misma empresa
    const [check] = await db.query(
      'SELECT id FROM usuarios WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1',
      [id, req.empresaId]
    );
    if (!check.length)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    await db.query('UPDATE usuarios SET rol = ? WHERE id = ? AND empresa_id = ?', [rol, id, req.empresaId]);
    await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [id]);
    await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [id]);

    logger.info('USUARIO_ROL_UPDATED', {
      event: 'usuario.rol_updated', targetId: id,
      nuevoRol: rol, cambiadoPor: req.user?.id,
    });

    return res.json({
      success: true,
      message: `Rol actualizado a ${rol}. El usuario deberá iniciar sesión nuevamente.`,
    });
  } catch (error) {
    logger.error('USUARIO_UPDATE_ROL', {
      event: 'usuario.updateRol_error', targetId: req.params.id,
      message: error.message, userId: req.user?.id,
    });
    return res.status(500).json({ success: false, message: 'Error al actualizar rol' });
  }
};

// ─────────────────────────────────────────────────────
// PUT /api/usuarios/:id/activo — solo ADMIN
// Sprint 19: verifica que el usuario pertenece a la empresa
// ─────────────────────────────────────────────────────
exports.toggleActivo = async (req, res) => {
  try {
    const { id }     = req.params;
    const { activo } = req.body;

    if (activo === undefined)
      return res.status(400).json({ success: false, message: 'Campo activo requerido (true/false)' });

    if (Number.parseInt(id) === req.user.id)
      return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta' });

    // Sprint 19: solo usuarios de la misma empresa
    const [check] = await db.query(
      'SELECT id FROM usuarios WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1',
      [id, req.empresaId]
    );
    if (!check.length)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const valor = activo ? 1 : 0;
    await db.query('UPDATE usuarios SET activo = ? WHERE id = ? AND empresa_id = ?', [valor, id, req.empresaId]);

    if (!activo) {
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [id]);
      await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [id]);
    }

    logger.info('USUARIO_TOGGLE_ACTIVO', {
      event: 'usuario.activo_changed', targetId: id,
      activo: valor, cambiadoPor: req.user?.id,
    });

    return res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
    });
  } catch (error) {
    logger.error('USUARIO_TOGGLE_ACTIVO', {
      event: 'usuario.toggleActivo_error', targetId: req.params.id,
      message: error.message, userId: req.user?.id,
    });
    return res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};
```
