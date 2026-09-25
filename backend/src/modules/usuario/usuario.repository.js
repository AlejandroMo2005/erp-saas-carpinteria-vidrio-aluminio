// src/modules/usuario/usuario.repository.js
// Sprint 7  — updatePerfil, findByNombre, desactivar, activar
// Sprint 11 — soft delete: getById y findByNombre excluyen deleted_at
// Sprint 19 — empresa_id en create + findByNombre (TODO pendiente en query)
// 📦 Sprint 20 — Movido de models/Usuario.js (proxy eliminado)
//                config/database → ../../../config/database

'use strict';

const db     = require('../../../config/database');
const bcrypt = require('bcryptjs');

const CAMPOS_PERFIL = `
  id, nombre, email, rol, activo,
  nombre_completo, telefono, cedula_ruc, direccion,
  created_at, updated_at
`;

const CAMPOS_EDITABLES = [
  'nombre_completo',
  'telefono',
  'email',
  'cedula_ruc',
  'direccion',
];

class Usuario {

  // Sprint 19: empresa_id incluido en el INSERT
  static async create({ nombre, email, password, rol = 'VENDEDOR', activo = 1, empresa_id }) {
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, email, password, rol, activo, empresa_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, email, hashedPassword, rol, activo, empresa_id ?? null]
    );
    return result.insertId;
  }

  // Sprint 11: excluye registros con soft delete
  static async getById(id) {
    const [rows] = await db.query(
      `SELECT ${CAMPOS_PERFIL}
         FROM usuarios
        WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  // getByEmail incluye password para validación — no filtra deleted_at
  static async getByEmail(email) {
    const [rows] = await db.query(
      `SELECT id, nombre, email, password, rol, activo,
              reset_token, reset_expires, created_at, token_id
         FROM usuarios
        WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await db.query(
      `SELECT ${CAMPOS_PERFIL}
         FROM usuarios
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC`
    );
    return rows;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ── Reset token ──────────────────────────────────────────────

  static async saveResetToken(userId, token, expires) {
    await db.query(
      `UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id = ?`,
      [token, expires, userId]
    );
  }

  static async findByResetToken(token) {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE reset_token = ?`,
      [token]
    );
    return rows[0] || null;
  }

  static async updatePassword(userId, newPassword) {
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.query(
      `UPDATE usuarios SET password = ? WHERE id = ?`,
      [hashedPassword, userId]
    );
  }

  static async clearResetToken(userId) {
    await db.query(
      `UPDATE usuarios SET reset_token = NULL, reset_expires = NULL WHERE id = ?`,
      [userId]
    );
  }

  // ── Sprint 7: updatePerfil ───────────────────────────────────

  static async updatePerfil(id, datos, newPasswordPlain = null) {
    const actualizaciones = {};

    for (const campo of CAMPOS_EDITABLES) {
      if (datos[campo] !== undefined) {
        actualizaciones[campo] = datos[campo] === '' ? null : datos[campo];
      }
    }

    if (newPasswordPlain) {
      const salt = await bcrypt.genSalt(10);
      actualizaciones.password = await bcrypt.hash(newPasswordPlain, salt);
    }

    if (Object.keys(actualizaciones).length === 0) {
      return await Usuario.getById(id);
    }

    const setClauses = Object.keys(actualizaciones)
      .map(campo => `${campo} = ?`)
      .join(', ');

    const valores = [...Object.values(actualizaciones), id];
    await db.query(`UPDATE usuarios SET ${setClauses} WHERE id = ?`, valores);
    return await Usuario.getById(id);
  }

  // ── Sprint 7: findByNombre ───────────────────────────────────
  // Sprint 11: excluye deleted_at
  // TODO Sprint 21: agregar AND empresa_id = ? cuando se complete la migración

  static async findByNombre(query, { limite = 10, empresaId: _empresaId } = {}) {
    const termino = `%${query}%`;
    const [rows] = await db.query(
      `SELECT id, nombre, nombre_completo, telefono, email, cedula_ruc
         FROM usuarios
        WHERE activo = 1
          AND deleted_at IS NULL
          AND (nombre_completo LIKE ? OR nombre LIKE ?)
        ORDER BY nombre_completo, nombre
        LIMIT ?`,
      [termino, termino, limite]
    );
    return rows;
  }

  // ── Sprint 7: desactivar / activar ──────────────────────────

  static async desactivar(id) {
    const [result] = await db.query(
      `UPDATE usuarios SET activo = 0 WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }

  static async activar(id) {
    const [result] = await db.query(
      `UPDATE usuarios SET activo = 1 WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Usuario;