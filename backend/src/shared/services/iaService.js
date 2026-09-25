// src/shared/services/iaService.js
// Sprint 8  — Inpainting Hugging Face
// Sprint 17 — Stability AI SDXL, construirPrompt, traducirAIngles
// Sprint 18 — Stability AI v2beta + SAM via Replicate
// 📦 Sprint 20 — Movido de services/iaService.js (sin cambios de paths internos)
'use strict';

const https    = require('https');
const fs       = require('fs');
const path     = require('path');
const FormData = require('form-data');
const sharp    = require('sharp');

// ── Hugging Face ──────────────────────────────────────────────────────────────
const HF_TOKEN        = process.env.HF_API_TOKEN;
const MODELO_PRIMARIO = process.env.HF_MODELO_INPAINT ?? 'runwayml/stable-diffusion-inpainting';
const MODELO_FALLBACK = 'stabilityai/stable-diffusion-2-inpainting';
const TIMEOUT_MS      = Number(process.env.HF_TIMEOUT_MS ?? 90_000);
const MAX_REINTENTOS  = 3;
const ESPERA_503_MS   = 8_000;
const PARAMS_GENERACION = { num_inference_steps: 25, guidance_scale: 7.5, strength: 0.95 };

function limpiarBase64(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  const idx = dataUrl.indexOf(',');
  return idx !== -1 ? dataUrl.slice(idx + 1) : dataUrl;
}

function sha256Sync(texto) {
  const { createHash } = require('crypto');
  return createHash('sha256').update(texto).digest('hex');
}

function llamarHuggingFace(modelo, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const url    = `https://api-inference.huggingface.co/models/${modelo}`;
    const cuerpo = JSON.stringify(payload);
    const req    = https.request(url, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(cuerpo), 'x-use-cache': 'false' },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve({ status: res.statusCode, contentType: res.headers['content-type'] ?? '', buffer: Buffer.concat(chunks) }));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('HF API timeout')));
    req.on('error', reject);
    req.write(cuerpo);
    req.end();
  });
}

const esperar = (ms) => new Promise(r => setTimeout(r, ms));

async function generarInpainting({ imagenBase64, mascaraBase64, prompt, promptNegativo }) {
  if (!HF_TOKEN) {
    console.warn('[IA/HF] ⚠️  Sin HF_API_TOKEN — mock activo');
    return { imagenBase64, modelo: 'mock-hf', duracionMs: 100 };
  }
  const inicio    = Date.now();
  const imgBytes  = limpiarBase64(imagenBase64);
  const maskBytes = limpiarBase64(mascaraBase64);
  const payload   = { inputs: prompt, parameters: { ...PARAMS_GENERACION, negative_prompt: promptNegativo }, image: imgBytes, mask_image: maskBytes };

  for (const modelo of [MODELO_PRIMARIO, MODELO_FALLBACK]) {
    let intentos = 0;
    while (intentos < MAX_REINTENTOS) {
      intentos++;
      try {
        const { status, buffer, contentType } = await llamarHuggingFace(modelo, payload, TIMEOUT_MS);
        if (status === 503) { let info = ''; try { info = JSON.parse(buffer.toString()); } catch (_) {} await esperar(Math.min(info?.estimated_time ? Math.ceil(info.estimated_time * 1000) : ESPERA_503_MS, 20_000)); continue; }
        if (status === 429) { await esperar(10_000); continue; }
        if (status !== 200) { let msg = `HTTP ${status}`; try { msg = JSON.parse(buffer.toString())?.error ?? msg; } catch (_) {} console.error(`[IA/HF] Error en ${modelo}: ${msg}`); break; }
          if (!contentType.startsWith('image/')) {
            let m = '';
            try {
              const parsed = JSON.parse(buffer.toString());
              m = parsed?.error;
            } catch (_) {}

            throw new Error(m || `Content-Type inesperado: ${contentType}`);
          }
        const ext = contentType.includes('png') ? 'png' : 'jpeg';
        console.log(`[IA/HF] ✅ Generado en ${Date.now() - inicio}ms con ${modelo}`);
        return { imagenBase64: `data:image/${ext};base64,${buffer.toString('base64')}`, modelo, duracionMs: Date.now() - inicio };
      } catch (err) {
        if (intentos >= MAX_REINTENTOS) { console.error(`[IA/HF] Fatal en ${modelo}:`, err.message); break; }
        console.warn(`[IA/HF] Reintentando: ${err.message}`);
        await esperar(3_000);
      }
    }
  }
  throw new Error('No se pudo generar la imagen. El modelo puede estar ocupado — intenta de nuevo.');
}

function hashImagen(dataUrl) {
  try { return sha256Sync(limpiarBase64(dataUrl ?? '')); } catch (_) { return null; }
}

// ── Stability AI v2beta ───────────────────────────────────────────────────────
const STABILITY_API_KEY  = process.env.STABILITY_API_KEY;
const STABILITY_ENDPOINT = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';
const SDXL_DIMS          = [[1024,1024],[1152,896],[1216,832],[1344,768],[1536,640],[640,1536],[768,1344],[832,1216],[896,1152]];
const SUFIJO_FOTO        = 'professional finish, installed in place, realistic architectural photography, 8k, high definition, sharp focus';
const NEGATIVE_PROMPT    = 'cartoon, 3d render, deformed, blurry, bad proportions, floating, disconnected, unrealistic, low quality, watermark, text, logo';

