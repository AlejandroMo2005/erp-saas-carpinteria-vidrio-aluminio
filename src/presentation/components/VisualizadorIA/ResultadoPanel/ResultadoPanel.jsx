// ResultadoPanel/ResultadoPanel.jsx

export default function ResultadoPanel({
  fotoSrc, resultado, promptUsado,
  onDescargar, onNuevaVisualizacion, onVolver,
}) {
  return (
    <div className="via-card">
      <h2 className="via-resultado-titulo">Resultado</h2>
      <div className="via-resultado-compare" role="group" aria-label="Comparación original vs resultado">
        <div className="via-compare-lado">
          <span className="via-compare-label" aria-hidden="true">Original</span>
          <img src={fotoSrc} alt="Foto original del espacio" />
        </div>
        <div className="via-compare-lado">
          <span className="via-compare-label via-compare-label--ia" aria-hidden="true">Con IA ✨</span>
          <img src={resultado} alt="Espacio con el trabajo instalado, generado por IA" />
        </div>
      </div>
      {promptUsado && (
        <details className="via-prompt-detail">
          <summary>Ver prompt utilizado</summary>
          <p className="via-prompt-texto">{promptUsado}</p>
        </details>
      )}
      <div className="via-resultado-actions">
        <button type="button" className="via-btn via-btn--primary" onClick={onDescargar}>
          ⬇ Descargar imagen
        </button>
        <button type="button" className="via-btn via-btn--ghost" onClick={onNuevaVisualizacion}>
          Nueva visualización
        </button>
        <button type="button" className="via-btn via-btn--ghost" onClick={onVolver}>
          Volver al Visualizador
        </button>
      </div>
    </div>
  );
}