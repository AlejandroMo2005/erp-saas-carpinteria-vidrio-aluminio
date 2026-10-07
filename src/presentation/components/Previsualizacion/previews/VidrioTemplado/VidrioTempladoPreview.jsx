// VidrioTempladoPreview.jsx — Sprint 8
// 🔧 Sprint 15 — Canvas y OrbitControls con lazy() — mismo patrón que AnaquelPreview
// 🔧 Sprint 18 DT-IA-01 — imports estáticos, frameloop="always", sin Suspense en Canvas.
// 🐛 Fix Sprint 18: frameloop="always" + onCreated invalidate
//    — Con "demand" el canvas queda en blanco hasta la primera interacción.

import { useState, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import VidrioTempladoScene from "./VidrioTempladoScene";
import "./VidriosTemplados3D.css";

const TIPO_OPTS      = ["Corrediza", "Abatible"];
const DIRECCION_OPTS = ["izquierda", "derecha", "centro"];

export default function VidrioTempladoPreview({
  ancho,
  alto,
  colorMarcoHex  = "#888888",
  colorVidrioHex = "#0064ff",
  opacidadMarco  = 1,
  opacidadVidrio = 0.3,
}) {
  const [tipo,      setTipo]      = useState("Corrediza");
  const [estado,    setEstado]    = useState("cerrada");
  const [direccion, setDireccion] = useState("derecha");

  const anchoN = Number.parseFloat(ancho) || 3.0;
  const altoN  = Number.parseFloat(alto)  || 2.4;

  const handleTipo      = (v) => { if (TIPO_OPTS.includes(v))      { setTipo(v); setEstado("cerrada"); } };
  const handleDireccion = (v) => DIRECCION_OPTS.includes(v) && setDireccion(v);

  const apertura = useMemo(() => {
    if (estado === "entreabierta") return 0.5;
    if (estado === "abierta")      return 1;
    return 0;
  }, [estado]);

  const toggleEstado = useCallback(() => {
    setEstado(prev =>
      prev === "cerrada"      ? "entreabierta" :
      prev === "entreabierta" ? "abierta" : "cerrada"
    );
  }, []);

  const numPuertasMoviles = useMemo(() => (anchoN < 5 ? 1 : 2), [anchoN]);
  const areaTotal = useMemo(() => +(anchoN * altoN).toFixed(2),         [anchoN, altoN]);
  const pesoAprox = useMemo(() => +(anchoN * altoN * 25).toFixed(1),    [anchoN, altoN]);
  const perimetro = useMemo(() => +((anchoN + altoN) * 2).toFixed(2),   [anchoN, altoN]);

  const estadoTexto = { cerrada: "🔒 Cerrada", entreabierta: "🔓 Entreabierta", abierta: "✅ Abierta" };
  const dirIcono    = { izquierda: "← Izquierda", derecha: "Derecha →", centro: "↔ Centro" };

  return (
    <div className="vidrio-templado-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="vidrio-templado-controles">
        <div className="control-group">
          <span className="control-label">Sistema</span>
          {TIPO_OPTS.map(t => (
            <button key={t} className={tipo === t ? "active" : ""} onClick={() => handleTipo(t)}>{t}</button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Dirección</span>
          {DIRECCION_OPTS.map(d => (
            <button key={d} className={`${direccion === d ? "active" : ""} btn-direccion`} onClick={() => handleDireccion(d)}>
              {dirIcono[d]}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Control</span>
          <button className={`btn-estado ${estado}`} onClick={toggleEstado}>
            {estadoTexto[estado]}
          </button>
        </div>
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="vidrio-templado-render">
        <Canvas
          frameloop="always"
          onCreated={(state) => {
            window.dispatchEvent(new Event("resize"));
            state.invalidate();
          }}
          gl={{ powerPreference: "high-performance", antialias: true, depth: true, stencil: false }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 2, 6], fov: 60, near: 0.05, far: 200 }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]}   intensity={0.8} castShadow
            shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
          <directionalLight position={[-3, 5, -3]} intensity={0.3} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={0.3}
            target={[0, altoN / 2, 0]}
          />
          <VidrioTempladoScene
            ancho={anchoN}
            alto={altoN}
            tipo={tipo}
            apertura={apertura}
            direccion={direccion}
            colorMarco={colorMarcoHex}
            colorVidrio={colorVidrioHex}
            opacidadMarco={opacidadMarco}
            opacidadVidrio={opacidadVidrio}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="vidrio-templado-info">
        <span><b>Puertas móviles:</b> {numPuertasMoviles}</span>
        <span><b>Sistema:</b> {tipo}</span>
        <span><b>Estado:</b> {estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
        <span><b>Dirección:</b> {direccion.charAt(0).toUpperCase() + direccion.slice(1)}</span>
        <span><b>Área:</b> {areaTotal.toFixed(2)} m²</span>
        <span><b>Perímetro:</b> {perimetro.toFixed(2)} m</span>
        <span><b>Peso aprox:</b> {pesoAprox.toFixed(1)} kg</span>
      </div>

    </div>
  );
}
