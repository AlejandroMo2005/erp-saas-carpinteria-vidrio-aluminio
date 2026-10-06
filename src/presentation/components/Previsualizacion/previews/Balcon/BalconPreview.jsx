// BalconPreview.jsx — Sprint 8
// Fix: frameloop="demand", gl powerPreference, near=0.05, colorMarcoHex
// Sprint 15 — Canvas y OrbitControls con lazy() — mismo patrón que AnaquelPreview
// Sprint 18 DT-IA-01 — imports estáticos para Canvas y OrbitControls.
// 🐛 Fix Sprint 18: frameloop="always" + onCreated invalidate
//    — Con "demand" el canvas queda en blanco hasta la primera interacción.

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BalconScene from "./BalconScene";
import "./Balcones3D.css";

const MATERIAL_OPTS = ["Vidrio", "Esmerilado", "Ahumado"];

export default function BalconPreview({
  ancho,
  alto,
  _colorMarco     = "#888888",
  _colorVidrio    = "#88aaff",
  colorMarcoHex   = "#888888",
  colorVidrioHex  = "#88aaff",
  opacidadVidrio  = 0.3,
}) {
  const [material, setMaterial] = useState("Vidrio");

  const anchoN = Number.parseFloat(ancho) || 1.5;
  const altoN  = Number.parseFloat(alto) || 1.0;

  const areaTotal = useMemo(
    () => +(anchoN * altoN).toFixed(2),
    [anchoN, altoN]
  );

  const perimetro = useMemo(
    () => +(anchoN + 1.2 * 2).toFixed(2),
    [anchoN]
  );

  const handleMaterial = (v) =>
    MATERIAL_OPTS.includes(v) && setMaterial(v);

  const camY = altoN * 0.5;
  const camZ = Math.max(anchoN, altoN) * 1.8 + 1.5;

  return (
    <div className="balcon-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="cielo-raso-controles fila">
        <div className="control-group">
          <span className="control-label">Material</span>

          {MATERIAL_OPTS.map(m => (
            <button
              key={m}
              className={material === m ? "active" : ""}
              onClick={() => handleMaterial(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="balcon-render">
        <Canvas
          frameloop="always"
          onCreated={(state) => {
            window.dispatchEvent(new Event("resize"));
            state.invalidate();
          }}
          gl={{
            powerPreference: "high-performance",
            antialias: true,
            depth: true,
            stencil: false
          }}
          dpr={[1, 1.5]}
          camera={{
            position: [0, camY, camZ],
            fov: 50,
            near: 0.05,
            far: 200
          }}
        >
          <ambientLight intensity={0.65} />

          <directionalLight
            position={[3, 5, 4]}
            intensity={0.9}
          />

          <directionalLight
            position={[-2, 2, -2]}
            intensity={0.2}
          />

          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={0.3}
            maxDistance={camZ * 2.5}
            target={[0, camY, 0]}
          />

          <BalconScene
            ancho={anchoN}
            alto={altoN}
            material={material}
            colorMarco={colorMarcoHex}
            colorVidrio={colorVidrioHex}
            opacidadVidrio={opacidadVidrio}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="cielo-raso-info">
        <span><b>Ancho</b> {anchoN.toFixed(2)} m</span>
        <span><b>Alto</b> {altoN.toFixed(2)} m</span>
        <span><b>Perímetro</b> {perimetro} m</span>
        <span><b>Área barandal</b> {areaTotal} m²</span>
      </div>

    </div>
  );
}
