// src/shared/services/proformaCalculator.js
// 📦 Sprint 20 — Movido de services/proformaCalculator.js
//                config/database → ../../../config/database
'use strict';


function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function toNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Campo inválido: ${fieldName}`);
  return n;
}

function baseSegunUnidad({ unidad, ancho, alto }) {
  if (unidad === 'm2')    return ancho * alto;
  if (unidad === 'ml')    return 2 * (ancho + alto);
  if (unidad === 'unidad') return 1;
  throw new Error(`unidad_calculo no soportada: ${unidad}`);
}

async function getIVA(connection) {
  const [rows] = await connection.query("SELECT valor FROM configuracion WHERE clave='IVA' LIMIT 1");
  const iva = rows?.[0]?.valor != null ? Number(rows[0].valor) : 0.15;
  return Number.isFinite(iva) ? iva : 0.15;
}

async function getPrecioUnitario(connection, material_id, color_id) {
  if (color_id != null) {
    const [v] = await connection.query(
      'SELECT precio FROM materiales_variantes WHERE material_id=? AND color_id=? LIMIT 1',
      [material_id, color_id]
    );
    const pv = v?.[0]?.precio != null ? Number(v[0].precio) : null;
    if (pv != null && Number.isFinite(pv) && pv > 0) return pv;
  }
  const [m] = await connection.query('SELECT precio FROM materiales WHERE id=? LIMIT 1', [material_id]);
  if (!m?.[0]) throw new Error(`Material no existe: material_id=${material_id}`);
  const pm = Number(m[0].precio);
  if (!Number.isFinite(pm)) throw new Error(`Precio inválido en materiales.id=${material_id}`);
  return pm;
}

async function calcularPorRecetas(connection, reqBody) {
  const cliente           = (reqBody.cliente || '').trim() || 'SIN NOMBRE';
  const telefono          = reqBody.telefono ? String(reqBody.telefono).trim() : null;
  const fecha             = reqBody.fecha || new Date().toISOString().slice(0, 10);
  const fecha_agendamiento = reqBody.fecha_agendamiento || null;
  const items             = Array.isArray(reqBody.items) ? reqBody.items : [];
  if (items.length === 0) throw new Error('Debe enviar al menos 1 item');

  const iva_valor    = await getIVA(connection);
  const trabajoIds   = [...new Set(items.map(i => Number(i.trabajo_id)).filter(n => Number.isFinite(n)))];
  const colorIds     = [...new Set(items.map(i => i.color_id != null ? Number(i.color_id) : null).filter(n => Number.isFinite(n)))];
  const trabajosMap  = new Map();
  const coloresMap   = new Map();

  if (trabajoIds.length) {
    const [trows] = await connection.query(
      `SELECT id, nombre FROM trabajos WHERE id IN (${trabajoIds.map(() => '?').join(',')})`, trabajoIds
    );
    for (const r of trows) trabajosMap.set(Number(r.id), r.nombre);
  }
  if (colorIds.length) {
    const [crows] = await connection.query(
      `SELECT id, nombre FROM colores WHERE id IN (${colorIds.map(() => '?').join(',')})`, colorIds
    );
    for (const r of crows) coloresMap.set(Number(r.id), r.nombre);
  }

  const materialesAgregados = new Map();
  const itemsCalculados     = [];
  let subtotalGeneral       = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const it            = items[idx];
    const trabajo_id    = toNumber(it.trabajo_id,  `items[${idx}].trabajo_id`);
    const ancho         = toNumber(it.ancho,        `items[${idx}].ancho`);
    const alto          = toNumber(it.alto,         `items[${idx}].alto`);
    const cantidadItems = it.cantidad != null ? toNumber(it.cantidad, `items[${idx}].cantidad`) : 1;
    if (ancho <= 0 || alto <= 0)   throw new Error(`Medidas inválidas en item #${idx + 1}`);
    if (cantidadItems <= 0)        throw new Error(`Cantidad inválida en item #${idx + 1}`);
    const color_id      = it.color_id != null ? toNumber(it.color_id, `items[${idx}].color_id`) : null;
    const detalle       = it.detalle != null ? String(it.detalle) : null;
    const trabajo_nombre = trabajosMap.get(trabajo_id);
    if (!trabajo_nombre) throw new Error(`Trabajo no existe: trabajo_id=${trabajo_id}`);
    const color_nombre  = color_id != null ? (coloresMap.get(color_id) || null) : null;

    const [recetas] = await connection.query(
      'SELECT material_id, unidad_calculo, factor FROM recetas WHERE trabajo_id = ?', [trabajo_id]
    );
    if (!recetas.length) throw new Error(`No hay recetas configuradas para el trabajo: ${trabajo_nombre}`);

    const materialesItem = [];
    let subtotalItem     = 0;

    for (const r of recetas) {
      const material_id     = Number(r.material_id);
      const unidad          = String(r.unidad_calculo);
      const factor          = Number(r.factor);
      if (!Number.isFinite(material_id) || !Number.isFinite(factor))
        throw new Error(`Receta inválida (trabajo_id=${trabajo_id})`);
      const base            = baseSegunUnidad({ unidad, ancho, alto });
      const cantidadMaterial = round2(base * factor * cantidadItems);
      const precio_unitario = await getPrecioUnitario(connection, material_id, color_id);
      const subtotalMat     = round2(cantidadMaterial * precio_unitario);
      subtotalItem          = round2(subtotalItem + subtotalMat);
      materialesItem.push({ material_id, unidad_calculo: unidad, factor, cantidad: cantidadMaterial, precio_unitario: round2(precio_unitario), subtotal: subtotalMat });
      const prev = materialesAgregados.get(material_id);
      if (!prev) materialesAgregados.set(material_id, { material_id, cantidad: cantidadMaterial, precio_unitario: round2(precio_unitario) });
      else prev.cantidad = round2(prev.cantidad + cantidadMaterial);
    }

    subtotalGeneral = round2(subtotalGeneral + subtotalItem);
    itemsCalculados.push({ item_num: idx + 1, trabajo_id, trabajo_nombre, ancho: round2(ancho), alto: round2(alto), cantidad: Math.round(cantidadItems), color_id, color_nombre, detalle, subtotal: subtotalItem, precio_unitario: round2(subtotalItem / Math.round(cantidadItems)), materiales: materialesItem });
  }

  const iva   = round2(subtotalGeneral * iva_valor);
  const total = round2(subtotalGeneral + iva);
  const materialesAgregadosArr = [];
  for (const v of materialesAgregados.values())
    materialesAgregadosArr.push({ material_id: v.material_id, cantidad: round2(v.cantidad), precio_unitario: v.precio_unitario, subtotal: round2(v.cantidad * v.precio_unitario) });

  return { cliente, telefono, fecha, fecha_agendamiento, items: itemsCalculados, materialesAgregados: materialesAgregadosArr, subtotal: subtotalGeneral, iva, total, iva_valor };
}

