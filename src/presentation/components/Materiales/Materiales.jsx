// src/presentation/components/Materiales/Materiales.jsx
// Sprint 14 — Migración a React Query
// ♻️  Sprint 18 — Refactorización modular: 2 hooks + subcomponentes + CSS por responsabilidad

import './Materiales.page.css';
import './Materiales.grid.css';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/useAuth';
import {
  useMaterialesConColores,
  useActualizarVariante,
} from '../../hooks/useMateriales';
import { ToastContainer } from './Notificaciones/NotiMateriales';
import { useToasts } from './Notificaciones/useToasts';
import { useMaterialesFiltros }  from './hooks/useMaterialesFiltros';
import { useMaterialesActions }  from './hooks/useMaterialesActions';
import Buscador      from './Buscador/Buscador';
import MatCardAdmin   from './MatCard/MatCardAdmin';
import MatCardVendedor from './MatCard/MatCardVendedor';
import SkeletonCard   from './MatCard/SkeletonCard';
import Paginacion     from './Paginacion/Paginacion';

export default function Materiales() {
  const { user }    = useAuth();
  const esAdmin     = user?.rol === 'ADMIN';
  const esVendedor  = user?.rol === 'VENDEDOR';
  const queryClient = useQueryClient();

  const {
    data:      rawData = [],
    isLoading: loading,
    isError,
    refetch,
  } = useMaterialesConColores();

  const actualizarVariante = useActualizarVariante();
  const { toasts, push: pushToast, remove: removeToast } = useToasts();

  const {
    grupos,
    gruposFiltrados,
    gruposPagina,
    totalPaginas,
    busqueda,
    setBusqueda,
    busquedaDebounced,
    pagina,
    setPagina,
  } = useMaterialesFiltros(rawData);

  const {
    seleccionEfectiva,
    editandoEfectivo,
    guardando,
    handleSeleccionar,
    handleCampo,
    handleGuardar,
  } = useMaterialesActions({ grupos, esAdmin, actualizarVariante, queryClient, pushToast });

  return (
    <main className="inv-container">
      <h1 className="sr-only">
        {esAdmin ? 'Inventario de Materiales' : 'Consulta de Stock'}
      </h1>

      {esVendedor && (
        <div className="inv-readonly-banner" role="status">
          📋 Modo consulta — solo puedes ver stock y precios
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Buscador
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        gruposFiltrados={gruposFiltrados}
        busquedaDebounced={busquedaDebounced}
      />

      {loading && (
        <div id="inv-grid" className="inv-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && isError && (
        <div className="inv-error" role="alert">
          <p>No se pudo cargar el inventario. Verifica tu conexión.</p>
          <button className="btn-action btn-action--sm" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !isError && gruposFiltrados.length === 0 && (
        <div className="inv-empty" role="status">
          <p>No se encontraron materiales{busquedaDebounced ? ` para "${busquedaDebounced}"` : ''}.</p>
        </div>
      )}

      {!loading && !isError && gruposPagina.length > 0 && (
        <div id="inv-grid" className="inv-grid">
          {gruposPagina.map(([key, variantes]) => {
            const activo = seleccionEfectiva[key];
            const edit   = editandoEfectivo[key];
            if (!activo) return null;

            return esAdmin ? (
              <MatCardAdmin
                key={key} cardKey={key}
                variantes={variantes} activo={activo} edit={edit}
                onSeleccionar={handleSeleccionar}
                onCampo={handleCampo}
                onGuardar={handleGuardar}
                guardando={!!guardando[key]}
              />
            ) : (
              <MatCardVendedor
                key={key} cardKey={key}
                variantes={variantes} activo={activo}
                onSeleccionar={handleSeleccionar}
              />
            );
          })}
        </div>
      )}

      <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
    </main>
  );
}