async function traducirAIngles(texto) {
  if (!texto?.trim()) return texto;
  const textoCortado = texto.trim().slice(0, 500);
  return new Promise((resolve) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoCortado)}&langpair=auto|en`;
    const req = https.get(url, { timeout: 8_000 }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data      = JSON.parse(Buffer.concat(chunks).toString());
          const traducido = data?.responseData?.translatedText;
          if (traducido && !traducido.toUpperCase().includes('INVALID') && !traducido.toUpperCase().includes('PLEASE SELECT')) {
            resolve(traducido);
          } else { resolve(texto); }
        } catch (_) { resolve(texto); }
      });
    });
    req.on('error',   () => resolve(texto));
    req.on('timeout', () => { req.destroy(); resolve(texto); });
  });
}

const TERMINOS_ES_EN = {
  'puerta':'door','ventana':'window','ventanal':'large window','corrediza':'sliding','corredizo':'sliding',
  'batiente':'hinged','abatible':'casement','fija':'fixed','fijo':'fixed','vidrio':'glass','aluminio':'aluminum',
  'perfil':'profile','templado':'tempered','laminado':'laminated','doble':'double','color':'color',
  'marco':'frame','hoja':'panel','celosía':'louver','mosquitero':'mosquito screen','persiana':'blind',
  'mampara':'partition','division':'partition','cancel':'glass partition','pared':'wall','techo':'ceiling','fachada':'facade',
};

function traducirTerminos(texto) {
  if (!texto) return texto;
  let r = texto;
  for (const [es, en] of Object.entries(TERMINOS_ES_EN))
    r = r.replace(new RegExp(`\\b${es}\\b`, 'gi'), en);
  return r;
}

async function redimensionarParaSDXL(buffer) {
  const meta  = await sharp(buffer).metadata();
  const ratio = meta.width / meta.height;
  let mejor = SDXL_DIMS[0], menorDif = Infinity;
  for (const [w, h] of SDXL_DIMS) {
    const dif = Math.abs(w / h - ratio);
    if (dif < menorDif) { menorDif = dif; mejor = [w, h]; }
  }
  const [w, h] = mejor;
  console.log(`[IA/Stability] Redimensionando ${meta.width}x${meta.height} → ${w}x${h}`);
  return sharp(buffer).resize(w, h, { fit: 'fill' }).toBuffer();
}

function construirPrompt({ trabajo, color, material }) {
  const partes = [];
  partes.push(traducirTerminos(trabajo.nombre));
  if (material)                 partes.push(traducirTerminos(material));
  else if (trabajo.descripcion) partes.push(traducirTerminos(trabajo.descripcion));
  if (trabajo.prompt_base)      partes.push(trabajo.prompt_base);
  partes.push(`${color.nombre} color`);
  partes.push(SUFIJO_FOTO);
  return partes.join(', ');
}

function construirPromptLibre({ promptLibre, color }) {
  let base = promptLibre
    .replace(/,?\s*(acabado profesional|fotorrealista|fotografía arquitectónica|alta definición|professional finish|realistic architectural|sharp focus|high definition|8k)[^,]*/gi, '')
    .trim().replace(/,\s*$/, '');
  const partes = [base];
  if (color?.nombre) {
    const n = color.nombre.toLowerCase();
    if (!base.toLowerCase().includes(n)) partes.push(`${n} color`);
  }
  partes.push(SUFIJO_FOTO);
  return partes.join(', ');
}

async function generarVisualizacion({ imagenBuffer, mascaraBuffer, imagenMimeType, prompt, referencias = [] }) {
  if (!STABILITY_API_KEY) {
    console.warn('[IA/Stability] ⚠️  Sin STABILITY_API_KEY — mock activo');
    return imagenBuffer;
  }
  const [imgRedim, maskRedim] = await Promise.all([
    redimensionarParaSDXL(imagenBuffer),
    redimensionarParaSDXL(mascaraBuffer),
  ]);
  const form = new FormData();
  form.append('image',           imgRedim,  { filename: 'espacio.jpg', contentType: imagenMimeType || 'image/jpeg' });
  form.append('mask',            maskRedim, { filename: 'mascara.png', contentType: 'image/png' });
  form.append('prompt',          prompt);
  form.append('negative_prompt', NEGATIVE_PROMPT);
  form.append('output_format',   'png');
  form.append('strength',        '0.95');

  const refConImagen = referencias.find(r => r.imagenBuffer instanceof Buffer);
  if (refConImagen) {
    const styleRedim = await redimensionarParaSDXL(refConImagen.imagenBuffer);
    form.append('style_image', styleRedim, { filename: 'referencia.jpg', contentType: 'image/jpeg' });
  }
  const refsTexto = referencias.filter(r => !(r.imagenBuffer instanceof Buffer) && r.descriptores?.trim());
  if (refsTexto.length > 0) {
    form.set('prompt', `${prompt}, style influenced by: ${refsTexto.map(r => r.descriptores.trim()).join(', ')}`);
  }

  const respuesta = await new Promise((resolve, reject) => {
    const urlObj  = new URL(STABILITY_ENDPOINT);
    const req     = https.request({
      hostname: urlObj.hostname, path: urlObj.pathname, method: 'POST',
      headers: { Authorization: `Bearer ${STABILITY_API_KEY}`, Accept: 'application/json', ...form.getHeaders() },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
    });
    req.setTimeout(90_000, () => req.destroy(new Error('Stability AI timeout')));
    req.on('error', reject);
    form.pipe(req);
  });

  if (respuesta.status !== 200) {
    let detalle = `HTTP ${respuesta.status}`;
    try { const p = JSON.parse(respuesta.buffer.toString()); detalle = p.errors?.join(', ') ?? p.message ?? detalle; } catch (_) {}
    const err = new Error(`Stability AI v2beta respondió ${respuesta.status}: ${detalle}`);
    err.code  = 'STABILITY_API_ERROR';
    throw err;
  }
  const data = JSON.parse(respuesta.buffer.toString());
  if (!data.image) {
    const err = new Error('Stability AI v2beta no devolvió imagen');
    err.code = 'STABILITY_API_ERROR';
    throw err;
  } else {
    return Buffer.from(data.image, 'base64');
  }
}

// ── SAM via Replicate ─────────────────────────────────────────────────────────
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const SAM_VERSION         = process.env.SAM_VERSION ?? 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003';

function replicatePost(pathStr, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req     = https.request({
      hostname: 'api.replicate.com', path: pathStr, method: 'POST',
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch (e) { reject(e); } });
    });
    req.setTimeout(15_000, () => req.destroy(new Error('Replicate POST timeout')));
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function replicateGet(predId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.replicate.com', path: `/v1/predictions/${predId}`, method: 'GET',
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch (e) { reject(e); } });
    });
    req.setTimeout(10_000, () => req.destroy(new Error('Replicate GET timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function esperarResultadoReplicate(predId, maxMs = 60_000) {
  const inicio = Date.now();
  while (Date.now() - inicio < maxMs) {
    const pred = await replicateGet(predId);
    if (pred.status === 'succeeded') return pred;
    if (pred.status === 'failed' || pred.status === 'canceled') throw new Error(`SAM prediction ${pred.status}: ${pred.error ?? ''}`);
    await esperar(2_000);
  }
  throw new Error('SAM prediction timeout (60s)');
}

function descargarBuffer(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req    = https.request({
      hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'GET',
      headers: { 'User-Agent': 'inventario-proformas/1.0' },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) { descargarBuffer(res.headers.location).then(resolve).catch(reject); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
    });
    req.setTimeout(30_000, () => req.destroy(new Error('Download timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function mascaraMockCentro(imagenBuffer) {
  const meta = await sharp(imagenBuffer).metadata();
  const w = meta.width, h = meta.height;
  const x = Math.round(w * 0.15), y = Math.round(h * 0.20);
  const bw = Math.round(w * 0.70), bh = Math.round(h * 0.60);
  const raw = Buffer.alloc(w * h, 0);
  for (let row = y; row < y + bh && row < h; row++)
    for (let col = x; col < x + bw && col < w; col++)
      raw[row * w + col] = 255;
  return sharp(raw, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
}

async function generarMascaraSAM(imagenBuffer, puntoXPct = 50, puntoYPct = 50) {
  if (!REPLICATE_API_TOKEN) {
    console.warn('[IA/SAM] ⚠️  Sin REPLICATE_API_TOKEN — mock activo');
    return mascaraMockCentro(imagenBuffer);
  }
  const meta  = await sharp(imagenBuffer).metadata();
  const px    = Math.round((puntoXPct / 100) * meta.width);
  const py    = Math.round((puntoYPct / 100) * meta.height);
  const pred  = await replicatePost('/v1/predictions', {
    version: SAM_VERSION,
    input: { image: `data:image/jpeg;base64,${imagenBuffer.toString('base64')}`, point_coords: `[[${px},${py}]]`, point_labels: '[1]', pred_iou_thresh: 0.86, stability_score_thresh: 0.92, multimask_output: false },
  });
  if (pred.error) {
    throw new Error(`SAM error: ${pred.error}`);
  } else {
    const resultado  = await esperarResultadoReplicate(pred.id);
    const outputUrls = Array.isArray(resultado.output) ? resultado.output : [resultado.output].filter(Boolean);
    if (!outputUrls.length) throw new Error('SAM no devolvió máscaras');
    const maskBuffer = await descargarBuffer(outputUrls[0]);
    return sharp(maskBuffer).resize(meta.width, meta.height, { fit: 'fill' }).grayscale().threshold(128).png().toBuffer();
  }
}

module.exports = { generarInpainting, hashImagen, generarVisualizacion, generarMascaraSAM, construirPrompt, construirPromptLibre, traducirAIngles };
