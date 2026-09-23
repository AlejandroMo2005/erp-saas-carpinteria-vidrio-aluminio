import { X, Save, Phone, MapPin, Mail, FileText, Package } from 'lucide-react';
import useModalProveedor from './useModalProveedor';
import './ModalProveedor.css';

export default function ModalProveedor({ proveedor, onClose, onGuardado }) {
  const {
    esEdicion,
    form, cambiar,
    materiales, seleccionados, toggleMaterial,
    guardando, error,
    guardar,
  } = useModalProveedor({ proveedor, onGuardado });

  return (
    <div className="mprov-overlay" role="dialog" aria-modal="true"
      aria-labelledby="mprov-titulo">
      <div className="mprov-modal">

        <div className="mprov-header">
          <h2 id="mprov-titulo" className="mprov-title">
            {esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <button className="mprov-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {error && <p className="mprov-error" role="alert">{error}</p>}

        <div className="mprov-body">

          <div className="mprov-field">
            <label htmlFor="mprov-nombre" className="mprov-label">
              Nombre del proveedor *
            </label>
            <input id="mprov-nombre" name="nombre" value={form.nombre}
              onChange={cambiar} className="mprov-input"
              placeholder="Ej. Alumex Ecuador" autoComplete="organization" />
          </div>

          <div className="mprov-row">
            <div className="mprov-field">
              <label htmlFor="mprov-ciudad" className="mprov-label">
                <MapPin size={14} aria-hidden="true" />
                Ciudad
              </label>
              <input id="mprov-ciudad" name="ciudad" value={form.ciudad}
                onChange={cambiar} className="mprov-input"
                placeholder="Ej. Guayaquil" autoComplete="address-level2" />
            </div>

            <div className="mprov-field">
              <label htmlFor="mprov-telefono" className="mprov-label">
                <Phone size={14} aria-hidden="true" />
                WhatsApp
              </label>
              <p id="mprov-tel-hint" className="mprov-hint-field">
                Formato internacional: 593XXXXXXXXX
              </p>
              <input id="mprov-telefono" name="telefono_whatsapp"
                value={form.telefono_whatsapp} onChange={cambiar}
                className="mprov-input" placeholder="593987654321"
                type="tel" autoComplete="tel"
                aria-describedby="mprov-tel-hint" />
            </div>
          </div>

          <div className="mprov-field">
            <label htmlFor="mprov-email" className="mprov-label">
              <Mail size={14} aria-hidden="true" />
              Correo electrónico
            </label>
            <input id="mprov-email" name="email" value={form.email}
              onChange={cambiar} className="mprov-input"
              placeholder="proveedor@ejemplo.com"
              type="email" autoComplete="email" />
          </div>

          <div className="mprov-field">
            <label htmlFor="mprov-notas" className="mprov-label">
              <FileText size={14} aria-hidden="true" />
              Notas
            </label>
            <textarea id="mprov-notas" name="notas" value={form.notas}
              onChange={cambiar} className="mprov-textarea"
              placeholder="Horario de atención, descuentos, etc."
              rows={3} />
          </div>

          <fieldset className="mprov-fieldset">
            <legend className="mprov-legend">
              <Package size={14} aria-hidden="true" />
              Materiales que suministra
            </legend>
            <p id="mprov-mat-hint" className="mprov-hint">
              Selecciona los materiales que este proveedor puede suministrar.
            </p>
            <div className="mprov-materiales" aria-describedby="mprov-mat-hint">
              {materiales.map(m => (
                <label key={m.id} className="mprov-material-item">
                  <input type="checkbox"
                    checked={seleccionados.includes(m.id)}
                    onChange={() => toggleMaterial(m.id)}
                    className="mprov-checkbox" />
                  <span className="mprov-material-nombre">{m.nombre}</span>
                  <span className="mprov-material-stock"
                    aria-label={`Stock actual: ${m.stock}`}>
                    Stock: {m.stock}
                  </span>
                </label>
              ))}
              {materiales.length === 0 && (
                <p className="mprov-empty-list">No hay materiales registrados</p>
              )}
            </div>
          </fieldset>

        </div>

        <div className="mprov-footer">
          <button className="mprov-btn mprov-btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="mprov-btn mprov-btn--primary"
            onClick={guardar} disabled={guardando} aria-busy={guardando}>
            <Save size={16} aria-hidden="true" />
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  );
}