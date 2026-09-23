// Proformas.jsx
// Sprint 14 — Migración a React Query
// Sprint 18 — Refactorizado: lógica → useProformas, UI → subcomponentes

import React from 'react';
import './Proformas.css';
import { useAuth } from '../../context/AuthContext';
import { useProformas } from './hooks/useProformas';
import {
  useProformaToasts,
  ProformaToastContainer,
} from './Notificaciones/NotiProformas';
import AutocompleteCliente from './AutocompleteCliente/AutocompleteCliente';
import ItemTrabajo         from './ItemTrabajo/ItemTrabajo';
import { sanitizar }      from './utils/proformaUtils';

export default function Proformas({ onAgendar }) {
  const { user } = useAuth();

  const { toasts, remove: removeToast,
    ok: toastOk, error: toastError, warning: toastWarning, info: toastInfo,
  } = useProformaToasts();

  const p = useProformas({ onAgendar, toastOk, toastError, toastWarning, toastInfo });

  return (
    <div className="proforma-container">
      <ProformaToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="main-card" role="main">
        <h1 className="header-title">
          {p.esCliente ? 'Solicitar Presupuesto' : 'Proformas'}
        </h1>

        {p.esCliente && (
          <div className="proforma-cliente-banner" role="status">
            📋 Completa los detalles de tu trabajo y te enviaremos una cotización.
            Si el material solicitado no está disponible en el color elegido,
            indícalo en el campo <strong>Detalle</strong>.
          </div>
        )}

        {/* ── Datos del cliente ── */}
        <section className="top-inputs" aria-label="Datos del cliente">
          <div className="input-group">
            <label htmlFor="cliente">
              {p.esCliente ? 'Tu nombre' : 'Cliente'}
              {p.esSistema && p.clienteVinculado && (
                <span className="label-hint"> — editando datos de cliente registrado</span>
              )}
            </label>
            {p.esSistema ? (
              <AutocompleteCliente
                value={p.cliente}
                onChange={p.setCliente}
                onSelect={p.handleSeleccionarCliente}
                onClear={p.handleDesvincular}
                clienteVinculado={p.clienteVinculado}
              />
            ) : (
              <input
                id="cliente"
                value={p.cliente}
                readOnly
                className="field-readonly"
                aria-label="Tu nombre (no editable)"
                title="Tu nombre se toma de tu cuenta registrada"
              />
            )}
          </div>

          <div className="input-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono" type="tel"
              value={p.telefono}
              onChange={(e) => p.setTelefono(e.target.value)}
              maxLength={15} autoComplete="tel" aria-required="true"
              placeholder={p.esCliente ? '0999999999' : undefined}
            />
          </div>

          <div className="input-group">
            <span id="fecha-label" className="fecha-label-text">Fecha</span>
            <div id="fecha" className="fecha-fija" role="status"
              aria-label={`Fecha de emisión: ${p.fecha}`}>
              {new Date().toLocaleDateString('es-EC', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="fechaAg">{p.esCliente ? 'Fecha deseada' : 'Agendamiento'}</label>
            <input
              id="fechaAg" type="date"
              value={p.fechaAgendamiento}
              min={p.fecha}
              onChange={(e) => p.setFechaAgendamiento(e.target.value)}
              aria-label="Fecha de agendamiento"
            />
          </div>
        </section>

        {/* ── Items de trabajo ── */}
        {p.items.map((it, idx) => (
          <ItemTrabajo
            key={it.id} item={it} idx={idx}
            trabajos={p.trabajos}   coloresDB={p.coloresDB}
            mapaColores={p.mapaColores}
            onUpdate={p.handleUpdate} onRemove={p.handleRemoveItem}
            puedeEliminar={p.items.length > 1}
            loadingTrabajos={p.loadingTrabajos}
            loadingColores={p.loadingColores}
          />
        ))}

        <button
          type="button" className="add-work-btn"
          onClick={p.handleAddItem}
          aria-label="Agregar otro trabajo a la proforma"
        >
          + Agregar Trabajo
        </button>

        {/* ── Resumen ── */}
        <section className="summary-section" aria-label="Resumen de la proforma">
          <div className="summary-total-container">
            <span className="section-label">TOTAL ESTIMADO</span>
            <span className="total-amount" aria-label={`Total: $${p.resumen.total.toFixed(2)}`}>
              ${p.resumen.total.toFixed(2)}
            </span>
          </div>

          <div className="breakdown-container">
            <div className="breakdown-item">
              <span className="breakdown-label">Subtotal</span>
              <span className="breakdown-value">${p.resumen.subtotal.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">IVA {(p.resumen.iva_valor * 100).toFixed(0)}%</span>
              <span className="breakdown-value">${p.resumen.iva.toFixed(2)}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button type="button" className="btn-secondary"
              onClick={p.calcularProforma} disabled={p.calculando} aria-busy={p.calculando}>
              {p.calculando ? 'Calculando…' : p.resumen.total > 0 ? 'Recalcular' : 'Calcular'}
            </button>

            {p.esSistema && (
              <button type="button" className="btn-whatsapp"
                onClick={p.enviarWhatsApp}
                disabled={!p.telefono.trim() || p.resumen.total <= 0}
                aria-label="Enviar proforma por WhatsApp">
                Enviar a WhatsApp
              </button>
            )}

            <button type="button" className="btn-save"
              onClick={p.agendar} disabled={p.agendando} aria-busy={p.agendando}>
              {p.agendando
                ? 'Enviando…'
                : p.esCliente ? 'Enviar Solicitud' : 'Agendar Pedido'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}