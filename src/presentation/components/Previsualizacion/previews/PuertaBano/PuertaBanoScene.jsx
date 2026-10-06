// PuertaBanoScene.jsx — Sprint 8
// 🐛 Fix Sprint 15 — DoubleSide = 2, elimina import de "three"
//                    useMemo en renderContenidoHoja, paneles, guías y base
//
// PROBLEMA:
//   import { DoubleSide } from "three" → Rollup detecta import estático de "three"
//   → vendor-three se jalaba al chunk de PuertaBanoPreview aunque fuera lazy.
//   Además, renderContenidoHoja() se llamaba como función inline sin memoizar
//   → todas las geometrías se recreaban en cada render del padre.
//
// FIX:
//   DoubleSide = 2 (valor estable en three.js — nunca cambia entre versiones).
//   useMemo en contenido de hoja, paneles, guías y base.

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

const ESPESOR_MARCO = 0.05;
const PROFUNDIDAD   = 0.008;

export default function PuertaBanoScene({
  hojas,
  anchoHoja,
  alto,
  tipo,
  material,
  colorMarco,
  colorVidrio,
}) {
  const altoN      = Math.max(0.1, Number.parseFloat(alto)      || 2.0);
  const anchoHojaN = Math.max(0.1, Number.parseFloat(anchoHoja) || 0.7);
  const anchoTotal = hojas * anchoHojaN;

  // ── Materiales memoizados ─────────────────────────────────────────────────
  const mMarco = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
  }), [colorMarco]);

  const mVidrio = useMemo(() => ({
    color: colorVidrio, transparent: true, opacity: 0.3,
    roughness: 0.05, metalness: 0, transmission: 0.95, thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio]);

  // ── Contenido de hoja memoizado ───────────────────────────────────────────
  const ContenidoHoja = useMemo(() => {
    if (material === "Vidrio") return (
      <mesh>
        <boxGeometry args={[anchoHojaN - 0.01, altoN - 0.01, PROFUNDIDAD]} />
        <meshPhysicalMaterial {...mVidrio} />
      </mesh>
    );

    if (material === "Esmerilado") return (
      <mesh>
        <boxGeometry args={[anchoHojaN - 0.01, altoN - 0.01, PROFUNDIDAD]} />
        <meshPhysicalMaterial
          color="#f0f0f0"
          transparent opacity={0.7}
          roughness={0.9} metalness={0}
          transmission={0.3} side={DoubleSide}
        />
      </mesh>
    );

    // Con Marco (aluminio + vidrio)
    return (
      <>
        {/* Marco superior */}
        <mesh position={[0, altoN/2 - ESPESOR_MARCO/2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, 0.03]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Marco inferior */}
        <mesh position={[0, -altoN/2 + ESPESOR_MARCO/2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, 0.03]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Marco izquierdo */}
        <mesh position={[-anchoHojaN/2 + ESPESOR_MARCO/2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, 0.03]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Marco derecho */}
        <mesh position={[anchoHojaN/2 - ESPESOR_MARCO/2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, 0.03]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Vidrio central */}
        <mesh>
          <boxGeometry args={[
            anchoHojaN - ESPESOR_MARCO * 2,
            altoN - ESPESOR_MARCO * 2,
            PROFUNDIDAD,
          ]} />
          <meshPhysicalMaterial {...mVidrio} />
        </mesh>
        {/* Manija pivotante */}
        {tipo === "Pivotante" && (
          <mesh position={[anchoHojaN/2 - 0.1, 0, 0.02]}>
            <cylinderGeometry args={[0.01, 0.01, 0.15, 16]} />
            <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
          </mesh>
        )}
      </>
    );
  }, [material, anchoHojaN, altoN, tipo, mMarco, mVidrio]);

  // ── Hojas memoizadas ──────────────────────────────────────────────────────
  const paneles = useMemo(() =>
    Array.from({ length: hojas }, (_, i) => {
      const xPos = (i - hojas/2 + 0.5) * anchoHojaN;
      const rotY = tipo === "Pivotante" && i === 0 ? -0.4 : 0;
      return (
        <group key={i} position={[xPos, altoN/2, 0]}>
          {tipo === "Pivotante"
            ? <group rotation={[0, rotY, 0]}>{ContenidoHoja}</group>
            : ContenidoHoja}
        </group>
      );
    }),
  [hojas, anchoHojaN, altoN, tipo, ContenidoHoja]);

  // ── Guías corrediza ───────────────────────────────────────────────────────
  const guias = useMemo(() => {
    if (tipo !== "Corrediza") return null;
    return (
      <>
        <mesh position={[0, altoN + 0.04, 0]}>
          <boxGeometry args={[anchoTotal, 0.04, 0.04]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[anchoTotal, 0.04, 0.04]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} />
        </mesh>
      </>
    );
  }, [tipo, anchoTotal, altoN]);

  // ── Base / plato de ducha ─────────────────────────────────────────────────
  const base = useMemo(() => (
    <mesh position={[0, -0.1, 0.3]} rotation={[-Math.PI/2, 0, 0]}>
      <boxGeometry args={[anchoTotal + 0.2, 0.8, 0.05]} />
      <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
    </mesh>
  ), [anchoTotal]);

  return (
    <group position={[0, -0.3, 0]}>
      {base}
      {guias}
      {paneles}
    </group>
  );
}
