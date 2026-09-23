// presentation/components/Perfil/Perfil.jsx
// Sprint 7  — Modal de edición de perfil propio
// Sprint 18 — Refactor: hook usePerfil + CSS parciales
// El campo "rol" es solo lectura. Llama a PUT /api/usuarios/me

import './Perfil.css';
import { usePerfil } from './usePerfil';

/* ── Iconos ──────────────────────────────────────────────────────────────── */
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/* ── Constantes ──────────────────────────────────────────────────────────── */
const ROL_LABELS = {
  ADMIN:    'Administrador',
  VENDEDOR: 'Vendedor',
  ALMACEN:  'Almacén',
};

/* ── Componente ──────────────────────────────────────────────────────────── */
export default function Perfil({ usuario, onCerrar, onGuardado }) {
  const {
    form, handleChange,
    cambiarPass, toggleCambiarPass,
    passForm, handlePassChange,
    cargando, error, exito,
    handleSubmit,
  } = usePerfil({ usuario, onGuardado });

  return (
    <div className="perfil-overlay" onClick={onCerrar}>
      <div className="perfil-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="perfil-modal__header">
          <div className="perfil-modal__title-group">
            <div className="perfil-modal__avatar">
              {(usuario?.nombre_completo || usuario?.nombre || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="perfil-modal__title">Mi perfil</h2>
              <span className="perfil-modal__rol">
                {ROL_LABELS[usuario?.rol] ?? usuario?.rol}
              </span>
            </div>
          </div>
          <button className="perfil-modal__close" onClick={onCerrar} aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        {/* Formulario */}
        <form className="perfil-modal__body" onSubmit={handleSubmit}>

          <p className="perfil-modal__section-label">Datos personales</p>

          <div className="perfil-modal__row">
            <div className="perfil-modal__field">
              <label htmlFor="pf-nombre_completo">Nombre completo</label>
              <input id="pf-nombre_completo" name="nombre_completo" type="text"
                value={form.nombre_completo} onChange={handleChange}
                placeholder="Ej. Juan Pérez" autoComplete="name" />
            </div>
            <div className="perfil-modal__field">
              <label htmlFor="pf-telefono">Teléfono</label>
              <input id="pf-telefono" name="telefono" type="tel"
                value={form.telefono} onChange={handleChange}
                placeholder="Ej. 0991234567" autoComplete="tel" />
            </div>
          </div>

          <div className="perfil-modal__row">
            <div className="perfil-modal__field">
              <label htmlFor="pf-email">Correo electrónico</label>
              <input id="pf-email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="correo@ejemplo.com" autoComplete="email" />
            </div>
            <div className="perfil-modal__field">
              <label htmlFor="pf-cedula_ruc">Cédula / RUC</label>
              <input id="pf-cedula_ruc" name="cedula_ruc" type="text"
                value={form.cedula_ruc} onChange={handleChange}
                placeholder="10 o 13 dígitos" maxLength={13} />
            </div>
          </div>

          <div className="perfil-modal__field perfil-modal__field--full">
            <label htmlFor="pf-direccion">Dirección</label>
            <input id="pf-direccion" name="direccion" type="text"
              value={form.direccion} onChange={handleChange}
              placeholder="Ej. Av. Quito y Calle 5, Local 2"
              autoComplete="street-address" />
          </div>

          {/* Sección contraseña */}
          <div className="perfil-modal__pass-toggle">
            <button
              type="button"
              className={`perfil-modal__pass-btn${cambiarPass ? ' is-active' : ''}`}
              onClick={toggleCambiarPass}
            >
              <IconLock />
              {cambiarPass ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
            </button>
          </div>

          {cambiarPass && (
            <div className="perfil-modal__pass-fields">
              <div className="perfil-modal__field perfil-modal__field--full">
                <label htmlFor="pf-passActual">Contraseña actual</label>
                <input id="pf-passActual" name="passwordActual" type="password"
                  value={passForm.passwordActual} onChange={handlePassChange}
                  autoComplete="current-password" />
              </div>
              <div className="perfil-modal__row">
                <div className="perfil-modal__field">
                  <label htmlFor="pf-passNueva">Nueva contraseña</label>
                  <input id="pf-passNueva" name="password" type="password"
                    value={passForm.password} onChange={handlePassChange}
                    autoComplete="new-password" />
                </div>
                <div className="perfil-modal__field">
                  <label htmlFor="pf-passConfirm">Confirmar contraseña</label>
                  <input id="pf-passConfirm" name="passwordConfirm" type="password"
                    value={passForm.passwordConfirm} onChange={handlePassChange}
                    autoComplete="new-password" />
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {error && <p className="perfil-modal__feedback perfil-modal__feedback--error">{error}</p>}
          {exito && <p className="perfil-modal__feedback perfil-modal__feedback--ok">{exito}</p>}

          {/* Acciones */}
          <div className="perfil-modal__actions">
            <button type="button" className="perfil-modal__btn-cancel" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="perfil-modal__btn-save" disabled={cargando}>
              {cargando
                ? <span className="perfil-modal__spinner" />
                : <><IconSave /> Guardar cambios</>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}