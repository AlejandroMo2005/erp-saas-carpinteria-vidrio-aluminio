// src/presentation/components/Materiales/Buscador/Buscador.jsx
// Sprint 18 — Refactorización modular

import './Buscador.css';

export default function Buscador({ busqueda, setBusqueda, gruposFiltrados, busquedaDebounced }) {
  return (
    <section className="search-section">
      <label htmlFor="main-search" className="sr-only">Buscar material por nombre</label>
      <input
        id="main-search"
        type="search"
        placeholder="BUSCAR MATERIAL..."
        className="search-input"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        autoComplete="off"
        aria-controls="inv-grid"
      />
      {gruposFiltrados.length > 0 && (
        <p className="search-resultados" aria-live="polite" aria-atomic="true">
          {gruposFiltrados.length} material{gruposFiltrados.length !== 1 ? 'es' : ''}
          {busquedaDebounced ? ` para "${busquedaDebounced}"` : ''}
        </p>
      )}
    </section>
  );
}