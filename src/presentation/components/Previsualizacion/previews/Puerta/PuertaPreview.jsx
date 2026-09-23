// PuertaPreview.jsx — Sprint 8
// 🔧 Sprint 15 — Canvas y OrbitControls con lazy() — mismo patrón que AnaquelPreview
// 🔧 Sprint 18 DT-IA-01 — Canvas y OrbitControls como imports estáticos.
// 🐛 Fix Sprint 18: frameloop="always" + onCreated invalidate
//    — Con "demand" el canvas queda en blanco hasta la primera interacción.

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import PuertaScene from "./PuertaScene";
import "./Puertas3D.css";

const HOJAS_OPTS    = [1, 2, 3, 4];
const TIPO_OPTS     = ["Corrediza", "Abatible"];
const MATERIAL_OPTS = ["Vidrio", "Aluminio", "Mixta"];

export default function PuertaPreview({
  ancho,
  alto,
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const [hojas,    setHojas]    = useState(2);
  const [tipo,     setTipo]     = useState("Corrediza");
  const [material, setMaterial] = useState("Mixta");

  const anchoN = parseFloat(ancho) || 1.5;
  const altoN  = parseFloat(alto)  || 2.1;

  const anchoHoja = useMemo(() => anchoN / hojas,               [anchoN, hojas]);
  const areaTotal = useMemo(() => +(anchoN * altoN).toFixed(2), [anchoN, altoN]);

  const handleHojas    = (v) => HOJAS_OPTS.includes(v)    && setHojas(v);
  const handleTipo     = (v) => TIPO_OPTS.includes(v)     && setTipo(v);
  const handleMaterial = (v) => MATERIAL_OPTS.includes(v) && setMaterial(v);

  return (
    <div className="puerta-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="puerta-controles fila">
        <div className="control-group">
          <span className="control-label">Hojas</span>
          {HOJAS_OPTS.map(n => (
            <button key={n} className={hojas === n ? "active" : ""} onClick={() => handleHojas(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Tipo</span>
          {TIPO_OPTS.map(t => (
            <button key={t} className={tipo === t ? "active" : ""} onClick={() => handleTipo(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Material</span>
          {MATERIAL_OPTS.map(m => (
            <button key={m} className={material === m ? "active" : ""} onClick={() => handleMaterial(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="puerta-render">
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
          <PuertaScene
            hojas={hojas}
            anchoHoja={anchoHoja}
            alto={altoN}
            tipo={tipo}
            material={material}
            colorMarco={colorMarco}
            colorVidrio={colorVidrio}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="puerta-info">
        <span><b>Hojas:</b> {hojas}</span>
        <span><b>Ancho hoja:</b> {anchoHoja.toFixed(2)} m</span>
        <span><b>Alto:</b> {altoN.toFixed(2)} m</span>
        <span><b>Área:</b> {areaTotal.toFixed(2)} m²</span>
      </div>

    </div>
  );
}