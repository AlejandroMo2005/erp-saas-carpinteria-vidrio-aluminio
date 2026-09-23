// backend/controllers/proformaController/utils.js
// Funciones utilitarias puras — sin efectos secundarios, sin dependencias.

'use strict';

const round2 = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const isLegacyItems = (items) =>
  Array.isArray(items) && items.length > 0 && items[0].material_id != null;

const isRecipeItems = (items) =>
  Array.isArray(items) && items.length > 0 && items[0].trabajo_id != null;

const safeDate = (d) =>
  d && String(d).trim()
    ? String(d).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

module.exports = { round2, isLegacyItems, isRecipeItems, safeDate };