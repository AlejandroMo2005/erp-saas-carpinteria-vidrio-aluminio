import { useState, useRef, useEffect, useCallback, memo } from 'react';
// src/presentation/components/Previsualizacion/IA/IAPreview.jsx
// Sprint 17 — DT-IA
// Flujo: subir foto → pintar máscara → POST multipart → resultado
// Sin cámara (se habilitará cuando haya HTTPS en producción)

import './IAPreview.css';
import api from '../../../api/api';

// ═══════════════════════════════════════════════════════════════════════════
// MaskPainter
// ═══════════════════════════════════════════════════════════════════════════

const MaskPainter = memo(function MaskPainter({ imagen, onMascaraLista, onCancelar }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const pintando  = useRef(false);
  const [tamBrush, setTamBrush] = useState(36);
  const [trazos,   setTrazos]   = useState(0);

  useEffect(() => {
    const img = imgRef.current;
    const cv  = canvasRef.current;
    if (!img || !cv) return;
    const init = () => {
      cv.width  = img.naturalWidth  || img.offsetWidth  || 800;
      cv.height = img.naturalHeight || img.offsetHeight || 600;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cv.width, cv.height);
    };
    if (img.complete && img.naturalWidth) init();
    else img.onload = init;
  }, [imagen]);

  const coords = (e) => {
    const cv   = canvasRef.current;
    const rect = cv.getBoundingClientRect();
    const scaleX = cv.width  / rect.width;
    const scaleY = cv.height / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const dibujar = useCallback((e, color) => {
    if (!pintando.current) return;
    e.preventDefault();
    const cv  = canvasRef.current;
    const ctx = cv.getContext('2d');
    const { x, y } = coords(e);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, tamBrush / 2, 0, Math.PI * 2);
    ctx.fill();
    setTrazos(t => t + 1);
  }, [tamBrush]);

  const pintar = useCallback((e) => dibujar(e, '#ffffff'), [dibujar]);
  const borrar = useCallback((e) => dibujar(e, '#000000'), [dibujar]);

  const limpiar = () => {
    const cv  = canvasRef.current;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    setTrazos(0);
  };

  // ── Convierte el canvas a Blob PNG y lo devuelve al padre ────────────
  const confirmar = useCallback(() => {
    canvasRef.current.toBlob(blob => {
      if (blob) onMascaraLista(blob);
    }, 'image/png');
  }, [onMascaraLista]);

  return (
    <div className="ia-mask-root">
      <div className="ia-mask-header">
        <h3 className="ia-mask-title">
          <span className="ia-mask-icon">✏️</span>
          Pinta la zona donde irá el trabajo
        </h3>
        <p className="ia-mask-hint">
          Pinta en blanco la zona a reemplazar · Clic derecho = borrar
        </p>
      </div>

      <div className="ia-mask-canvas-wrap">
        <img
          ref={imgRef}
          src={imagen}
          alt="Foto cargada"
          className="ia-mask-foto"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="ia-mask-canvas"
          onMouseDown={e => { pintando.current = true; pintar(e); }}
          onMouseMove={pintar}
          onMouseUp={() => { pintando.current = false; }}
          onMouseLeave={() => { pintando.current = false; }}
          onContextMenu={e => { e.preventDefault(); pintando.current = true; borrar(e); }}
          onTouchStart={e => { pintando.current = true; pintar(e); }}
          onTouchMove={pintar}
          onTouchEnd={() => { pintando.current = false; }}
        />
      </div>

      <div className="ia-mask-controls">
        <div className="ia-brush-group">
          <label className="ia-brush-label">
            Pincel <span className="ia-brush-val">{tamBrush}px</span>
          </label>
          <input
            type="range" min="8" max="120" step="4"
            value={tamBrush}
            onChange={e => setTamBrush(Number(e.target.value))}
            className="ia-brush-slider"
            aria-label="Tamaño del pincel"
          />
        </div>
        <div className="ia-mask-actions">
          <button type="button" className="ia-btn ia-btn--ghost" onClick={limpiar}>
            Limpiar
          </button>
          <button type="button" className="ia-btn ia-btn--ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="ia-btn ia-btn--primary"
            onClick={confirmar}
            disabled={trazos === 0}
            title={trazos === 0 ? 'Pinta al menos una zona primero' : 'Generar imagen con IA'}
          >
            <span className="ia-btn-icon">✨</span>
            Generar con IA
          </button>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function IAPreview({
  trabajo,
  colorId,
  colorMarcoHex  = '#888888',
  colorVidrioHex = '#888888',
  onResultado,
  onCerrar,
}) {
  const [fase,     setFase]     = useState('subir');
  const [fotoSrc,  setFotoSrc]  = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [error,    setError]    = useState(null);
  const [progreso, setProgreso] = useState(0);

  const fileRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Seleccionar archivo ────────────────────────────────────────────────
  const abrirSelector = useCallback(() => fileRef.current?.click(), []);

  const handleArchivoElegido = useCallback((e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG, WEBP).');
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10 MB.');
      return;
    }
    setFotoFile(archivo);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFotoSrc(ev.target.result);
      setError(null);
      setFase('mascara');
    };
    reader.onerror = () => setError('No se pudo leer el archivo.');
    reader.readAsDataURL(archivo);
    e.target.value = '';
  }, []);

  const volverASubir = useCallback(() => {
    setFotoSrc(null);
    setFotoFile(null);
    setError(null);
    setFase('subir');
  }, []);

  // ── Enviar al backend ────────────────────────────────────────────────
  const procesarIA = useCallback(async (mascaraBlob) => {
    if (!trabajo?.id) {
      setError('No hay trabajo seleccionado.');
      return;
    }

    setFase('procesando');
    setError(null);
    setProgreso(5);

    timerRef.current = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 82) { clearInterval(timerRef.current); return 82; }
        return prev + 2;
      });
    }, 900);

    try {
      const form = new FormData();

      // Usar el File original si está disponible (mejor que convertir dataURL)
      if (fotoFile) {
        form.append('imagen', fotoFile, fotoFile.name);
      } else {
        const res  = await fetch(fotoSrc);
        const blob = await res.blob();
        form.append('imagen', blob, 'foto.jpg');
      }

      form.append('mascara',    mascaraBlob,              'mascara.png');
      form.append('trabajo_id', String(trabajo.id));
      form.append('color_id',   String(colorId ?? ''));

      const { data } = await api.post('/ia/visualizar', form, {
        timeout: 120_000,
      });

      clearInterval(timerRef.current);
      setProgreso(100);

      if (data?.ok && data?.imagen_base64) {
        const resultado = `data:${data.mime_type ?? 'image/png'};base64,${data.imagen_base64}`;
        setTimeout(() => onResultado(resultado), 400);
      } else {
        throw new Error(data?.error ?? 'La IA no devolvió imagen.');
      }

    } catch (err) {
      clearInterval(timerRef.current);
      setProgreso(0);

      const status = err?.response?.status;
      let msg;
      if      (status === 401)              msg = 'Sesión expirada. Recarga la página e inicia sesión de nuevo.';
      else if (status === 404)              msg = 'Trabajo o color no encontrado. Verifica la selección.';
      else if (status === 422)              msg = err?.response?.data?.error ?? 'Datos inválidos. Intenta con otra foto.';
      else if (status === 502)              msg = 'Error al procesar con la IA externa. Intenta de nuevo.';
      else if (err.code === 'ECONNABORTED') msg = 'La IA tardó demasiado. Intenta de nuevo.';
      else msg = err?.response?.data?.error ?? err.message ?? 'Error al procesar con IA.';

      setError(msg);
      setFase('mascara');
    }
  }, [fotoFile, fotoSrc, trabajo, colorId, onResultado]);

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div
      className="ia-modal-overlay"
      onClick={fase === 'subir' ? onCerrar : undefined}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleArchivoElegido}
      />

      <div
        className={`ia-modal ia-modal--${fase}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Vista previa con inteligencia artificial"
        aria-modal="true"
      >
        {/* Header */}
        <div className="ia-modal-header">
          <div className="ia-header-left">
            <span className="ia-header-badge">IA</span>
            <div>
              <h2 className="ia-modal-title">Ver en foto real</h2>
              <p className="ia-modal-subtitle">
                {trabajo?.nombre ?? 'Trabajo'} · {FASES_LABELS[fase]}
              </p>
            </div>
          </div>
          <button type="button" className="ia-close-btn" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        {/* Chip de colores */}
        <div className="ia-trabajo-info">
          <span className="ia-trabajo-chip">
            <span className="ia-color-dot" style={{ backgroundColor: colorMarcoHex }} title="Marco" />
            <span className="ia-color-dot ia-color-dot--vidrio" style={{ backgroundColor: colorVidrioHex }} title="Vidrio" />
            {trabajo?.nombre ?? '—'}
          </span>
        </div>

        {/* ── FASE: SUBIR ── */}
        {fase === 'subir' && (
          <div className="ia-subir-root">
            <div className="ia-subir-icon">🖼️</div>
            <h3 className="ia-subir-title">Selecciona una foto del espacio</h3>
            <p className="ia-subir-desc">
              Toma una foto del lugar donde irá el trabajo y súbela para visualizarlo con IA.
            </p>
            {error && <p className="ia-error-inline">{error}</p>}
            <div className="ia-subir-actions">
              <button type="button" className="ia-btn ia-btn--primary ia-btn--grande" onClick={abrirSelector}>
                <span className="ia-btn-icon">📁</span>
                Elegir foto
              </button>
              <button type="button" className="ia-btn ia-btn--ghost" onClick={onCerrar}>
                Cancelar
              </button>
            </div>
            <p className="ia-subir-formatos">JPG · PNG · WEBP · máx. 10 MB</p>
          </div>
        )}

        {/* ── FASE: MÁSCARA ── */}
        {fase === 'mascara' && (
          <>
            {error && <p className="ia-error-inline">{error}</p>}
            <MaskPainter
              imagen={fotoSrc}
              onMascaraLista={procesarIA}
              onCancelar={volverASubir}
            />
          </>
        )}

        {/* ── FASE: PROCESANDO ── */}
        {fase === 'procesando' && (
          <div className="ia-procesando-root">
            <div className="ia-procesando-preview">
              <img src={fotoSrc} alt="Foto en proceso" className="ia-procesando-foto" />
              <div className="ia-procesando-overlay">
                <div className="ia-scan-line" aria-hidden="true" />
              </div>
            </div>
            <div className="ia-procesando-info">
              <div className="ia-spinner-ring" aria-hidden="true" />
              <p className="ia-procesando-txt">Generando con IA…</p>
              <p className="ia-procesando-subtxt">Puede tardar hasta 30 segundos</p>
              <div
                className="ia-progress-bar"
                role="progressbar"
                aria-valuenow={Math.round(progreso)}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Progreso: ${Math.round(progreso)}%`}
              >
                <div className="ia-progress-fill" style={{ width: `${progreso}%` }} />
              </div>
              <p className="ia-progress-pct">{Math.round(progreso)}%</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const FASES_LABELS = {
  subir:      'Selecciona una foto',
  mascara:    'Pinta la zona',
  procesando: 'Generando…',
};
