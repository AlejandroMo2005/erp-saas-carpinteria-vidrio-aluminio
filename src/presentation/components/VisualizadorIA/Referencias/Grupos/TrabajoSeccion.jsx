'use strict';
import React, {
  useState, useCallback, lazy, Suspense,
} from 'react';
import api from '../../../../api/api';
import ReferenciaCard from '../Imagenes/Imagenes';

// Modales lazy — solo montan cuando el usuario los abre
const ModalSubir  = lazy(() => import('../Modales/ModalSubir'));
const ModalEditar = lazy(() => import('../Modales/ModalEditar'));

export default function TrabajoSeccion({ trabajo, isAdmin }) {
  const [refs,     setRefs]     = useState(null);
  const [loadingR, setLoadingR] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [modal,    setModal]    = useState(null);   // 'subir' | null
  const [editItem, setEditItem] = useState(null);

  const cargarRefs = useCallback(async () => {
    if (refs !== null || loadingR) return;
    setLoadingR(true);
    try {
      const { data } = await api.get(`/referencias/trabajos/${trabajo.id}`);
      setRefs(data.referencias ?? []);
    } catch {
      setRefs([]);
    } finally {
      setLoadingR(false);
    }
  }, [trabajo.id, refs, loadingR]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) cargarRefs();
  };

  const handleSubirSuccess = (nueva) => {
    setRefs((prev) => [
      { ...nueva, url: `/referencias/${trabajo.id}/${nueva.filename}`, activo: 1 },
      ...(prev ?? []),
    ]);
    setModal(null);
  };

  const handleEditSave = (updated) => {
    setRefs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditItem(null);
  };

  const handleDeleted = (id) => setRefs((prev) => prev.filter((r) => r.id !== id));

  const total   = refs?.length ?? null;
  const activas = refs?.filter((r) => r.activo !== 0).length ?? null;

  return (
    <>
      <div className="ref-seccion">
        <button
          className="ref-seccion-hd"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={`refs-panel-${trabajo.id}`}
        >
          <span className="ref-seccion-nombre">{trabajo.nombre}</span>
          <div className="ref-seccion-end">
            {total !== null && (
              <span className="ref-count" aria-label={`${activas} activas de ${total}`}>
                {activas}/{total}
              </span>
            )}
            <span
              className={`ref-chevron${expanded ? ' ref-chevron--open' : ''}`}
              aria-hidden="true"
            >
              ›
            </span>
          </div>
        </button>

        {expanded && (
          <div id={`refs-panel-${trabajo.id}`} className="ref-seccion-body">
            {isAdmin && (
              <div className="ref-toolbar">
                <button className="ref-btn ref-btn--upload" onClick={() => setModal('subir')}>
                  + Subir referencia
                </button>
              </div>
            )}

            {loadingR && (
              <div className="ref-grid" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ref-card-skeleton" aria-hidden="true" />
                ))}
              </div>
            )}

            {!loadingR && refs?.length === 0 && (
              <div className="ref-empty">
                <p>Sin referencias para este trabajo.</p>
                {isAdmin && (
                  <button className="ref-btn ref-btn--primary" onClick={() => setModal('subir')}>
                    + Subir la primera
                  </button>
                )}
              </div>
            )}

            {!loadingR && refs?.length > 0 && (
              <div className="ref-grid" role="list" aria-label={`Referencias de ${trabajo.nombre}`}>
                {refs.map((r) => (
                  <ReferenciaCard
                    key={r.id}
                    item={r}
                    isAdmin={isAdmin}
                    onEdit={setEditItem}
                    onDeleted={handleDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales lazy */}
      {modal === 'subir' && (
        <Suspense fallback={null}>
          <ModalSubir
            trabajo={trabajo}
            onClose={() => setModal(null)}
            onSuccess={handleSubirSuccess}
          />
        </Suspense>
      )}
      {editItem && (
        <Suspense fallback={null}>
          <ModalEditar
            item={editItem}
            onClose={() => setEditItem(null)}
            onSave={handleEditSave}
          />
        </Suspense>
      )}
    </>
  );
}