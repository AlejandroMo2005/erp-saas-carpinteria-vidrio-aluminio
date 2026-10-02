// VisualizadorIA.jsx
// Sprint 18 — Refactorizado: lógica → useVisualizadorIA, UI → subcomponentes

import { useNavigate, useSearchParams } from 'react-router-dom';
import './VisualizadorIA.css';
import { useVisualizadorIA }  from './hooks/useVisualizadorIA';
import { AccessibilityPanel } from '../common/AccessibilityPanel';
import ConfigPanel             from './ConfigPanel/ConfigPanel';
import MascaraPanel            from './MascaraPanel/MascaraPanel';
import ProcesandoPanel         from './ProcesandoPanel/ProcesandoPanel';
import ResultadoPanel          from './ResultadoPanel/ResultadoPanel';

export default function VisualizadorIA() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const v = useVisualizadorIA(
    searchParams.get('trabajo_id') ?? '',
    searchParams.get('color_id')   ?? '',
  );

  return (
    <div className="via-root">
      <AccessibilityPanel />

      <header className="via-header">
        <button type="button" className="via-btn-back" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <div className="via-header-title">
          <span className="via-badge" aria-hidden="true">IA</span>
          <h1>Visualizador con IA</h1>
          <p>Fotografía un espacio y mira cómo quedaría con el trabajo instalado</p>
        </div>
      </header>

      <main className="via-body">

        {(v.fase === 'config' || v.fase === 'foto') && (
          <ConfigPanel
            tab={v.tab}                     setTab={v.setTab}
            trabajos={v.trabajos}           cargandoTrabajos={v.cargandoTrabajos}
            colores={v.colores}             cargandoColores={v.cargandoColores}
            coloresMarco={v.coloresMarco}   coloresVidrio={v.coloresVidrio}
            trabajoId={v.trabajoId}         setTrabajoId={v.setTrabajoId}
            colorId={v.colorId}             setColorId={v.setColorId}
            promptLibre={v.promptLibre}     setPromptLibre={v.setPromptLibre}
            configValida={v.configValida}
            fase={v.fase}
            error={v.error}
            handleArchivo={v.handleArchivo}
            volverAConfig={v.volverAConfig}
            onContinuar={() => v.setFase('foto')}
          />
        )}

        {v.fase === 'mascara' && (
          <MascaraPanel
            tab={v.tab}
            trabajoActual={v.trabajoActual}   trabajoId={v.trabajoId}
            colorActual={v.colorActual}
            promptLibre={v.promptLibre}
            error={v.error}
            samCargando={v.samCargando}       samError={v.samError}
            detectarZonaAuto={v.detectarZonaAuto}
            fotoSrc={v.fotoSrc}
            handleMascaraLista={v.handleMascaraLista}
            volverAFoto={v.volverAFoto}
          />
        )}

        {v.fase === 'procesando' && (
          <ProcesandoPanel fotoSrc={v.fotoSrc} progreso={v.progreso} />
        )}

        {v.fase === 'resultado' && v.resultado && (
          <ResultadoPanel
            fotoSrc={v.fotoSrc}
            resultado={v.resultado}
            promptUsado={v.promptUsado}
            onDescargar={v.descargar}
            onNuevaVisualizacion={v.nuevaVisualizacion}
            onVolver={() => navigate(-1)}
          />
        )}

      </main>
    </div>
  );
}