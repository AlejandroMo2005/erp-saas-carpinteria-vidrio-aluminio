// CieloRasoPreview.jsx — Sprint 8
// Cambios mínimos: sanitización de props, CSS variables, colorMarcoHex.
// Sprint 15 — Canvas y OrbitControls con lazy() — mismo patrón que AnaquelPreview
// Sprint 18 DT-IA-01 — imports estáticos para Canvas y OrbitControls.
// 🐛 Fix Sprint 18: frameloop="always" + onCreated invalidate
//    — Con "demand" el canvas queda en blanco hasta la primera interacción.

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CieloRasoScene from "./CieloRasoScene";
import "./CieloRaso3D.css";

const TIPO_OPTS    = ["Drywall", "PVC"];
const ACABADO_OPTS = ["Liso", "Texturizado"];
const LAMPARA_OPTS = ["Centro", "Esquinas", "Mixto"];

export default function CieloRasoPreview({
  ancho,
  alto,
  colorMarcoHex = "#cccccc",
}) {
  const [tipo,         setTipo]         = useState("Drywall");
  const [acabado,      setAcabado]      = useState("Liso");
  const [modoLamparas, setModoLamparas] = useState("Centro");

  const anchoN = Number.parseFloat(ancho) || 3;
  const altoN  = Number.parseFloat(alto)  || 4;

  const numPlanchas = useMemo(() => {
    if (tipo === "PVC") return Math.ceil(anchoN / 0.25);
    return Math.ceil(anchoN / 0.6) * Math.ceil(altoN / 0.6);
  }, [anchoN, altoN, tipo]);

  const areaTotal = useMemo(() => +(anchoN * altoN).toFixed(2), [anchoN, altoN]);

  const handleTipo    = (v) => TIPO_OPTS.includes(v)    && setTipo(v);
  const handleAcabado = (v) => ACABADO_OPTS.includes(v) && setAcabado(v);
  const handleLampara = (v) => LAMPARA_OPTS.includes(v) && setModoLamparas(v);

  return (
    <div className="cielo-raso-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="cielo-raso-controles fila">
        <div className="control-group">
          <span className="control-label">Tipo</span>
          {TIPO_OPTS.map(t => (
            <button key={t} className={tipo === t ? "active" : ""} onClick={() => handleTipo(t)}>
              {t}
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
          <span className="control-label">Lámparas</span>
          {LAMPARA_OPTS.map(m => (
            <button key={m} className={modoLamparas === m ? "active" : ""} onClick={() => handleLampara(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="cielo-raso-render">
        <Canvas
          frameloop="always"
          onCreated={(state) => {
            window.dispatchEvent(new Event("resize"));
            state.invalidate();
          }}
          gl={{ powerPreference: "high-performance", antialias: true, depth: true, stencil: false }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.6, 3], fov: 60, near: 0.05, far: 200 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[0, -5, 0]} intensity={0.5} />
          <pointLight position={[0, -1, 0]} intensity={0.8} color="#fff8dc" />
          <OrbitControls
            makeDefault
            enablePan={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            minDistance={0.3}
            target={[0, 1.6, 0]}
          />
          <CieloRasoScene
            ancho={anchoN}
            alto={altoN}
            tipo={tipo}
            acabado={acabado}
            colorMarcoHex={colorMarcoHex}
            modoLamparas={modoLamparas}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="cielo-raso-info">
        <span><b>Planchas</b> {numPlanchas}</span>
        <span><b>Ancho</b> {anchoN.toFixed(2)} m</span>
        <span><b>Largo</b> {altoN.toFixed(2)} m</span>
        <span><b>Área</b> {areaTotal} m²</span>
      </div>

    </div>
  );
}
