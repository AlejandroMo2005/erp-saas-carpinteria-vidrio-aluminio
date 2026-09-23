import { Search, UserPlus, User, X, CheckCircle, AlertCircle } from 'lucide-react';
import useSelectorCliente from './useSelectorCliente';
import { TIPO_ID }        from './constants';
import './SelectorCliente.css';

const LISTBOX_ID = 'sc-listbox';

export default function SelectorCliente({
  onSeleccionar,
  onLimpiar,
  clienteSeleccionado = null,
  disabled = false,
}) {
  const {
    modo, setModo,
    query, resultados, buscando, mostrarLista, focusedIndex,
    errorBusqueda,
    nuevoCliente, erroresForm, guardando,
    inputRef, listRef,
    handleQueryChange, handleKeyDown,
    handleSeleccionar, handleLimpiar,
    handleGuardarCliente, handleCampoNuevo,
    cancelarCreacion,
  } = useSelectorCliente({ onSeleccionar, onLimpiar });

  // Cliente ya seleccionado
  if (clienteSeleccionado) {
    return (
      <div className="sc-seleccionado">
        <div className="sc-seleccionado__icono">
          <User size={20} aria-hidden="true" />
        </div>
        <div className="sc-seleccionado__info">
          <span className="sc-seleccionado__nombre">{clienteSeleccionado.nombre}</span>
          {clienteSeleccionado.identificacion && (
            <span className="sc-seleccionado__id">
              {clienteSeleccionado.tipo_identificacion}: {clienteSeleccionado.identificacion}
            </span>
          )}
          {clienteSeleccionado.telefono && (
            <span className="sc-seleccionado__tel">{clienteSeleccionado.telefono}</span>
          )}
        </div>
        {!disabled && (
          <button type="button" onClick={handleLimpiar}
            className="sc-seleccionado__limpiar"
            aria-label="Quitar cliente seleccionado">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="sc-wrapper">

      {/* Toggle modos */}
      <div className="sc-modos">
        <button type="button" onClick={() => setModo('buscar')}
          className={`sc-modo-btn${modo === 'buscar' ? ' sc-modo-btn--active' : ''}`}>
          <Search size={16} aria-hidden="true" />
          <span>Buscar cliente</span>
        </button>
        <button type="button" onClick={() => setModo('crear')}
          className={`sc-modo-btn${modo === 'crear' ? ' sc-modo-btn--active' : ''}`}>
          <UserPlus size={16} aria-hidden="true" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Modo buscar */}
      {modo === 'buscar' && (
        <div className="sc-buscar">
          <div className="sc-buscar__campo" ref={inputRef}
            role="combobox" aria-expanded={mostrarLista}
            aria-controls={LISTBOX_ID} aria-owns={LISTBOX_ID} aria-haspopup="listbox">
            <Search size={18} className="sc-buscar__icono" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Nombre o teléfono del cliente..."
              className="sc-buscar__input"
              aria-label="Buscar cliente"
              aria-autocomplete="list"
              aria-controls={LISTBOX_ID}
              aria-activedescendant={focusedIndex >= 0 ? `sc-option-${focusedIndex}` : undefined}
              disabled={disabled}
              autoComplete="off"
            />
            {buscando && <div className="sc-buscar__spinner" aria-hidden="true" />}
          </div>

          {errorBusqueda && (
            <div className="sc-buscar__error" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errorBusqueda}</span>
            </div>
          )}

          {mostrarLista && (
            <ul id={LISTBOX_ID} className="sc-lista" ref={listRef}
              role="listbox" aria-label="Resultados de búsqueda">
              {resultados.length === 0 ? (
                <li className="sc-lista__vacio" role="option" aria-selected="false">
                  Sin resultados — prueba con otro nombre o crea el cliente
                </li>
              ) : (
                resultados.map((cliente, idx) => (
                  <li key={cliente.id} id={`sc-option-${idx}`}
                    className={`sc-lista__item${focusedIndex === idx ? ' sc-lista__item--focused' : ''}`}
                    role="option" aria-selected={false}
                    onClick={() => handleSeleccionar(cliente)}>
                    <User size={16} className="sc-lista__item-icono" aria-hidden="true" />
                    <div className="sc-lista__item-info">
                      <span className="sc-lista__item-nombre">{cliente.nombre}</span>
                      <span className="sc-lista__item-detalle">
                        {cliente.telefono}
                        {cliente.identificacion && ` · ${cliente.identificacion}`}
                      </span>
                    </div>
                    <CheckCircle size={16} className="sc-lista__item-check" aria-hidden="true" />
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {/* Modo crear */}
      {modo === 'crear' && (
        <form onSubmit={handleGuardarCliente} className="sc-form" noValidate
          aria-label="Formulario nuevo cliente">

          {erroresForm.general && (
            <div className="sc-form__error-general" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{erroresForm.general}</span>
            </div>
          )}

          <div className="sc-form__grupo">
            <label className="sc-form__label" htmlFor="sc-nombre">
              Nombre / Razón Social <span aria-hidden="true">*</span>
            </label>
            <input id="sc-nombre" name="nombre" type="text"
              value={nuevoCliente.nombre} onChange={handleCampoNuevo}
              className={`sc-form__input${erroresForm.nombre ? ' sc-form__input--error' : ''}`}
              placeholder="Ej: Juan Pérez o Empresa S.A." disabled={guardando} />
            {erroresForm.nombre &&
              <span className="sc-form__msg-error" role="alert">{erroresForm.nombre}</span>}
          </div>

          <div className="sc-form__grupo">
            <label className="sc-form__label" htmlFor="sc-telefono">
              Teléfono <span aria-hidden="true">*</span>
            </label>
            <input id="sc-telefono" name="telefono" type="tel"
              value={nuevoCliente.telefono} onChange={handleCampoNuevo}
              className={`sc-form__input${erroresForm.telefono ? ' sc-form__input--error' : ''}`}
              placeholder="Ej: 0991234567" disabled={guardando} />
            {erroresForm.telefono &&
              <span className="sc-form__msg-error" role="alert">{erroresForm.telefono}</span>}
          </div>

          <div className="sc-form__grupo">
            <label className="sc-form__label" htmlFor="sc-tipo-id">Tipo de identificación</label>
            <select id="sc-tipo-id" name="tipo_identificacion"
              value={nuevoCliente.tipo_identificacion} onChange={handleCampoNuevo}
              className="sc-form__select" disabled={guardando}>
              {Object.entries(TIPO_ID).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {nuevoCliente.tipo_identificacion !== 'CONSUMIDOR_FINAL' && (
            <div className="sc-form__grupo">
              <label className="sc-form__label" htmlFor="sc-identificacion">
                {TIPO_ID[nuevoCliente.tipo_identificacion]?.label}{' '}
                <span aria-hidden="true">*</span>
              </label>
              <input id="sc-identificacion" name="identificacion" type="text"
                value={nuevoCliente.identificacion} onChange={handleCampoNuevo}
                className={`sc-form__input${erroresForm.identificacion ? ' sc-form__input--error' : ''}`}
                placeholder={
                  nuevoCliente.tipo_identificacion === 'RUC'    ? 'Ej: 1234567890001' :
                  nuevoCliente.tipo_identificacion === 'CEDULA' ? 'Ej: 1712345678'    :
                  'Número de pasaporte'
                }
                maxLength={TIPO_ID[nuevoCliente.tipo_identificacion]?.longitud ?? 20}
                disabled={guardando} />
              {erroresForm.identificacion &&
                <span className="sc-form__msg-error" role="alert">{erroresForm.identificacion}</span>}
            </div>
          )}

          <div className="sc-form__grupo">
            <label className="sc-form__label" htmlFor="sc-email">
              Correo electrónico <span className="sc-form__opcional">(opcional)</span>
            </label>
            <input id="sc-email" name="email" type="email"
              value={nuevoCliente.email} onChange={handleCampoNuevo}
              className={`sc-form__input${erroresForm.email ? ' sc-form__input--error' : ''}`}
              placeholder="ejemplo@correo.com" disabled={guardando} />
            {erroresForm.email &&
              <span className="sc-form__msg-error" role="alert">{erroresForm.email}</span>}
          </div>

          <div className="sc-form__grupo">
            <label className="sc-form__label" htmlFor="sc-direccion">
              Dirección <span className="sc-form__opcional">(opcional)</span>
            </label>
            <input id="sc-direccion" name="direccion" type="text"
              value={nuevoCliente.direccion} onChange={handleCampoNuevo}
              className="sc-form__input"
              placeholder="Calle principal y secundaria" disabled={guardando} />
          </div>

          <div className="sc-form__acciones">
            <button type="button" disabled={guardando}
              onClick={cancelarCreacion}
              className="sc-form__btn sc-form__btn--cancelar">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="sc-form__btn sc-form__btn--guardar">
              {guardando ? 'Guardando...' : 'Crear cliente'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}