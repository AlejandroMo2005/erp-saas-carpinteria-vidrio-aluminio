'use strict';
import { useState, useEffect, useRef } from 'react';
import api from '../../../../api/api';
import './Modales.css';

export default function ModalSubir({ trabajo, onClose, onSuccess }) {
  const [file,         setFile]         = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [descriptores, setDescriptores] = useState('');
  const [peso,         setPeso]         = useState(0.80);
  const [uploading,    setUploading]    = useState(false);
  const [err,          setErr]          = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const elegirArchivo = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/'))  { setErr('Solo se permiten imágenes'); return; }
    if (f.size > 8 * 1024 * 1024)     { setErr('La imagen no puede superar 8 MB'); return; }
    setFile(f); setErr('');
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target.result);
    r.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) { setErr('Selecciona una imagen'); return; }
    setUploading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('imagen', file);
      if (descriptores.trim()) fd.append('descriptores', descriptores.trim());
      fd.append('peso', String(peso));
      const { data } = await api.post(`/referencias/trabajos/${trabajo.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(data);
    } catch (e) {
      setErr(e.response?.data?.error ?? 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ref-overlay" role="dialog" aria-modal="true"
      aria-labelledby="modal-subir-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ref-modal">
        <header className="ref-modal-hd">
          <div className="ref-modal-title-wrap">
            <h2 id="modal-subir-title" className="ref-modal-title">Subir referencia</h2>
            <span className="ref-modal-subtitle">{trabajo.nombre}</span>
          </div>
          <button className="ref-modal-x" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="ref-modal-body">
          <div
            className={`ref-dropzone${preview ? ' ref-dropzone--filled' : ''}`}
            onDrop={(e) => { e.preventDefault(); elegirArchivo(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            aria-label="Zona de carga"
          >
            {preview
              ? <img src={preview} alt="Vista previa" className="ref-dropzone-img" />
              : (
                <div className="ref-dropzone-hint">
                  <span className="ref-dropzone-icon" aria-hidden="true">📷</span>
                  <p className="ref-dropzone-text">Arrastra una imagen o haz clic</p>
                  <p className="ref-dropzone-sub">JPG · PNG · WEBP · máx. 8 MB</p>
                </div>
              )
            }
            <input ref={fileRef} type="file" accept="image/*"
              onChange={(e) => elegirArchivo(e.target.files[0])}
              className="ref-file-input" aria-hidden="true" tabIndex={-1} />
          </div>

          <div className="ref-field">
            <label htmlFor="ref-desc" className="ref-label">
              Descriptores visuales
              <span className="ref-label-opt"> (opcional · Claude Vision auto-genera)</span>
            </label>
            <textarea id="ref-desc" className="ref-textarea" value={descriptores}
              onChange={(e) => setDescriptores(e.target.value)}
              placeholder="sliding aluminum door, dark bronze frame…" rows={3} maxLength={500} />
            <span className="ref-charcount" aria-live="polite">{descriptores.length}/500</span>
          </div>

          <div className="ref-field ref-field--inline">
            <label htmlFor="ref-peso" className="ref-label">Peso de influencia</label>
            <div className="ref-peso-wrap">
              <input id="ref-peso" type="range" min="0.1" max="1.0" step="0.05"
                value={peso} onChange={(e) => setPeso(Number(e.target.value))}
                className="ref-range" aria-valuetext={`${peso.toFixed(2)} de 1.00`} />
              <output className="ref-peso-val" htmlFor="ref-peso">{peso.toFixed(2)}</output>
            </div>
          </div>

          {err && <p className="ref-error" role="alert">{err}</p>}
        </div>

        <footer className="ref-modal-ft">
          <button className="ref-btn ref-btn--ghost" onClick={onClose} disabled={uploading}>Cancelar</button>
          <button className="ref-btn ref-btn--primary" onClick={handleSubmit}
            disabled={uploading || !file} aria-busy={uploading}>
            {uploading ? 'Subiendo…' : 'Subir referencia'}
          </button>
        </footer>
      </div>
    </div>
  );
}
