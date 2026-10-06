// CortinasBanoPreview.jsx — Sprint 8
// Sprint 15 — Canvas y OrbitControls con lazy()
// Sprint 18 DT-IA-01 — imports estáticos + frameloop="always"

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CortinasBanoScene from "./CortinasBanoScene";
import "./CortinasBano3D.css";

const TIPO_OPTS    = ["Vidrio", "Esmerilado"];
const SISTEMA_OPTS = ["Corrediza", "Batiente"];

export default function CortinasBanoPreview({
  ancho,
  alto,
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const [tipo,    setTipo]    = useState("Esmerilado");
  const [sistema, setSistema] = useState("Corrediza");

  const anchoN = Number.parseFloat(ancho) || 1.2;
  const altoN  = Number.parseFloat(alto)  || 1.8;

  const areaTotal = useMemo(() => +(anchoN * altoN).toFixed(2), [anchoN, altoN]);

  const handleTipo    = (v) => TIPO_OPTS.includes(v)    && setTipo(v);
  const handleSistema = (v) => SISTEMA_OPTS.includes(v) && setSistema(v);

  return (
    <div className="cortinas-bano-preview">

      <div className="cortinas-bano-controles fila">
        <div className="control-group">
          <span className="control-label">Tipo</span>
          {TIPO_OPTS.map(t => (
            <button key={t} className={tipo === t ? "active" : ""} onClick={() => handleTipo(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Sistema</span>
          {SISTEMA_OPTS.map(s => (
            <button key={s} className={sistema === s ? "active" : ""} onClick={() => handleSistema(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="cortinas-bano-render">
        <Canvas
          frameloop="demand"
          gl={{
            powerPreference: "high-performance",
            antialias: true,
            depth: true,
            stencil: false,
          }}
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
          <CortinasBanoScene
            ancho={anchoN}
            alto={altoN}
            tipo={tipo}
            sistema={sistema}
            colorMarco={colorMarco}
            colorVidrio={colorVidrio}
          />
        </Canvas>
      </div>

      <div className="cortinas-bano-info">
        <span><b>Tipo:</b> {tipo}</span>
        <span><b>Ancho:</b> {anchoN.toFixed(2)} m</span>
        <span><b>Alto:</b> {altoN.toFixed(2)} m</span>
        <span><b>Área:</b> {areaTotal.toFixed(2)} m²</span>
      </div>

    </div>
  );
}
