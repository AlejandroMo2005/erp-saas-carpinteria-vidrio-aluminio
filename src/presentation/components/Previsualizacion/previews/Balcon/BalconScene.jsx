// BalconScene.jsx — Sprint 8
// Fix: colorMarco/colorVidrio ya llegan como hex desde Previsualizacion.jsx
// useMemo en cada sección para no recompilar shaders en cada render
//
// 🔧 Sprint 15 — Fix vendor-three en carga inicial:
//   ANTES: import { DoubleSide } from "three"
//   AHORA: DoubleSide = 2 (constante numérica, nunca cambia en three.js).

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

const ESPESOR = 0.05;
const PROF    = 1.2;

function vidrioProps(material, colorVidrioHex, opacidadVidrio) {
  if (material === "Esmerilado") return {
    color: "#e8e8e8", transparent: true, opacity: 0.75,
    roughness: 0.92, metalness: 0, transmission: 0.25, side: DoubleSide,
  };
  if (material === "Ahumado") return {
    color: "#3a3a3a", transparent: true, opacity: 0.55,
    roughness: 0.12, metalness: 0, transmission: 0.55, side: DoubleSide,
  };
  return {
    color: colorVidrioHex,
    transparent: true,
    opacity: opacidadVidrio ?? 0.3,
    roughness: 0.05, metalness: 0, transmission: 0.95, thickness: 0.5,
    side: DoubleSide,
  };
}

export default function BalconScene({
  ancho,
  alto,
  material       = "Vidrio",
  colorMarco     = "#888888",
  colorVidrio    = "#88aaff",
  opacidadVidrio = 0.3,
}) {
  const anchoS = Math.max(0.2, Number.parseFloat(ancho) || 1.5);
  const altoS  = Math.max(0.2, Number.parseFloat(alto)  || 1.0);

  const mMarco = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
  }), [colorMarco]);

  const mVidrio = useMemo(() =>
    vidrioProps(material, colorVidrio, opacidadVidrio),
    [material, colorVidrio, opacidadVidrio]);

  const piso = useMemo(() => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, PROF / 4]}>
      <boxGeometry args={[anchoS, PROF, 0.05]} />
      <meshStandardMaterial color="#b8b8b8" roughness={0.55} metalness={0.25} side={DoubleSide} />
    </mesh>
  ), [anchoS]);

  const marcos = useMemo(() => (
    <>
      <mesh position={[0, altoS, PROF / 2]}>
        <boxGeometry args={[anchoS, ESPESOR, ESPESOR]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      <mesh position={[-anchoS / 2, altoS, PROF / 4]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[PROF / 2, ESPESOR, ESPESOR]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      <mesh position={[anchoS / 2, altoS, PROF / 4]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[PROF / 2, ESPESOR, ESPESOR]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      <mesh position={[0, ESPESOR / 2, PROF / 2]}>
        <boxGeometry args={[anchoS, ESPESOR, ESPESOR]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      <mesh position={[-anchoS / 2, ESPESOR / 2, PROF / 4]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[PROF / 2, ESPESOR, ESPESOR]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      <mesh position={[anchoS / 2, ESPESOR / 2, PROF / 4]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[PROF / 2, ESPESOR, ESPESOR]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
    </>
  ), [anchoS, altoS, mMarco]);

  const postes = useMemo(() => {
    const num     = Math.max(2, Math.floor(anchoS / 0.8));
    const espacio = anchoS / (num - 1);
    const lista   = [];

    for (let i = 0; i < num; i++) {
      const x = -anchoS / 2 + i * espacio;
      lista.push(
        <mesh key={`pf-${i}`} position={[x, altoS / 2, PROF / 2]}>
          <boxGeometry args={[ESPESOR, altoS, ESPESOR]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
      );
    }

    [[-1, PROF / 2], [-1, 0], [1, PROF / 2], [1, 0]].forEach(([sx, z], i) => {
      lista.push(
        <mesh key={`pe-${i}`} position={[sx * anchoS / 2, altoS / 2, z]}>
          <boxGeometry args={[ESPESOR, altoS, ESPESOR]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
      );
    });

    return lista;
  }, [anchoS, altoS, mMarco]);

  const paneles = useMemo(() => (
    <>
      <mesh position={[0, altoS / 2, PROF / 2]}>
        <boxGeometry args={[anchoS - ESPESOR * 2, altoS - ESPESOR * 2, 0.008]} />
        <meshPhysicalMaterial {...mVidrio} />
      </mesh>
      <mesh position={[-anchoS / 2, altoS / 2, PROF / 4]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[PROF / 2 - ESPESOR, altoS - ESPESOR * 2, 0.008]} />
        <meshPhysicalMaterial {...mVidrio} />
      </mesh>
      <mesh position={[anchoS / 2, altoS / 2, PROF / 4]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[PROF / 2 - ESPESOR, altoS - ESPESOR * 2, 0.008]} />
        <meshPhysicalMaterial {...mVidrio} />
      </mesh>
    </>
  ), [anchoS, altoS, mVidrio]);

  return (
    <group position={[0, 0, 0]}>
      {piso}
      {marcos}
      {postes}
      {paneles}
    </group>
  );
}
