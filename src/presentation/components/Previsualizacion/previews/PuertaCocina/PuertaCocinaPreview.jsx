// PuertaCocinaPreview.jsx — Sprint 8
// 🔧 Sprint 15 — Canvas y OrbitControls con lazy() — mismo patrón que AnaquelPreview
// 🔧 Sprint 18 DT-IA-01 — imports estáticos, frameloop="always", sin Suspense en Canvas.
// 🐛 Fix Sprint 18: frameloop="always" + onCreated invalidate
//    — Con "demand" el canvas queda en blanco hasta la primera interacción...

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import PuertaCocinaScene from "./PuertaCocinaScene";
import "./PuertaCocina3D.css";

const HOJAS_OPTS   = [1, 2];
const ACABADO_OPTS = ["Lacado", "Madera", "Vidrio"];

export default function PuertaCocinaPreview({
  ancho,
  alto,
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const [hojas,     setHojas]     = useState(2);
  const [acabado,   setAcabado]   = useState("Lacado");
  const [conVidrio, setConVidrio] = useState(false);
  const [apertura,  setApertura]  = useState(0.5);

  const anchoN = parseFloat(ancho) || 0.6;
  const altoN  = parseFloat(alto)  || 0.7;

  const anchoHoja = useMemo(() => anchoN / hojas,               [anchoN, hojas]);
  const areaTotal = useMemo(() => +(anchoN * altoN).toFixed(2), [anchoN, altoN]);

  const handleHojas    = (v) => HOJAS_OPTS.includes(v)   && setHojas(v);
  const handleAcabado  = (v) => ACABADO_OPTS.includes(v) && setAcabado(v);
  const toggleApertura = () => setApertura(prev => prev >= 0.9 ? 0 : 1);

  return (
    <div className="puerta-cocina-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="puerta-cocina-controles fila">
        <div className="control-group">
          <span className="control-label">Hojas</span>
          {HOJAS_OPTS.map(n => (
            <button key={n} className={hojas === n ? "active" : ""} onClick={() => handleHojas(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Acabado</span>
          {ACABADO_OPTS.map(a => (
            <button key={a} className={acabado === a ? "active" : ""} onClick={() => handleAcabado(a)}>
              {a}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Con Vidrio</span>
          <button className={conVidrio ? "active" : ""} onClick={() => setConVidrio(v => !v)}>
            {conVidrio ? "Sí" : "No"}
          </button>
        </div>
        <div className="control-group">
          <span className="control-label">Estado</span>
          <button
            className={apertura >= 0.9 ? "active" : ""}
            onClick={toggleApertura}
            style={{
              backgroundColor: apertura >= 0.9 ? "var(--success-color, #16a34a)" : "var(--danger-color, #dc2626)",
              borderColor:     apertura >= 0.9 ? "var(--success-color, #16a34a)" : "var(--danger-color, #dc2626)",
              color: "#fff",
            }}
          >
            {apertura >= 0.9 ? "Abiertas" : apertura === 0 ? "Cerradas" : "Entreabiertas"}
          </button>
        </div>
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="puerta-cocina-render">
        <Canvas
          frameloop="always"
          onCreated={(state) => {
            window.dispatchEvent(new Event("resize"));
            state.invalidate();
          }}
          gl={{ powerPreference: "high-performance", antialias: true, depth: true, stencil: false }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.4, 4.5], fov: 45, near: 0.05, far: 200 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 4]} intensity={0.9} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={0.3}
            maxDistance={10}
            target={[0, altoN / 2, 0]}
          />
          <PuertaCocinaScene
            hojas={hojas}
            anchoHoja={anchoHoja}
            alto={altoN}
            acabado={acabado}
            conVidrio={conVidrio}
            colorMarco={colorMarco}
            colorVidrio={colorVidrio}
            apertura={apertura}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="puerta-cocina-info">
        <span><b>Hojas:</b> {hojas}</span>
        <span><b>Ancho hoja:</b> {anchoHoja.toFixed(2)} m</span>
        <span><b>Alto:</b> {altoN.toFixed(2)} m</span>
        <span><b>Área:</b> {areaTotal.toFixed(2)} m²</span>
      </div>

    </div>
  );
}
