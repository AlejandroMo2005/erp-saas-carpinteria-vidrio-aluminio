// src/modules/configuracion/configuracion.repository.js
// Sprint 21 — multi-empresa: empresa_id en todos los queries

'use strict';

const db     = require('../../config/database');
const logger = require('../../shared/utils/logger');

const IVA_DEFAULT = 0.15;

// Todos los pares clave/valor de una empresa ordenados alfabéticamente
const obtenerTodos = async (empresaId) => {
  const [rows] = await db.query(
    `SELECT clave, valor
     FROM configuracion
     WHERE empresa_id = ?
     ORDER BY clave`,
    [empresaId]
  );
  return rows;
};

// Valor de una clave para la empresa dada; devuelve null si no existe
const obtenerValor = async (clave, empresaId) => {
  const [rows] = await db.query(
    `SELECT valor FROM configuracion
     WHERE clave = ? AND empresa_id = ?
     LIMIT 1`,
    [clave, empresaId]
  );
  return rows.length > 0 ? rows[0].valor : null;
};

// Upsert de un par clave/valor; requiere UNIQUE KEY (empresa_id, clave)
const guardarValor = async (clave, valor, empresaId) => {
  await db.query(
    `INSERT INTO configuracion (empresa_id, clave, valor)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor), updated_at = NOW()`,
    [empresaId, clave, String(valor)]
  );
};

// Tasa IVA como decimal (0.15 = 15%); usa IVA_DEFAULT si la clave no existe
const obtenerTasaIva = async (empresaId) => {
  const raw = await obtenerValor('IVA', empresaId);
  if (raw === null) {
    logger.warn('CONFIG_IVA_DEFAULT', {
      event:     'configuracion.iva_default',
      empresaId,
      message:   `Clave IVA no encontrada para empresa ${empresaId}. Usando default ${IVA_DEFAULT}`,
    });
    return IVA_DEFAULT;
  }
  const tasa = parseFloat(raw);
  return isNaN(tasa) ? IVA_DEFAULT : tasa;
};

module.exports = { obtenerTodos, obtenerValor, guardarValor, obtenerTasaIva };