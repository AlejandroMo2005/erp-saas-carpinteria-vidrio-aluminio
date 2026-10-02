'use strict';
import { useState, useEffect } from 'react';
import api from '../../../../api/api';
import './Modales.css';

export default function ModalEditar({ item, onClose, onSave }) {
  const [descriptores, setDescriptores] = useState(item.descriptores ?? '');
  const [peso,         setPeso]         = useState(Number(item.peso) || 0.80);
  const [activo,       setActivo]       = useState(item.activo !== 0);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState('');

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      await api.patch(`/referencias/${item.id}`, { descriptores, peso, activo });
      onSave({ ...item, descriptores, peso, activo: activo ? 1 : 0 });
    } catch (e) {
      setErr(e.response?.data?.error ?? 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ref-overlay" role="dialog" aria-modal="true"
      aria-labelledby="modal-edit-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ref-modal">
        <header className="ref-modal-hd">
          <div className="ref-modal-title-wrap">
            <h2 id="modal-edit-title" className="ref-modal-title">Editar referencia</h2>
            <span className="ref-modal-subtitle">{item.filename}</span>
          </div>
          <button className="ref-modal-x" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="ref-modal-body">
          <div className="ref-field">
            <label htmlFor="edit-desc" className="ref-label">Descriptores visuales</label>
            <textarea id="edit-desc" className="ref-textarea" value={descriptores}
              onChange={(e) => setDescriptores(e.target.value)} rows={4} maxLength={500} />
            <span className="ref-charcount" aria-live="polite">{descriptores.length}/500</span>
          </div>

          <div className="ref-field ref-field--inline">
            <label htmlFor="edit-peso" className="ref-label">Peso</label>
            <div className="ref-peso-wrap">
              <input id="edit-peso" type="range" min="0.1" max="1.0" step="0.05"
                value={peso} onChange={(e) => setPeso(Number(e.target.value))} className="ref-range" />
              <output className="ref-peso-val" htmlFor="edit-peso">{peso.toFixed(2)}</output>
            </div>
          </div>

          <div className="ref-field ref-field--inline">
            <span id="activo-label" className="ref-label">Activa en generaciones</span>
            <button role="switch" aria-checked={activo} aria-labelledby="activo-label"
              className={`ref-toggle${activo ? ' ref-toggle--on' : ''}`}
              onClick={() => setActivo((v) => !v)}
            >
              <span className="ref-toggle-knob" />
              <span className="sr-only">{activo ? 'Activa' : 'Inactiva'}</span>
            </button>
          </div>

          {err && <p className="ref-error" role="alert">{err}</p>}
        </div>

        <footer className="ref-modal-ft">
          <button className="ref-btn ref-btn--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="ref-btn ref-btn--primary" onClick={handleSave}
            disabled={saving} aria-busy={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </footer>
      </div>
    </div>
  );
}
