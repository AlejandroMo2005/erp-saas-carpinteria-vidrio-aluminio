// src/modules/ia/generacion/ia.controller.js
// Sprint 8  — Inpainting HF
// Sprint 17 — DT-IA: visualizarEspacio, getTrabajoConColores
// Sprint 18 — DT-STAB: imagenBuffer desde disco + mascaraAuto SAM
// 📦 Sprint 20 — Migrado a src/modules/ia/generacion/
//                services/iaService  → ../../../../services/iaService
//                config/database     → ../../../../config/database

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const {
  generarInpainting,
  hashImagen,
  generarVisualizacion,
  generarMascaraSAM,
  construirPrompt,
  construirPromptLibre,
  traducirAIngles,
} = require('../../../shared/services/iaService');
const db = require('../../../../config/database');

const PROMPT_MAX_LEN   = 500;
const MAX_BASE64_BYTES = 10 * 1024 * 1024;
const DIR_REFERENCIAS  = path.resolve(__dirname, '../../../..', 'public/referencias');

function esDataUrlImagen(valor) {
  if (!valor || typeof valor !== 'string') return false;
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(valor.slice(0, 50));
}

async function logearSolicitud({ usuario_id, trabajo_tipo, prompt, imagen_input_hash, modelo, duracion_ms, status }) {
  try {
    await db.query(
      `INSERT INTO ia_requests (usuario_id, trabajo_tipo, prompt, imagen_input_hash, modelo, duracion_ms, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id ?? null, trabajo_tipo ?? null, (prompt ?? '').slice(0, 500),
       imagen_input_hash ?? null, modelo ?? null, duracion_ms ?? null, status ?? 'OK']
    );
  } catch (err) {
    console.error('[IA] Error al guardar log en ia_requests:', err.message);
  }
}

async function cargarImagenReferencia(trabajoId, filename) {
  const filePath = path.join(DIR_REFERENCIAS, String(trabajoId), filename);
  try { return await fs.promises.readFile(filePath); }
  catch (_) { console.warn(`[IA] No se pudo cargar referencia: ${filePath}`); return null; }
}

async function obtenerReferencias(trabajoId) {
  try {
    const [rows] = await db.query(
      `SELECT filename, descriptores, peso FROM trabajo_referencias
       WHERE trabajo_id = ? AND activo = 1 ORDER BY peso DESC LIMIT 5`,
      [trabajoId]
    );
    const refs = await Promise.all(rows.map(async (r) => ({
      descriptores: r.descriptores ?? '',
      peso:         Number(r.peso) || 0.8,
      imagenBuffer: await cargarImagenReferencia(trabajoId, r.filename),
    })));
    return refs.filter(r => r.imagenBuffer !== null || r.descriptores.trim());
  } catch (err) {
    console.warn('[IA] Error al obtener referencias:', err.message);
    return [];
  }
}

async function describirConClaudeVision(imageBuffer, mimeType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.warn('[IA] Sin ANTHROPIC_API_KEY'); return null; }

  const imageBase64   = imageBuffer.toString('base64');
  const requestBody   = JSON.stringify({
    model: 'claude-sonnet-4-5-20251001', max_tokens: 300,
    messages: [{
      role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: 'Analyze this aluminum/glass architectural work and describe it as a Stable Diffusion SDXL prompt. Rules: English only, comma-separated, focus on material/frame/glass/color/quality, max 80 words, no brand names. Output ONLY descriptors.' },
      ],
    }],
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(requestBody) },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          const desc = data?.content?.[0]?.text?.trim();
          resolve(desc && desc.length > 10 ? desc : null);
        } catch { resolve(null); }
      });
    });
    req.setTimeout(20_000, () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.write(requestBody);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════
// POST /api/ia/inpaint
// ═══════════════════════════════════════════════════════
async function inpaint(req, res) {
  const inicio = Date.now();
  const { imagen, mascara, prompt, prompt_negativo, trabajo } = req.body ?? {};

  if (!imagen || !mascara || !prompt)
    return res.status(422).json({ success: false, message: 'Se requieren los campos: imagen, mascara y prompt.' });
  if (!esDataUrlImagen(imagen))
    return res.status(422).json({ success: false, message: 'El campo "imagen" debe ser un dataURL válido.' });
  if (!esDataUrlImagen(mascara))
    return res.status(422).json({ success: false, message: 'El campo "mascara" debe ser un dataURL válido.' });
  if (Buffer.byteLength(imagen) > MAX_BASE64_BYTES || Buffer.byteLength(mascara) > MAX_BASE64_BYTES)
    return res.status(413).json({ success: false, message: 'Las imágenes superan el tamaño máximo (10 MB).' });

  const promptLimpio = String(prompt).trim().slice(0, PROMPT_MAX_LEN);
  const promptNeg    = String(prompt_negativo ?? '').trim().slice(0, PROMPT_MAX_LEN);
  if (!promptLimpio.length)
    return res.status(422).json({ success: false, message: 'El prompt no puede estar vacío.' });

  const usuario_id = req.user?.id ?? null;
  const imgHash    = hashImagen(imagen);
  let modelo = null, duracion = null, statusLog = 'OK';

  try {
    const resultado = await generarInpainting({ imagenBase64: imagen, mascaraBase64: mascara, prompt: promptLimpio, promptNegativo: promptNeg });
    modelo = resultado.modelo; duracion = resultado.duracionMs;
    logearSolicitud({ usuario_id, trabajo_tipo: trabajo ?? null, prompt: promptLimpio, imagen_input_hash: imgHash, modelo, duracion_ms: duracion, status: 'OK' });
    return res.status(200).json({ success: true, imagen: resultado.imagenBase64, modelo: resultado.modelo, duracion_ms: resultado.duracionMs });
  } catch (err) {
    duracion = Date.now() - inicio; statusLog = err.message?.includes('timeout') ? 'TIMEOUT' : 'ERROR';
    logearSolicitud({ usuario_id, trabajo_tipo: trabajo ?? null, prompt: promptLimpio, imagen_input_hash: imgHash, modelo: modelo ?? null, duracion_ms: duracion, status: statusLog });
    const msg = err.message ?? 'Error al procesar con IA.';
    if (msg.includes('HF_API_TOKEN'))                       return res.status(500).json({ success: false, message: 'Clave de IA no configurada.' });
    if (msg.includes('timeout') || statusLog === 'TIMEOUT') return res.status(504).json({ success: false, message: 'La IA tardó demasiado.' });
    if (msg.includes('ocupado') || msg.includes('503'))     return res.status(503).json({ success: false, message: 'Modelo ocupado.' });
    return res.status(500).json({ success: false, message: msg });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/ia/visualizar/trabajos/:id/colores
// ═══════════════════════════════════════════════════════
async function getTrabajoConColores(req, res) {
  const { id } = req.params;
  try {
    const [trabajos] = await db.query(`SELECT id, nombre, descripcion, tipo FROM trabajos WHERE id = ?`, [id]);
    if (!trabajos.length) return res.status(404).json({ error: 'Trabajo no encontrado' });

    const [colores] = await db.query(
      `SELECT c.id, c.nombre, c.valor
       FROM colores c
       INNER JOIN material_colores mc ON mc.color_id   = c.id
       INNER JOIN recetas r           ON r.material_id = mc.material_id
       WHERE r.trabajo_id = ? ORDER BY c.nombre ASC`,
      [id]
    );
    return res.json({ trabajo: trabajos[0], colores });
  } catch (err) {
    console.error('[IA] getTrabajoConColores error:', err.message);
    return res.status(500).json({ error: 'Error al obtener datos del trabajo' });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/ia/visualizar
// ═══════════════════════════════════════════════════════
async function visualizarEspacio(req, res) {
  const { trabajo_id, color_id, prompt_libre } = req.body;
  const usuario_id  = req.user?.id ?? null;
  const imagenFile  = req.files?.imagen?.[0];
  const mascaraFile = req.files?.mascara?.[0];

  if (!imagenFile || !mascaraFile)
    return res.status(422).json({ error: 'Se requieren los archivos imagen y mascara' });

  // ── Modo libre ────────────────────────────────────────
  if (String(trabajo_id) === '0') {
    if (!prompt_libre || prompt_libre.trim().length < 5)
      return res.status(422).json({ error: 'El prompt libre es requerido (mín. 5 caracteres)' });

    const promptTraducido = await traducirAIngles(prompt_libre.trim());
    let colorParaPrompt   = null;
    const colorIdNum      = Number(color_id);

    if (color_id && colorIdNum > 0) {
      try {
        const [coloresDB] = await db.query(`SELECT id, nombre, valor FROM colores WHERE id = ? AND activo = 1 LIMIT 1`, [colorIdNum]);
        if (coloresDB.length) colorParaPrompt = coloresDB[0];
      } catch (err) { console.warn('[IA] Error al consultar color:', err.message); }
    }

    const promptFinal = construirPromptLibre({ promptLibre: promptTraducido, color: colorParaPrompt });
    try {
      const imagenResultado = await generarVisualizacion({ imagenBuffer: imagenFile.buffer, mascaraBuffer: mascaraFile.buffer, imagenMimeType: imagenFile.mimetype, prompt: promptFinal, referencias: [] });
      logearSolicitud({ usuario_id, trabajo_tipo: 'libre', prompt: promptFinal, imagen_input_hash: null, modelo: 'stability-v2beta-inpaint', duracion_ms: null, status: 'OK' });
      return res.json({ ok: true, prompt: promptFinal, imagen_base64: imagenResultado.toString('base64'), mime_type: 'image/png' });
    } catch (err) {
      logearSolicitud({ usuario_id, trabajo_tipo: 'libre', prompt: promptFinal, imagen_input_hash: null, modelo: 'stability-v2beta-inpaint', duracion_ms: null, status: 'ERROR' });
      if (err.code === 'STABILITY_API_ERROR') return res.status(502).json({ error: 'Error al procesar con Stability AI', detalle: err.message });
      return res.status(500).json({ error: 'Error interno al generar la visualización' });
    }
  }

  // ── Modo catálogo ─────────────────────────────────────
  if (!trabajo_id || !color_id) return res.status(422).json({ error: 'trabajo_id y color_id son requeridos' });

  try {
    const [trabajos] = await db.query(`SELECT id, nombre, descripcion, tipo, prompt_base FROM trabajos WHERE id = ?`, [trabajo_id]);
    if (!trabajos.length) return res.status(404).json({ error: 'Trabajo no encontrado' });

    const [colores] = await db.query(
      `SELECT c.id, c.nombre, c.valor FROM colores c
       INNER JOIN material_colores mc ON mc.color_id = c.id
       INNER JOIN recetas r ON r.material_id = mc.material_id
       WHERE c.id = ? AND r.trabajo_id = ? LIMIT 1`,
      [color_id, trabajo_id]
    );
    if (!colores.length) return res.status(404).json({ error: 'Color no disponible para este trabajo' });

    const [variantes] = await db.query(`SELECT m.nombre AS material FROM recetas r INNER JOIN materiales m ON m.id = r.material_id WHERE r.trabajo_id = ? LIMIT 1`, [trabajo_id]);
    const materialDesc = variantes[0]?.material ?? null;
    const prompt       = construirPrompt({ trabajo: trabajos[0], color: { nombre: colores[0].nombre, hex: colores[0].valor }, material: materialDesc });
    const referencias  = await obtenerReferencias(trabajo_id);

    const imagenResultado = await generarVisualizacion({ imagenBuffer: imagenFile.buffer, mascaraBuffer: mascaraFile.buffer, imagenMimeType: imagenFile.mimetype, prompt, referencias });
    logearSolicitud({ usuario_id, trabajo_tipo: trabajos[0].nombre, prompt, imagen_input_hash: null, modelo: 'stability-v2beta-inpaint', duracion_ms: null, status: 'OK' });
    return res.json({ ok: true, prompt, imagen_base64: imagenResultado.toString('base64'), mime_type: 'image/png' });
  } catch (err) {
    logearSolicitud({ usuario_id, trabajo_tipo: String(trabajo_id), prompt: `trabajo:${trabajo_id} color:${color_id}`, imagen_input_hash: null, modelo: 'stability-v2beta-inpaint', duracion_ms: null, status: 'ERROR' });
    if (err.code === 'STABILITY_API_ERROR') return res.status(502).json({ error: 'Error al procesar con Stability AI', detalle: err.message });
    return res.status(500).json({ error: 'Error interno al generar la visualización' });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/ia/mascara-auto
// ═══════════════════════════════════════════════════════
async function mascaraAuto(req, res) {
  const imagenFile = req.files?.imagen?.[0];
  if (!imagenFile) return res.status(422).json({ error: 'Se requiere el archivo imagen' });

  const puntoX = Math.max(0, Math.min(100, Number(req.body?.punto_x ?? 50)));
  const puntoY = Math.max(0, Math.min(100, Number(req.body?.punto_y ?? 50)));

  try {
    const mascaraBuffer = await generarMascaraSAM(imagenFile.buffer, puntoX, puntoY);
    return res.json({ ok: true, mascara_base64: mascaraBuffer.toString('base64'), mime_type: 'image/png' });
  } catch (err) {
    console.error('[IA] mascaraAuto error:', err.message);
    return res.status(500).json({ error: 'Error al generar la máscara automática', detalle: err.message });
  }
}

module.exports = { inpaint, getTrabajoConColores, visualizarEspacio, mascaraAuto };