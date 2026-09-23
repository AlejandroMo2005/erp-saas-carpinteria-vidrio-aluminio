// previews/Anaquel/AnaquelPreview.jsx
// Sprint 18 DT-IA-01 — imports estáticos para Canvas, OrbitControls y AnaquelScene.
// 🐛 Fix Sprint 18: frameloop="always" + invalidate en onCreated
//    — Con frameloop="demand" el canvas quedaba en blanco hasta la primera
//      interacción porque dispatch("resize") no llama a invalidate() internamente.
//    — "always" garantiza que R3F renderice continuamente, incluyendo el primer
//      frame y el frame posterior al resize que aplica el CSS del chunk lazy.

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AnaquelScene from "./AnaquelScene";
import "./Anaqueles3D.css";

const NIVELES_OPTS     = [3, 4, 5, 6];
const MATERIAL_OPTS    = ["Madera", "Metal", "Vidrio"];
const PROFUNDIDAD_OPTS = [0.25, 0.30, 0.40];
const PUERTA_OPTS      = ["Sin puerta", "Corrediza", "Abatible"];
const ESTADO_OPTS      = ["Cerrada", "Entreabierta", "Abierta"];

export default function AnaquelPreview({
  ancho,
  alto,
  colorMarcoHex  = "#888888",
  colorVidrioHex = "#888888",
  opacidadMarco  = 1,
  opacidadVidrio = 0.35
}) {
  const [niveles,      setNiveles]      = useState(4);
  const [material,     setMaterial]     = useState("Madera");
  const [profundidad,  setProfundidad]  = useState(0.30);
  const [tipoPuerta,   setTipoPuerta]   = useState("Sin puerta");
  const [estadoPuerta, setEstadoPuerta] = useState("Cerrada");

  const anchoN = parseFloat(ancho) || 1.2;
  const altoN  = parseFloat(alto)  || 1.8;

  const areaTotal    = useMemo(() => +(anchoN * altoN).toFixed(2),                    [anchoN, altoN]);
  const altoPorNivel = useMemo(() => niveles > 1 ? +(altoN / niveles).toFixed(2) : 0, [altoN, niveles]);
  const camZ         = useMemo(() => Math.max(anchoN, altoN) * 1.7 + 1,               [anchoN, altoN]);

  const tienePuerta = tipoPuerta !== "Sin puerta";

  const handleNiveles    = (v) => NIVELES_OPTS.includes(v)     && setNiveles(v);
  const handleMaterial   = (v) => MATERIAL_OPTS.includes(v)    && setMaterial(v);
  const handleProfund    = (v) => PROFUNDIDAD_OPTS.includes(v) && setProfundidad(v);
  const handleTipoPuerta = (v) => {
    if (!PUERTA_OPTS.includes(v)) return;
    if (v === "Sin puerta") setEstadoPuerta("Cerrada");
    setTipoPuerta(v);
  };
  const handleEstado = (v) => ESTADO_OPTS.includes(v) && setEstadoPuerta(v);

  return (
    <div className="anaquel-preview">

      {/* ── Toolbar — FUERA del Canvas ── */}
      <div className="cielo-raso-controles fila">
        <div className="control-group">
          <span className="control-label">Niveles</span>
          {NIVELES_OPTS.map(n => (
            <button key={n} className={niveles === n ? "active" : ""} onClick={() => handleNiveles(n)}>
              {n}
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
        <div className="control-group">
          <span className="control-label">Prof.</span>
          {PROFUNDIDAD_OPTS.map(p => (
            <button key={p} className={profundidad === p ? "active" : ""} onClick={() => handleProfund(p)}>
              {(p * 100).toFixed(0)}cm
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="control-label">Puerta</span>
          {PUERTA_OPTS.map(t => (
            <button key={t} className={tipoPuerta === t ? "active" : ""} onClick={() => handleTipoPuerta(t)}>
              {t}
            </button>
          ))}
        </div>
        {tienePuerta && (
          <div className="control-group">
            <span className="control-label">Estado</span>
            {ESTADO_OPTS.map(e => (
              <button key={e} className={estadoPuerta === e ? "active" : ""} onClick={() => handleEstado(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Canvas — solo objetos Three.js adentro ── */}
      <div className="aq-render" style={{ minHeight: "500px" }}>
        <Canvas
          frameloop="always"
          onCreated={(state) => {
            /* Forzar resize + primer frame explícito.
               Con frameloop="always" esto es redundante pero
               garantiza el frame correcto si el CSS lazy aún
               no había terminado de aplicarse al montar.      */
            window.dispatchEvent(new Event("resize"));
            state.invalidate();
          }}
          gl={{ powerPreference: "high-performance", antialias: true, depth: true, stencil: false }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, camZ], fov: 40, near: 0.05, far: 300 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 5]}   intensity={0.9} />
          <directionalLight position={[-3, 2, -3]} intensity={0.25} />
          <OrbitControls
            enablePan={false}
            minDistance={0.3}
            maxDistance={camZ * 2.5}
            minPolarAngle={Math.PI * 0.08}
            maxPolarAngle={Math.PI * 0.82}
            target={[0, 0, 0]}
          />
          <AnaquelScene
            ancho={anchoN}
            alto={altoN}
            niveles={niveles}
            material={material}
            profundidad={profundidad}
            colorMarcoHex={colorMarcoHex}
            colorVidrioHex={colorVidrioHex}
            opacidadMarco={opacidadMarco}
            opacidadVidrio={opacidadVidrio}
            tipoPuerta={tipoPuerta}
            estadoPuerta={estadoPuerta}
          />
        </Canvas>
      </div>

      {/* ── Info — FUERA del Canvas ── */}
      <div className="cielo-raso-info">
        <span><b>Niveles</b> {niveles}</span>
        <span><b>Alto/nivel</b> {altoPorNivel} m</span>
        <span><b>Prof.</b> {profundidad.toFixed(2)} m</span>
        <span><b>Área</b> {areaTotal} m²</span>
        {tienePuerta && <span><b>Puerta</b> {tipoPuerta}</span>}
      </div>

    </div>
  );
}