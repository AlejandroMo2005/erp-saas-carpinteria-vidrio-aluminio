// hooks/useVisualizadorIA.js
// Sprint 18 — extraído de VisualizadorIA.jsx para separar lógica de vista

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTrabajos, useColores } from '../../../hooks/useCatalogos';

export function useVisualizadorIA(trabajoIdInicial = '', colorIdInicial = '') {
  const { data: trabajos = [], isLoading: cargandoTrabajos } = useTrabajos();
  const { data: colores  = [], isLoading: cargandoColores  } = useColores();

  const [tab,         setTab]         = useState('catalogo');
  const [trabajoId,   setTrabajoId]   = useState(trabajoIdInicial);
  const [colorId,     setColorId]     = useState(colorIdInicial);
  const [promptLibre, setPromptLibre] = useState('');
  const [fase,        setFase]        = useState('config');
  const [fotoSrc,     setFotoSrc]     = useState(null);
  const [fotoFile,    setFotoFile]    = useState(null);
  const [error,       setError]       = useState(null);
  const [progreso,    setProgreso]    = useState(0);
  const [resultado,   setResultado]   = useState(null);
  const [promptUsado, setPromptUsado] = useState('');
  const [samCargando, setSamCargando] = useState(false);
  const [samError,    setSamError]    = useState(null);

  const timerRef      = useRef(null);
  const procesarIARef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const coloresMarco  = colores.filter(c => c.tipo === 'MARCO');
  const coloresVidrio = colores.filter(c => c.tipo === 'VIDRIO');
  const configValida  = tab === 'catalogo'
    ? !!(trabajoId && colorId)
    : promptLibre.trim().length >= 5;
  const trabajoActual = trabajos.find(t => String(t.id) === String(trabajoId));
  const colorActual   = colores.find(c => String(c.id) === String(colorId));

  const handleArchivo = useCallback((e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('Solo imágenes (JPG, PNG, WEBP).'); return; }
    if (archivo.size > 10 * 1024 * 1024)   { setError('Máximo 10 MB.');                   return; }
    setFotoFile(archivo);
    const reader = new FileReader();
    reader.onload  = (ev) => {
      setFotoSrc(ev.target.result);
      setError(null); setSamError(null); setFase('mascara');
    };
    reader.onerror = () => setError('No se pudo leer el archivo.');
    reader.readAsDataURL(archivo);
    e.target.value = '';
  }, []);

  const volverAFoto   = useCallback(() => {
    setFotoSrc(null); setFotoFile(null);
    setError(null); setSamError(null); setFase('foto');
  }, []);

  const volverAConfig = useCallback(() => { setFase('config'); setError(null); }, []);

  const procesarIA = useCallback(async (mascaraBlob) => {
    setFase('procesando'); setError(null); setProgreso(5);

    timerRef.current = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 82) { clearInterval(timerRef.current); return 82; }
        return prev + Math.random() * 4 + 1;
      });
    }, 900);

    try {
      const form = new FormData();
      if (fotoFile) {
        form.append('imagen', fotoFile, fotoFile.name);
      } else {
        const blob = await fetch(fotoSrc).then(r => r.blob());
        form.append('imagen', blob, 'foto.jpg');
      }
      form.append('mascara', mascaraBlob, 'mascara.png');

      if (tab === 'catalogo') {
        form.append('trabajo_id', String(trabajoId));
        form.append('color_id',   String(colorId));
      } else {
        form.append('trabajo_id',   '0');
        form.append('color_id',     colorId ? String(colorId) : '0');
        form.append('prompt_libre', promptLibre.trim());
      }

      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '';
      const response = await fetch('/api/ia/visualizar', {
        method:  'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    form,
        signal:  AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw Object.assign(
          new Error(errData?.error ?? `HTTP ${response.status}`),
          { response: { status: response.status, data: errData } },
        );
      }

      const data = await response.json();
      clearInterval(timerRef.current);
      setProgreso(100);

      if (data?.ok && data?.imagen_base64) {
        setResultado(`data:${data.mime_type ?? 'image/png'};base64,${data.imagen_base64}`);
        setPromptUsado(data.prompt ?? '');
        setFase('resultado');
      } else {
        throw new Error(data?.error ?? 'La IA no devolvió imagen.');
      }

    } catch (err) {
      clearInterval(timerRef.current);
      setProgreso(0);
      const status = err?.response?.status;
      let msg;
      if      (status === 404)              msg = 'Trabajo o color no encontrado.';
      else if (status === 422)              msg = err?.response?.data?.error ?? 'Datos inválidos.';
      else if (status === 502)              msg = 'Error en la IA externa. Intenta de nuevo.';
      else if (err.name === 'TimeoutError') msg = 'Tiempo de espera agotado (>2 min). Intenta de nuevo.';
      else msg = err?.response?.data?.error ?? err.message ?? 'Error al procesar con IA.';
      setError(msg);
      setFase('mascara');
    }
  }, [fotoFile, fotoSrc, tab, trabajoId, colorId, promptLibre]);

  procesarIARef.current = procesarIA;

  const handleMascaraLista = useCallback((blob) => {
    procesarIARef.current?.(blob);
  }, []);

  const detectarZonaAuto = useCallback(async () => {
    setSamCargando(true); setSamError(null);
    try {
      const form = new FormData();
      if (fotoFile) {
        form.append('imagen', fotoFile, fotoFile.name);
      } else {
        const blob = await fetch(fotoSrc).then(r => r.blob());
        form.append('imagen', blob, 'foto.jpg');
      }
      form.append('punto_x', '50');
      form.append('punto_y', '50');

      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '';
      const response = await fetch('/api/ia/mascara-auto', {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    form,
        signal:  AbortSignal.timeout(70_000),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data?.ok || !data?.mascara_base64) throw new Error('SAM no devolvió máscara');

      const mascaraBlob = await fetch(
        `data:${data.mime_type ?? 'image/png'};base64,${data.mascara_base64}`
      ).then(r => r.blob());

      setSamCargando(false);
      procesarIARef.current?.(mascaraBlob);

    } catch (err) {
      setSamCargando(false);
      setSamError(
        err.name === 'TimeoutError'
          ? 'SAM tardó demasiado. Selecciona la zona manualmente.'
          : err.message ?? 'No se pudo detectar la zona automáticamente.'
      );
    }
  }, [fotoFile, fotoSrc]);

  const descargar = useCallback(() => {
    const a = document.createElement('a');
    a.href = resultado;
    a.download = `visualizacion_ia_${Date.now()}.png`;
    a.click();
  }, [resultado]);

  const nuevaVisualizacion = useCallback(() => {
    setFase('foto'); setFotoSrc(null); setFotoFile(null);
    setResultado(null); setPromptUsado(''); setError(null); setSamError(null);
  }, []);

  return {
    // catálogo
    trabajos, cargandoTrabajos, colores, cargandoColores,
    coloresMarco, coloresVidrio,
    // estado
    tab, setTab,
    trabajoId, setTrabajoId,
    colorId, setColorId,
    promptLibre, setPromptLibre,
    fase, setFase,
    fotoSrc, fotoFile,
    error, progreso, resultado, promptUsado,
    samCargando, samError,
    // derivados
    configValida, trabajoActual, colorActual,
    // handlers
    handleArchivo, volverAFoto, volverAConfig,
    handleMascaraLista, detectarZonaAuto,
    descargar, nuevaVisualizacion,
  };
}