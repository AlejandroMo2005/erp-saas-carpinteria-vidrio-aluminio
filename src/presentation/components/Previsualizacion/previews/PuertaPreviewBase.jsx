import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const OPCIONES_HOJAS = [1, 2, 3, 4];
const OPCIONES_TIPO = ["Corrediza", "Abatible"];
const OPCIONES_MATERIAL = ["Vidrio", "Aluminio", "Mixta"];

export default function PuertaPreviewBase({
  SceneComponent,
  wrapperClass,
  controlesClass,
  renderClass,
  infoClass,
  opcionesHojas = OPCIONES_HOJAS,
  opcionesTipo = OPCIONES_TIPO,
  opcionesMaterial = OPCIONES_MATERIAL,
  hojasIniciales = 2,
  tipoInicial = "Corrediza",
  materialInicial = "Mixta",
  ancho,
  alto,
  anchoPredeterminado = 1.5,
  altoPredeterminado = 2.1,
  colorMarco = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const [hojas, setHojas] = useState(hojasIniciales);
  const [tipo, setTipo] = useState(tipoInicial);
  const [material, setMaterial] = useState(materialInicial);

  const anchoN = Number.parseFloat(ancho) || anchoPredeterminado;
  const altoN = Number.parseFloat(alto) || altoPredeterminado;

  const anchoHoja = useMemo(
    () => anchoN / hojas,
    [anchoN, hojas],
  );

  const areaTotal = useMemo(
    () => +(anchoN * altoN).toFixed(2),
    [anchoN, altoN],
  );

  const handleHojas = (valor) => {
    if (opcionesHojas.includes(valor)) setHojas(valor);
  };

  const handleTipo = (valor) => {
    if (opcionesTipo.includes(valor)) setTipo(valor);
  };

  const handleMaterial = (valor) => {
    if (opcionesMaterial.includes(valor)) setMaterial(valor);
  };

  return (
    <div className={wrapperClass}>
      <div className={`${controlesClass} fila`}>
        <div className="control-group">
          <span className="control-label">Hojas</span>
          {opcionesHojas.map((cantidad) => (
            <button
              key={cantidad}
              className={hojas === cantidad ? "active" : ""}
              onClick={() => handleHojas(cantidad)}
            >
              {cantidad}
            </button>
          ))}
        </div>

        <div className="control-group">
          <span className="control-label">Tipo</span>
          {opcionesTipo.map((opcion) => (
            <button
              key={opcion}
              className={tipo === opcion ? "active" : ""}
              onClick={() => handleTipo(opcion)}
            >
              {opcion}
            </button>
          ))}
        </div>

        <div className="control-group">
          <span className="control-label">Material</span>
          {opcionesMaterial.map((opcion) => (
            <button
              key={opcion}
              className={material === opcion ? "active" : ""}
              onClick={() => handleMaterial(opcion)}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      <div className={renderClass}>
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
            stencil: false,
          }}
          dpr={[1, 1.5]}
          camera={{
            position: [0, 1.4, 4.5],
            fov: 45,
            near: 0.05,
            far: 200,
          }}
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

          <SceneComponent
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

      <div className={infoClass}>
        <span>
          <b>Hojas:</b> {hojas}
        </span>
        <span>
          <b>Ancho hoja:</b> {anchoHoja.toFixed(2)} m
        </span>
        <span>
          <b>Alto:</b> {altoN.toFixed(2)} m
        </span>
        <span>
          <b>Área:</b> {areaTotal.toFixed(2)}m²
        </span>
      </div>
    </div>
  );
}