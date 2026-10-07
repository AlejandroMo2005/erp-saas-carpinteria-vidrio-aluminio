// VitrinaPreview.jsx — Sprint 8
// 🔧 Sprint 15 — Canvas y OrbitControls con lazy(), frameloop="demand",
//    gl powerPreference, near=0.05. Fixes menores: anchoHoja/areaTotal
//    con fallback para evitar NaN cuando ancho/alto llegan como string.
// 🔧 Sprint 18 DT-IA-01 — imports estáticos, frameloop="always", sin Suspense en Canvas.
// 🐛 Fix Sprint 18: frameloop="always" + onCreated invalidate
//    — Con "demand" el canvas queda en blanco hasta la primera interacción.

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import VitrinaScene from "./VitrinaScene";
import "./Vitrinas3D.css";

const HOJAS_OPTS = [1, 2, 3];
const TIPO_OPTS  = ["Corrediza", "Fija", "Abatible"];

export default function VitrinaPreview({
  ancho,
  alto,
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const [hojas,       setHojas]       = useState(2);
  const [tipo,        setTipo        ] = useState("Corrediza");
  const [conEstantes, setConEstantes] = useState(true);

  const anchoN = Number.parseFloat(ancho) || 1.2;
  const altoN  = Number.parseFloat(alto)  || 1.8;

  const anchoHoja = useMemo(() => anchoN / hojas,               [anchoN, hojas]);
  const areaTotal = useMemo(() => +(anchoN * altoN).toFixed(2), [anchoN, altoN]);
  const camZ      = useMemo(() => Math.max(anchoN, altoN) * 1.6 + 1.5, [anchoN, altoN]);

  const handleHojas = (v) => HOJAS_OPTS.includes(v) && setHojas(v);
  const handleTipo  = (v) => TIPO_OPTS.includes(v)  && setTipo(v);

  return (
    <div className="vitrina-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="vitrina-controles fila">
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
          <span className="control-label">Estantes</span>
          <button className={conEstantes ? "active" : ""} onClick={() => setConEstantes(v => !v)}>
            {conEstantes ? "Sí" : "No"}
          </button>
        </div>
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="vitrina-render">
        <Canvas
          frameloop="always"
          onCreated={(state) => {
            window.dispatchEvent(new Event("resize"));
            state.invalidate();
          }}
          gl={{ powerPreference: "high-performance", antialias: true, depth: true, stencil: false }}
          dpr={[1, 1.5]}
          camera={{ position: [0, altoN / 2, camZ], fov: 45, near: 0.05, far: 200 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 4]} intensity={0.9} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={0.3}
            maxDistance={camZ * 2.5}
            target={[0, altoN / 2, 0]}
          />
          <VitrinaScene
            hojas={hojas}
            anchoHoja={anchoHoja}
            alto={altoN}
            tipo={tipo}
            conEstantes={conEstantes}
            colorMarco={colorMarco}
            colorVidrio={colorVidrio}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="vitrina-info">
        <span><b>Hojas:</b> {hojas}</span>
        <span><b>Ancho hoja:</b> {anchoHoja.toFixed(2)} m</span>
        <span><b>Alto:</b> {altoN.toFixed(2)} m</span>
        <span><b>Área total:</b> {areaTotal.toFixed(2)} m²</span>
      </div>

    </div>
  );
}
