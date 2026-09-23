// PuertaScene.jsx — Sprint 8
// useMemo en geometrías estáticas, colorMarco/colorVidrio hex puro
//
// 🔧 Sprint 15 — Fix vendor-three en carga inicial:
//   ANTES: import { DoubleSide } from "three"
//   AHORA: DoubleSide = 2 (constante numérica, nunca cambia en three.js).
//          Este módulo ya no tiene imports directos de "three".

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

const ESPESOR_MARCO = 0.08;
const PROFUNDIDAD   = 0.05;

export default function PuertaScene({
  hojas        = 2,
  anchoHoja    = 0.75,
  alto         = 2.1,
  tipo         = "Corrediza",
  material     = "Mixta",
  colorMarco   = "#888888",
  colorVidrio  = "#e0f2ff",
}) {
  const altoN      = Math.max(0.2, parseFloat(alto)     || 2.1);
  const anchoHojaN = Math.max(0.1, parseFloat(anchoHoja) || 0.75);

  const mMarco = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
  }), [colorMarco]);

  const mVidrio = useMemo(() => ({
    color: colorVidrio, transparent: true, opacity: 0.4,
    roughness: 0.1, metalness: 0, transmission: 0.9, thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio]);

  const mAluminio = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
  }), [colorMarco]);

  // ── Contenido de hoja ────────────────────────────────────────────────────
  const ContenidoHoja = useMemo(() => {
    if (material === "Vidrio") return (
      <mesh>
        <boxGeometry args={[anchoHojaN - 0.02, altoN - 0.02, PROFUNDIDAD]} />
        <meshPhysicalMaterial {...mVidrio} />
      </mesh>
    );

    if (material === "Aluminio") return (
      <mesh>
        <boxGeometry args={[anchoHojaN - 0.02, altoN - 0.02, PROFUNDIDAD]} />
        <meshStandardMaterial {...mAluminio} />
      </mesh>
    );

    // Mixta
    return (
      <>
        {/* Marco superior */}
        <mesh position={[0, altoN / 2 - ESPESOR_MARCO / 2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Marco inferior */}
        <mesh position={[0, -altoN / 2 + ESPESOR_MARCO / 2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Marco izquierdo */}
        <mesh position={[-anchoHojaN / 2 + ESPESOR_MARCO / 2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Marco derecho */}
        <mesh position={[anchoHojaN / 2 - ESPESOR_MARCO / 2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        {/* Vidrio central */}
        <mesh>
          <boxGeometry args={[
            anchoHojaN - ESPESOR_MARCO * 2,
            altoN - ESPESOR_MARCO * 2,
            PROFUNDIDAD * 0.6,
          ]} />
          <meshPhysicalMaterial {...mVidrio} />
        </mesh>
        {tipo === "Abatible" && (
          <mesh position={[anchoHojaN / 2 - 0.15, 0, PROFUNDIDAD / 2 + 0.03]}>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 16]} />
            <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
          </mesh>
        )}
      </>
    );
  }, [material, anchoHojaN, altoN, tipo, mMarco, mVidrio, mAluminio]);

  // ── Hojas ────────────────────────────────────────────────────────────────
  const paneles = useMemo(() =>
    Array.from({ length: hojas }, (_, i) => {
      const xPos = (i - hojas / 2 + 0.5) * anchoHojaN;
      const rotY = tipo === "Abatible" && i % 2 === 0 ? -0.3 : 0;

      return (
        <group key={i} position={[xPos, altoN / 2, 0]}>
          {tipo === "Abatible"
            ? <group rotation={[0, rotY, 0]}>{ContenidoHoja}</group>
            : ContenidoHoja
          }
        </group>
      );
    }),
  [hojas, anchoHojaN, altoN, tipo, ContenidoHoja]);

  // ── Rieles corrediza ─────────────────────────────────────────────────────
  const rieles = useMemo(() => {
    if (tipo !== "Corrediza") return null;
    const anchoTotal = hojas * anchoHojaN;
    return (
      <>
        <mesh position={[0, altoN + 0.05, 0]}>
          <boxGeometry args={[anchoTotal, 0.05, 0.08]} />
          <meshStandardMaterial color="#666666" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[anchoTotal, 0.05, 0.08]} />
          <meshStandardMaterial color="#666666" roughness={0.4} metalness={0.7} />
        </mesh>
      </>
    );
  }, [tipo, hojas, anchoHojaN, altoN]);

  return (
    <group position={[0, 0, 0]}>
      {rieles}
      {paneles}
    </group>
  );
}