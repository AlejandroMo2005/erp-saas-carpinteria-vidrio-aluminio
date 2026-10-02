'use strict';
import { useState, useEffect, useRef, memo } from 'react';
import api from '../../../../api/api';
import './Imagenes.css';

const BASE_URL = (api.defaults?.baseURL ?? '').replace(/\/api\/?$/, '');
function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

/* ─── useLazyImage ─────────────────────────────────────────────── */
function useLazyImage() {
  const containerRef = useRef(null);
  const [inView,   setInView]   = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect(); } },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { containerRef, inView, loaded, setLoaded, imgError, setImgError };
}

/* ─── LazyImage ────────────────────────────────────────────────── */
const LazyImage = memo(function LazyImage({ src, alt }) {
  const { containerRef, inView, loaded, setLoaded, imgError, setImgError } = useLazyImage();
  return (
    <div ref={containerRef} className={`ref-img-wrap${loaded ? ' ref-img-wrap--loaded' : ''}`}>
      {inView && !imgError && (
        <img src={src} alt={alt} className="ref-img"
          onLoad={() => setLoaded(true)} onError={() => setImgError(true)} />
      )}
      {!loaded && !imgError && <div className="ref-img-skeleton" aria-hidden="true" />}
      {imgError && (
        <div className="ref-img-fallback" aria-label="Imagen no disponible">
          <span aria-hidden="true">🖼️</span>
          <span>Sin imagen</span>
        </div>
      )}
    </div>
  );
});

/* ─── ReferenciaCard ───────────────────────────────────────────── */
const ReferenciaCard = memo(function ReferenciaCard({ item, isAdmin, onEdit, onDeleted }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/referencias/${item.id}`);
      onDeleted(item.id);
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const fechaFormateada = item.created_at
    ? new Date(item.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: '2-digit' })
    : null;

  return (
    <article
      className={`ref-card${item.activo === 0 ? ' ref-card--off' : ''}`}
      role="listitem"
      aria-label={`Referencia${item.activo === 0 ? ' inactiva' : ''}`}
    >
      <div className="ref-card-img-area">
        <LazyImage src={getImageUrl(item.url)} alt={`Foto de referencia para ${item.filename}`} />
        {item.activo === 0 && <span className="ref-badge ref-badge--off">Inactiva</span>}
      </div>

      <div className="ref-card-info">
        <p className="ref-card-desc" title={item.descriptores ?? undefined}>
          {item.descriptores || <em className="ref-card-no-desc">Sin descriptores</em>}
        </p>
        <div className="ref-card-footer">
          <span className="ref-card-peso" aria-label={`Peso: ${Number(item.peso).toFixed(2)}`}>
            ⚖ {Number(item.peso).toFixed(2)}
          </span>
          {fechaFormateada && (
            <time className="ref-card-fecha" dateTime={item.created_at}>{fechaFormateada}</time>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="ref-card-actions" role="group" aria-label="Acciones">
          <button className="ref-icon-btn ref-icon-btn--edit" onClick={() => onEdit(item)} aria-label="Editar">✏️</button>
          <button
            className={`ref-icon-btn${confirmDel ? ' ref-icon-btn--confirm' : ' ref-icon-btn--del'}`}
            onClick={handleDelete}
            disabled={deleting}
            aria-label={confirmDel ? 'Confirmar eliminación' : 'Eliminar'}
            onBlur={() => setConfirmDel(false)}
          >
            {deleting ? '…' : confirmDel ? '¿Sí?' : '🗑️'}
          </button>
        </div>
      )}
    </article>
  );
});

export default ReferenciaCard;
