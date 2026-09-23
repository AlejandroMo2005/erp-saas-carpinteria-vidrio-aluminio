// VitrinaScene.jsx — Sprint 8
// 🔧 Sprint 15 — DoubleSide = 2, elimina import de "three"

import { useMemo } from "react";

const DoubleSide = 2;

const ESPESOR_MARCO  = 0.1;
const PROFUNDIDAD    = 0.4;
const ESPESOR_VIDRIO = 0.01;
const NUM_ESTANTES   = 3;

export default function VitrinaScene({
  hojas       = 2,
  anchoHoja   = 0.6,
  alto        = 1.8,
  tipo        = "Corrediza",
  conEstantes = true,
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const altoN      = Math.max(0.2, parseFloat(alto)     || 1.8);
  const anchoHojaN = Math.max(0.1, parseFloat(anchoHoja) || 0.6);
  const anchoTotal = hojas * anchoHojaN;

  const mMarco = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
  }), [colorMarco]);

  const mVidrio = useMemo(() => ({
    color: colorVidrio, transparent: true, opacity: 0.3,
    roughness: 0.05, metalness: 0, transmission: 0.95, thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio]);

  const mVidrioEstante = useMemo(() => ({
    color: colorVidrio, transparent: true, opacity: 0.4,
    roughness: 0.1, metalness: 0, transmission: 0.85, thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio]);

  const ContenidoHoja = useMemo(() => (
    <>
      {[
        [0, altoN/2 - ESPESOR_MARCO/2, 0,   [anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]],
        [0, -altoN/2 + ESPESOR_MARCO/2, 0,  [anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]],
        [-anchoHojaN/2 + ESPESOR_MARCO/2, 0, 0, [ESPESOR_MARCO, altoN, PROFUNDIDAD]],
        [anchoHojaN/2 - ESPESOR_MARCO/2, 0, 0,  [ESPESOR_MARCO, altoN, PROFUNDIDAD]],
      ].map(([x, y, z, args], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={args} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
      ))}
      <mesh position={[0, 0, PROFUNDIDAD/2 - ESPESOR_VIDRIO/2]}>
        <boxGeometry args={[
          anchoHojaN - ESPESOR_MARCO * 2,
          altoN - ESPESOR_MARCO * 2,
          ESPESOR_VIDRIO,
        ]} />
        <meshPhysicalMaterial {...mVidrio} />
      </mesh>
      {tipo === "Abatible" && (
        <mesh position={[anchoHojaN/2 - 0.2, 0, PROFUNDIDAD/2 + 0.03]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 16]} />
          <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
        </mesh>
      )}
    </>
  ), [anchoHojaN, altoN, tipo, mMarco, mVidrio]);

  const paneles = useMemo(() =>
    Array.from({ length: hojas }, (_, i) => {
      const xPos = (i - hojas/2 + 0.5) * anchoHojaN;
      const rotY = tipo === "Abatible" && i % 2 === 0 ? -0.3 : 0;
      return (
        <group key={i} position={[xPos, altoN/2 + 0.1, 0]}>
          {tipo === "Abatible"
            ? <group rotation={[0, rotY, 0]}>{ContenidoHoja}</group>
            : ContenidoHoja}
        </group>
      );
    }),
  [hojas, anchoHojaN, altoN, tipo, ContenidoHoja]);

  const estantes = useMemo(() => {
    if (!conEstantes) return null;
    const espacio = altoN / (NUM_ESTANTES + 1);
    return Array.from({ length: NUM_ESTANTES }, (_, i) => {
      const yPos = (i + 1) * espacio + 0.1;
      return (
        <mesh key={i} position={[0, yPos, 0]}>
          <boxGeometry args={[anchoTotal - ESPESOR_MARCO*2 - 0.05, 0.02, PROFUNDIDAD - 0.15]} />
          <meshPhysicalMaterial {...mVidrioEstante} />
        </mesh>
      );
    });
  }, [conEstantes, altoN, anchoTotal, mVidrioEstante]);

  const ruedas = useMemo(() => {
    const pos = [
      [-anchoTotal/2 + 0.1, 0,  PROFUNDIDAD/2 - 0.1],
      [ anchoTotal/2 - 0.1, 0,  PROFUNDIDAD/2 - 0.1],
      [-anchoTotal/2 + 0.1, 0, -PROFUNDIDAD/2 + 0.1],
      [ anchoTotal/2 - 0.1, 0, -PROFUNDIDAD/2 + 0.1],
    ];
    return pos.map((p, i) => (
      <group key={i} position={p}>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    ));
  }, [anchoTotal]);

  const base = useMemo(() => (
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[anchoTotal + 0.1, 0.05, PROFUNDIDAD + 0.1]} />
      <meshStandardMaterial color={colorMarco} roughness={0.4} metalness={0.7} side={DoubleSide} />
    </mesh>
  ), [anchoTotal, colorMarco]);

  return (
    <group position={[0, 0, 0]}>
      {ruedas}
      {base}
      {paneles}
      {estantes}
    </group>
  );
}