// src/presentation/components/Previsualizacion/usePrevisualizacion.js
// Sprint 18 — extraído de Previsualizacion.jsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTrabajos, useColores } from '../../hooks/useCatalogos';
import { usePreviewToasts } from './Notificaciones/usePreviewToasts';
import { PREVIEW_MAP } from './constants';
import { validarMedida, separarColorYAlpha, MEDIDA_MIN, MEDIDA_MAX } from './utils';

export function usePrevisualizacion() {
  /* ── Catálogos ─────────────────────────────────────────────────────────── */
  const { data: trabajos = [], isLoading: cargandoTrabajos } = useTrabajos();
  const { data: colores  = [], isLoading: cargandoColores  } = useColores();

  /* ── Trabajo seleccionado ──────────────────────────────────────────────── */
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);

  useEffect(() => {
    if (trabajos.length > 0 && trabajoSeleccionado === null) {
      setTrabajoSeleccionado(trabajos[0]);
    }
  }, [trabajos]);                                   // eslint-disable-line

  /* ── Colores ───────────────────────────────────────────────────────────── */
  const coloresMarco  = useMemo(() => colores.filter((c) => c.tipo === 'MARCO'),  [colores]);
  const coloresVidrio = useMemo(() => colores.filter((c) => c.tipo === 'VIDRIO'), [colores]);

  const marcoDefault  = useMemo(() => colores.find((c) => c.tipo === 'MARCO')  ?? null, [colores]);
  const vidrioDefault = useMemo(() => colores.find((c) => c.tipo === 'VIDRIO') ?? null, [colores]);

  const [marcoSel,  setMarcoSel]  = useState(null);
  const [vidrioSel, setVidrioSel] = useState(null);

  const marcoActivo  = marcoSel  ?? marcoDefault;
  const vidrioActivo = vidrioSel ?? vidrioDefault;

  /* ── Medidas ───────────────────────────────────────────────────────────── */
  const [anchoStr, setAnchoStr] = useState('1.50');
  const [altoStr,  setAltoStr]  = useState('1.20');

  const anchoValido = useMemo(() => validarMedida(anchoStr), [anchoStr]);
  const altoValido  = useMemo(() => validarMedida(altoStr),  [altoStr]);

  /* ── IA ────────────────────────────────────────────────────────────────── */
  const [iaAbierto,   setIaAbierto]   = useState(false);
  const [iaResultado, setIaResultado] = useState(null);

  /* ── Toasts ────────────────────────────────────────────────────────────── */
  const { toasts, remove: removeToast, warning, info } = usePreviewToasts();

  /* ── Componente de preview activo ──────────────────────────────────────── */
  const PreviewComponent = useMemo(() =>
    trabajoSeleccionado ? (PREVIEW_MAP[trabajoSeleccionado.nombre] ?? null) : null,
  [trabajoSeleccionado]);

  /* ── Colores descompuestos para el canvas ──────────────────────────────── */
  const { hex: colorMarcoHex,  alpha: opacidadMarco  } =
    useMemo(() => separarColorYAlpha(marcoActivo?.valor),  [marcoActivo]);
  const { hex: colorVidrioHex, alpha: opacidadVidrio } =
    useMemo(() => separarColorYAlpha(vidrioActivo?.valor), [vidrioActivo]);

  /* ── Flags de estado ───────────────────────────────────────────────────── */
  const puedeRenderizar =
    PreviewComponent     &&
    marcoActivo          &&
    vidrioActivo         &&
    anchoValido !== null &&
    altoValido  !== null;

  const puedeUsarIA = !!(trabajoSeleccionado && marcoActivo && vidrioActivo);

  const mensajeEstado = useMemo(() => {
    if (!trabajoSeleccionado) return 'Seleccione un tipo de trabajo para comenzar.';
    if (!PreviewComponent)    return `Vista previa de "${trabajoSeleccionado.nombre}" no disponible.`;
    if (!marcoActivo)         return 'Seleccione un color de aluminio.';
    if (!vidrioActivo)        return 'Seleccione un color de vidrio.';
    if (anchoValido === null) return `Ingrese un ancho válido (${MEDIDA_MIN}–${MEDIDA_MAX} m).`;
    if (altoValido  === null) return `Ingrese un alto válido (${MEDIDA_MIN}–${MEDIDA_MAX} m).`;
    return null;
  }, [trabajoSeleccionado, PreviewComponent, marcoActivo, vidrioActivo, anchoValido, altoValido]);

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleAncho = useCallback((e) => {
    const val = e.target.value;
    setAnchoStr(val);
    if (!Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > MEDIDA_MAX)
      warning(`El ancho máximo es ${MEDIDA_MAX} m.`);
  }, [warning]);

  const handleAlto = useCallback((e) => {
    const val = e.target.value;
    setAltoStr(val);
    if (!Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > MEDIDA_MAX)
      warning(`El alto máximo es ${MEDIDA_MAX} m.`);
  }, [warning]);

  const handleTrabajo = useCallback((e) => {
    const t = trabajos.find((x) => x.id === Number(e.target.value));
    setTrabajoSeleccionado(t ?? null);
    setIaResultado(null);
    if (t && !PREVIEW_MAP[t.nombre])
      info(`Vista previa no disponible para "${t.nombre}" todavía.`);
  }, [trabajos, info]);

  const handleSelMarco  = useCallback((c) => { setMarcoSel(c);  setIaResultado(null); }, []);
  const handleSelVidrio = useCallback((c) => { setVidrioSel(c); setIaResultado(null); }, []);

  const handleAbrirIA          = useCallback((onAbrirIA) => { if (puedeUsarIA && onAbrirIA) onAbrirIA(); }, [puedeUsarIA]);
  const handleCerrarIA         = useCallback(() => setIaAbierto(false), []);
  const handleResultadoIA      = useCallback((img) => { setIaResultado(img); setIaAbierto(false); }, []);
  const handleLimpiarResultado = useCallback(() => setIaResultado(null), []);

  const handleGuardarIA = useCallback(() => {
    if (!iaResultado) return;
    const a = document.createElement('a');
    a.href     = iaResultado;
    a.download = `va_ia_${trabajoSeleccionado?.nombre ?? 'resultado'}_${Date.now()}.jpg`;
    a.click();
  }, [iaResultado, trabajoSeleccionado]);

  return {
    /* catálogos */
    trabajos, cargandoTrabajos,
    coloresMarco, coloresVidrio, cargandoColores,
    /* estado */
    trabajoSeleccionado, marcoActivo, vidrioActivo,
    anchoStr, altoStr, anchoValido, altoValido,
    iaAbierto, iaResultado,
    /* colores canvas. */
    colorMarcoHex, colorVidrioHex, opacidadMarco, opacidadVidrio,
    /* flags */
    PreviewComponent, puedeRenderizar, puedeUsarIA, mensajeEstado,
    /* toasts */
    toasts, removeToast,
    /* handlers */
    handleAncho, handleAlto, handleTrabajo,
    handleSelMarco, handleSelVidrio,
    handleAbrirIA, handleCerrarIA, handleResultadoIA,
    handleLimpiarResultado, handleGuardarIA,
  };
}
