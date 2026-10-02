// src/shared/utils/softDelete.js
// ⭐ Sprint 21 — Movido desde backend/utils/softDelete.js
//   Ruta canónica: src/shared/utils/softDelete.js
//   require('./logger') no cambia — logger.js está en el mismo directorio.
//
// Uso en repositories:
//   const { softDelete, softRestore, whereActivo, whereActivoAnd, andActivo }
//     = require('../../shared/utils/softDelete');

'use strict';

const logger = require('./logger');

/**
 * Realiza soft delete — pone deleted_at = NOW().
 * NO elimina el registro de la BD.
 *
 * @param {object} db        — pool o conexión mysql2
 * @param {string} tabla     — nombre de la tabla
 * @param {number} id        — id del registro
 * @param {number} usuarioId — id del usuario que realiza la acción (auditoría)
 * @returns {boolean} true si se eliminó, false si ya estaba eliminado o no existe
 */
const softDelete = async (db, tabla, id, usuarioId = null) => {
  const [result] = await db.query(
    `UPDATE ${tabla} SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  if (result.affectedRows > 0) {
    logger.info('SOFT_DELETE', { tabla, id, usuarioId });
  }

  return result.affectedRows > 0;
};

/**
 * Restaura un registro eliminado (soft restore).
 *
 * @param {object} db        — pool o conexión mysql2
 * @param {string} tabla     — nombre de la tabla
 * @param {number} id        — id del registro
 * @param {number} usuarioId — id del usuario que realiza la acción (auditoría)
 * @returns {boolean} true si se restauró
 */
const softRestore = async (db, tabla, id, usuarioId = null) => {
  const [result] = await db.query(
    `UPDATE ${tabla} SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL`,
    [id]
  );

  if (result.affectedRows > 0) {
    logger.info('SOFT_RESTORE', { tabla, id, usuarioId });
  }

  return result.affectedRows > 0;
};

/**
 * Genera cláusula WHERE completa para excluir soft-deleted.
 * Usar cuando no hay otras condiciones previas.
 * @example `SELECT * FROM pedidos ${whereActivo()} ORDER BY id DESC`
 */
const whereActivo = () => 'WHERE deleted_at IS NULL';

/**
 * WHERE con condición adicional encadenada.
 * @param {string} condicion — condición SQL sin WHERE
 * @example whereActivoAnd('estado = ?') → "WHERE deleted_at IS NULL AND (estado = ?)"
 */
const whereActivoAnd = (condicion) => `WHERE deleted_at IS NULL AND (${condicion})`;

/**
 * Fragmento AND para cuando ya existe un WHERE en la query.
 * @example `WHERE empresa_id = ? AND deleted_at IS NULL`
 */
const andActivo = () => 'AND deleted_at IS NULL';

module.exports = { softDelete, softRestore, whereActivo, whereActivoAnd, andActivo };