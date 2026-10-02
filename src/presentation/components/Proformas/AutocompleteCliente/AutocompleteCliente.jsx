import { useState, useEffect, useRef, memo } from 'react';
// AutocompleteCliente/AutocompleteCliente.jsx

import api from '../../../api/api';
import { TEXTO_MAX } from '../constants/proformaConstants';
import './AutocompleteCliente.css';

const AutocompleteCliente = memo(function AutocompleteCliente({
  value, onChange, onSelect, onClear, clienteVinculado,
}) {
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrando,   setMostrando]   = useState(false);
  const [buscando,    setBuscando]    = useState(false);
  const [indiceSel,   setIndiceSel]   = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (clienteVinculado && value === clienteVinculado.nombre) return;
    if (!value || value.trim().length < 2) {
      setSugerencias([]); setMostrando(false); return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await api.get(`/usuarios/buscar?q=${encodeURIComponent(value.trim())}&limite=6`);
        if (res.data?.success) {
          setSugerencias(res.data.data || []);
          setMostrando((res.data.data || []).length > 0);
          setIndiceSel(-1);
        }
      } catch {
        setSugerencias([]);
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [value, clienteVinculado]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setMostrando(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!mostrando || sugerencias.length === 0) return;
    if (e.key === 'ArrowDown')                       { e.preventDefault(); setIndiceSel((p) => Math.min(p + 1, sugerencias.length - 1)); }
    else if (e.key === 'ArrowUp')                    { e.preventDefault(); setIndiceSel((p) => Math.max(p - 1, -1)); }
    else if (e.key === 'Enter' && indiceSel >= 0)    { e.preventDefault(); onSelect(sugerencias[indiceSel]); setMostrando(false); }
    else if (e.key === 'Escape')                     setMostrando(false);
  };

  const nombreVisible = (c) => c.nombre_completo || c.nombre || '—';

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <div className="autocomplete-input-wrap">
        <input
          id="cliente"
          role="combobox"
          aria-expanded={mostrando}
          aria-haspopup="listbox"
          aria-controls="ac-listbox-cliente"
          aria-autocomplete="list"
          aria-required="true"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => sugerencias.length > 0 && setMostrando(true)}
          maxLength={TEXTO_MAX}
          autoComplete="off"
        />
        {buscando && <span className="autocomplete-spinner" aria-hidden="true" />}
        {clienteVinculado && (
          <span className="autocomplete-badge" title="Cliente registrado vinculado">
            ✓ Registrado
            <button
              type="button"
              className="autocomplete-badge-clear"
              onClick={onClear}
              aria-label="Desvincular cliente registrado"
            >×</button>
          </span>
        )}
      </div>

      {mostrando && sugerencias.length > 0 && (
        <ul
          className="autocomplete-dropdown"
          id="ac-listbox-cliente"
          role="listbox"
          aria-label="Clientes registrados"
        >
          {sugerencias.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === indiceSel}
              className={`autocomplete-option ${i === indiceSel ? 'is-active' : ''}`}
              onMouseDown={() => { onSelect(c); setMostrando(false); setSugerencias([]); }}
            >
              <span className="autocomplete-option__nombre">{nombreVisible(c)}</span>
              <span className="autocomplete-option__meta">
                {c.telefono   && <span>{c.telefono}</span>}
                {c.cedula_ruc && <span>{c.cedula_ruc}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default AutocompleteCliente;