function buildWhatsAppText(calc) {
  const fechaTxt   = calc.fecha ? calc.fecha.split('-').reverse().join('/') : '';
  const totalTxt   = Number(calc.total   || 0).toFixed(2);
  const subtotalTxt = Number(calc.subtotal || 0).toFixed(2);
  const header = `*PROFORMA - COTIZACIÓN*\n━━━━━━━━━━━━━━━━━━━\n👤 *Cliente:* ${calc.cliente}${calc.telefono ? `\n📞 *Tel:* ${calc.telefono}` : ''}\n📅 *Fecha:* ${fechaTxt}\n━━━━━━━━━━━━━━━━━━━\n`;
  const lines  = calc.items.map(it => {
    const color = it.color_nombre || 'N/A';
    const det   = it.detalle ? `📝 Detalle: _${it.detalle}_\n` : '';
    const sub   = Number(it.subtotal || 0).toFixed(2);
    return `*Item #${it.item_num}: ${it.trabajo_nombre}*\n📐 Medidas: ${it.ancho}m x ${it.alto}m\n🎨 Color: ${color}\n${det}💰 Subtotal: *$${sub}*\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
  });
  return header + lines.join('\n') + `\n💰 Subtotal: *$${subtotalTxt}*\n💵 *TOTAL A PAGAR (+IVA): $${totalTxt}*`;
}

module.exports = { calcularPorRecetas, buildWhatsAppText };