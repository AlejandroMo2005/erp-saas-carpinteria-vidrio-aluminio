// ConfigPanel/ConfigPanel.jsx
import React from 'react';
import './ConfigPanel.css';

export default function ConfigPanel({
  tab, setTab,
  trabajos, cargandoTrabajos,
  colores, cargandoColores,
  coloresMarco, coloresVidrio,
  trabajoId, setTrabajoId,
  colorId, setColorId,
  promptLibre, setPromptLibre,
  configValida,
  fase,
  error,
  handleArchivo,
  volverAConfig,
  onContinuar,
}) {
  return (
    <div className="via-card">
      <div className="via-tabs" role="tablist" aria-label="Modo de configuración">
        <button role="tab" aria-selected={tab==='catalogo'} aria-controls="via-panel-catalogo"
          id="via-tab-catalogo" className={`via-tab ${tab==='catalogo'?'active':''}`}
          onClick={() => setTab('catalogo')}>
          📋 Desde catálogo
        </button>
        <button role="tab" aria-selected={tab==='libre'} aria-controls="via-panel-libre"
          id="via-tab-libre" className={`via-tab ${tab==='libre'?'active':''}`}
          onClick={() => setTab('libre')}>
          ✏️ Descripción libre
        </button>
      </div>

      {/* ── Tab catálogo ── */}
      {tab === 'catalogo' && (
        <div id="via-panel-catalogo" className="via-tab-panel" role="tabpanel" aria-labelledby="via-tab-catalogo">
          <div className="via-form-group">
            <label htmlFor="via-trabajo">Tipo de trabajo</label>
            <select id="via-trabajo" value={trabajoId}
              onChange={e => { setTrabajoId(e.target.value); setColorId(''); }}
              disabled={cargandoTrabajos}>
              <option value="">{cargandoTrabajos ? 'Cargando…' : '— Selecciona —'}</option>
              {trabajos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          {trabajoId && coloresMarco.length > 0 && (
            <div className="via-form-group">
              <p id="via-label-marco" className="via-group-label">Color de aluminio (marco)</p>
              <div className="via-colores-grid" role="radiogroup" aria-labelledby="via-label-marco">
                {cargandoColores
                  ? <span className="via-loading">Cargando…</span>
                  : coloresMarco.map(c => (
                    <button key={c.id} type="button" role="radio"
                      aria-checked={String(colorId)===String(c.id)}
                      className={`via-color-chip ${String(colorId)===String(c.id)?'selected':''}`}
                      onClick={() => setColorId(c.id)}>
                      <span className="via-color-dot" style={{background:c.valor}} aria-hidden="true" />
                      {c.nombre}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {trabajoId && coloresMarco.length===0 && !cargandoColores && coloresVidrio.length > 0 && (
            <div className="via-form-group">
              <p id="via-label-vidrio" className="via-group-label">Color de vidrio</p>
              <div className="via-colores-grid" role="radiogroup" aria-labelledby="via-label-vidrio">
                {coloresVidrio.map(c => (
                  <button key={c.id} type="button" role="radio"
                    aria-checked={String(colorId)===String(c.id)}
                    className={`via-color-chip ${String(colorId)===String(c.id)?'selected':''}`}
                    onClick={() => setColorId(c.id)}>
                    <span className="via-color-dot" style={{background:c.valor??c.hex,border:'1px solid #999'}} aria-hidden="true" />
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab libre ── */}
      {tab === 'libre' && (
        <div id="via-panel-libre" className="via-tab-panel" role="tabpanel" aria-labelledby="via-tab-libre">
          <p className="via-hint-translate">
            🌐 Escribe en cualquier idioma — se traduce automáticamente al inglés para la IA
          </p>
          <div className="via-form-group">
            <label htmlFor="via-prompt">Descripción del trabajo</label>
            <textarea id="via-prompt" className="via-textarea" rows={4}
              placeholder="Ej: puerta corrediza de aluminio color bronce, vidrio templado, estilo moderno"
              value={promptLibre} onChange={e => setPromptLibre(e.target.value)}
              maxLength={500} />
            <span id="via-prompt-count" className="via-char-count" aria-live="polite">
              {promptLibre.length}/500
            </span>
          </div>

          {colores.length > 0 && (
            <div className="via-form-group">
              <p id="via-color-libre-label" className="via-group-label">
                Color <span className="via-optional">(opcional — refuerza el resultado)</span>
              </p>
              <div className="via-colores-grid" role="radiogroup" aria-labelledby="via-color-libre-label">
                {cargandoColores
                  ? <span className="via-loading">Cargando…</span>
                  : colores.map(c => (
                    <button key={c.id} type="button" role="radio"
                      aria-checked={String(colorId)===String(c.id)}
                      className={`via-color-chip ${String(colorId)===String(c.id)?'selected':''}`}
                      onClick={() => setColorId(prev => String(prev)===String(c.id) ? '' : c.id)}>
                      <span className="via-color-dot" style={{background:c.valor??c.hex,border:'1px solid rgba(0,0,0,0.2)'}} aria-hidden="true" />
                      {c.nombre}
                    </button>
                  ))
                }
              </div>
              {colorId && (
                <button type="button" className="via-btn-clear" onClick={() => setColorId('')}>
                  ✕ Quitar color
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Acciones por fase ── */}
      {fase === 'config' && (
        <button type="button" className="via-btn via-btn--primary via-btn--full"
          disabled={!configValida} onClick={onContinuar}>
          Continuar →
        </button>
      )}

      {fase === 'foto' && (
        <>
          {error && <p className="via-error" role="alert">{error}</p>}
          <label htmlFor="via-file-input" className="via-upload-area"
            style={{position:'relative',cursor:'pointer',display:'block'}}>
            <div className="via-upload-icon" aria-hidden="true">📷</div>
            <p>Toca para seleccionar o tomar una foto</p>
            <span className="via-upload-hint">JPG · PNG · WEBP · máx. 10 MB</span>
            <input id="via-file-input" type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleArchivo}
              style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',opacity:0,cursor:'pointer'}} />
          </label>
          <button type="button" className="via-btn via-btn--ghost via-btn--full"
            onClick={volverAConfig} style={{marginTop:'0.5rem'}}>
            ← Cambiar configuración
          </button>
        </>
      )}
    </div>
  );
}