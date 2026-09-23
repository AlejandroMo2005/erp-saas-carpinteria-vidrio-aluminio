// controllers/referenciaController.js
// Sprint 17 — DT-IA: Gestión de imágenes de referencia por tipo de trabajo
//
// Flujo de subida:
//   1. Recibe imagen via multipart (multer en las rutas)
//   2. Guarda el archivo en backend/public/referencias/{trabajo_id}/
//   3. Llama a Claude Vision (API Anthropic) para extraer descriptores visuales
//   4. Guarda en trabajo_referencias (trabajo_id, filename, descriptores, peso)
//
// Los descriptores se usan en iaService.construirPrompt como text_prompts
// adicionales con peso configurable, guiando el estilo de Stability AI.

'use strict';

const path = require('path');
const fs   = require('fs');
const https = require('https');
const db   = require('../config/database');

// Directorio base donde se guardan las imágenes de referencia
const DIR_BASE = path.join(__dirname, '..', 'public', 'referencias');

// ─── Helper: asegurar que existe el directorio del trabajo ───────────────────
function asegurarDirectorio(trabajoId) {
  const dir = path.join(DIR_BASE, String(trabajoId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ─── Helper: llamar a Claude Vision para extraer descriptores ────────────────
//
// Envía la imagen a claude-sonnet-4-5 con un prompt que pide descriptores
// visuales en inglés, optimizados para Stable Diffusion SDXL.
//
// Si la API falla, devuelve null para que el caller use un fallback.
async function describirConClaudeVision(imageBuffer, mimeType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[Ref] Sin ANTHROPIC_API_KEY — descripción automática no disponible');
    return null;
  }

  const imageBase64 = imageBuffer.toString('base64');

  const requestBody = JSON.stringify({
    model:      'claude-sonnet-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `You are a visual descriptor assistant for Stable Diffusion SDXL image generation.

Analyze this reference image of an aluminum/glass architectural work (door, window, partition, etc.) and provide a precise visual description optimized as a Stable Diffusion prompt.

Rules:
- Write ONLY in English
- Use comma-separated descriptors, no sentences
- Focus on: material finish, frame profile style, glass type, color/tone, installation context, quality level
- Max 80 words
- Do NOT include: brand names, people, measurements
- Output ONLY the descriptors, nothing else

Example output: sliding aluminum door, dark bronze anodized frame, tempered clear glass, clean rectilinear profile, matte finish, residential interior, architectural quality, natural light`,
          },
        ],
      },
    ],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data       = JSON.parse(Buffer.concat(chunks).toString());
          const descriptores = data?.content?.[0]?.text?.trim();
          if (descriptores && descriptores.length > 10) {
            console.log(`[Ref] Claude Vision → "${descriptores.slice(0, 60)}…"`);
            resolve(descriptores);
          } else {
            console.warn('[Ref] Claude Vision devolvió descriptores vacíos');
            resolve(null);
          }
        } catch (err) {
          console.warn('[Ref] Error parseando respuesta Claude:', err.message);
          resolve(null);
        }
      });
    });

    req.setTimeout(20_000, () => { req.destroy(); resolve(null); });
    req.on('error', (err) => { console.warn('[Ref] Error red Claude:', err.message); resolve(null); });
    req.write(requestBody);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER 1 — subirReferencia
// POST /api/referencias/trabajos/:trabajo_id
// Body: multipart — campo "imagen" (imagen de referencia)
// Body: texto     — campo "descriptores" (opcional — si no se envía, auto-genera)
// ═══════════════════════════════════════════════════════════════════════════════

async function subirReferencia(req, res) {
  const trabajoId = Number(req.params.trabajo_id);
  if (!trabajoId || isNaN(trabajoId))
    return res.status(400).json({ error: 'trabajo_id inválido' });

  const archivo = req.file;
  if (!archivo)
    return res.status(422).json({ error: 'Se requiere el archivo imagen' });

  // 1. Verificar que el trabajo existe
  try {
    const [trabajos] = await db.query(
      `SELECT id, nombre FROM trabajos WHERE id = ?`, [trabajoId],
    );
    if (!trabajos.length)
      return res.status(404).json({ error: 'Trabajo no encontrado' });

    // 2. Guardar el archivo en disco
    const dir      = asegurarDirectorio(trabajoId);
    const ext      = path.extname(archivo.originalname).toLowerCase() || '.jpg';
    const filename = `ref_${Date.now()}${ext}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, archivo.buffer);
    console.log(`[Ref] Imagen guardada: ${filePath}`);

    // 3. Obtener descriptores (manual > auto via Claude Vision > fallback genérico)
    let descriptores = req.body?.descriptores?.trim() || null;

    if (!descriptores) {
      console.log(`[Ref] Analizando imagen con Claude Vision…`);
      descriptores = await describirConClaudeVision(archivo.buffer, archivo.mimetype);
    }

    if (!descriptores) {
      // Fallback: usar el nombre del trabajo como descriptor mínimo
      descriptores = `${trabajos[0].nombre.toLowerCase()}, aluminum, glass, architectural quality, professional installation, photorealistic`;
      console.warn('[Ref] Usando descriptores de fallback');
    }

    // 4. Guardar en BD
    const peso = Number(req.body?.peso) || 0.80;
    const [result] = await db.query(
      `INSERT INTO trabajo_referencias (trabajo_id, filename, descriptores, peso)
       VALUES (?, ?, ?, ?)`,
      [trabajoId, filename, descriptores, peso],
    );

    console.log(`[Ref] Referencia #${result.insertId} creada para trabajo ${trabajoId}`);

    return res.status(201).json({
      ok:          true,
      id:          result.insertId,
      trabajo_id:  trabajoId,
      filename,
      descriptores,
      peso,
    });

  } catch (err) {
    console.error('[Ref] subirReferencia error:', err.message);
    return res.status(500).json({ error: 'Error al guardar la referencia' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER 2 — listarReferencias
// GET /api/referencias/trabajos/:trabajo_id
// ═══════════════════════════════════════════════════════════════════════════════

async function listarReferencias(req, res) {
  const trabajoId = Number(req.params.trabajo_id);
  if (!trabajoId || isNaN(trabajoId))
    return res.status(400).json({ error: 'trabajo_id inválido' });

  try {
    const [refs] = await db.query(
      `SELECT id, filename, descriptores, peso, activo, created_at
       FROM trabajo_referencias
       WHERE trabajo_id = ?
       ORDER BY created_at DESC`,
      [trabajoId],
    );

    // Añadir URL pública para cada imagen
    const conUrls = refs.map(r => ({
      ...r,
      url: `/referencias/${trabajoId}/${r.filename}`,
    }));

    return res.json({ trabajo_id: trabajoId, referencias: conUrls });

  } catch (err) {
    console.error('[Ref] listarReferencias error:', err.message);
    return res.status(500).json({ error: 'Error al obtener referencias' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER 3 — actualizarReferencia
// PATCH /api/referencias/:id
// Body JSON: { descriptores?, peso?, activo? }
// ═══════════════════════════════════════════════════════════════════════════════

async function actualizarReferencia(req, res) {
  const id = Number(req.params.id);
  if (!id || isNaN(id))
    return res.status(400).json({ error: 'id inválido' });

  const { descriptores, peso, activo } = req.body ?? {};
  const campos = [];
  const valores = [];

  if (descriptores !== undefined) { campos.push('descriptores = ?'); valores.push(descriptores); }
  if (peso          !== undefined) { campos.push('peso = ?');         valores.push(Number(peso)); }
  if (activo        !== undefined) { campos.push('activo = ?');       valores.push(activo ? 1 : 0); }

  if (!campos.length)
    return res.status(400).json({ error: 'Nada que actualizar' });

  try {
    valores.push(id);
    await db.query(`UPDATE trabajo_referencias SET ${campos.join(', ')} WHERE id = ?`, valores);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[Ref] actualizarReferencia error:', err.message);
    return res.status(500).json({ error: 'Error al actualizar' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER 4 — eliminarReferencia
// DELETE /api/referencias/:id
// ═══════════════════════════════════════════════════════════════════════════════

async function eliminarReferencia(req, res) {
  const id = Number(req.params.id);
  if (!id || isNaN(id))
    return res.status(400).json({ error: 'id inválido' });

  try {
    const [refs] = await db.query(
      `SELECT trabajo_id, filename FROM trabajo_referencias WHERE id = ?`, [id],
    );
    if (!refs.length)
      return res.status(404).json({ error: 'Referencia no encontrada' });

    const { trabajo_id, filename } = refs[0];

    // Eliminar de BD
    await db.query(`DELETE FROM trabajo_referencias WHERE id = ?`, [id]);

    // Eliminar archivo en disco (no bloquea si falla)
    try {
      const filePath = path.join(DIR_BASE, String(trabajo_id), filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('[Ref] No se pudo eliminar el archivo:', e.message);
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error('[Ref] eliminarReferencia error:', err.message);
    return res.status(500).json({ error: 'Error al eliminar' });
  }
}

module.exports = { subirReferencia, listarReferencias, actualizarReferencia, eliminarReferencia };