'use strict';
import { useReferencias } from './hooks/useReferencias';
import Filtro    from './Filtros/Filtro';
import GrupoTipo from './Grupos/GrupoTipo';
import './Referencias.css';
import './Grupos/Grupos.css';

export default function Referencias() {
  const {
    isAdmin, isVendedor,
    grupos, loading, error,
    filtro, setFiltro,
    tiposTodos, tiposVisibles,
  } = useReferencias();

  if (!isAdmin && !isVendedor) return null;

  return (
    <section className="ref-root" aria-labelledby="ref-title">
      <header className="ref-header">
        <div className="ref-header-text">
          <h2 id="ref-title" className="ref-title">Imágenes de Referencia</h2>
          <p className="ref-subtitle">
            {isAdmin
              ? 'Administra las fotos que guían el estilo de las generaciones IA.'
              : 'Galería de referencias por tipo de trabajo.'}
          </p>
        </div>
        {isAdmin && (
          <span className="ref-role-badge" aria-label="Modo administrador">ADMIN</span>
        )}
      </header>

      {!loading && (
        <Filtro
          filtro={filtro}
          setFiltro={setFiltro}
          tiposTodos={tiposTodos}
          grupos={grupos}
        />
      )}

      {loading && (
        <div className="ref-loading-full" aria-busy="true">
          {[1, 2, 3].map((i) => <div key={i} className="ref-grupo-skeleton" aria-hidden="true" />)}
        </div>
      )}

      {!loading && error && (
        <div className="ref-error-state" role="alert">
          <p>{error}</p>
          <button className="ref-btn ref-btn--primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && tiposVisibles.length === 0 && (
        <div className="ref-empty-state">
          <p>No se encontraron trabajos{filtro ? ` para "${filtro}"` : ''}.</p>
          {filtro && (
            <button className="ref-btn ref-btn--ghost" onClick={() => setFiltro('')}>
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {!loading && !error && tiposVisibles.length > 0 && (
        <div className="ref-grupos-list">
          {tiposVisibles.map((tipo) => (
            <GrupoTipo
              key={tipo}
              tipo={tipo}
              variantes={grupos[tipo]}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </section>
  );
}