// CortinasBanoScene.jsx — Sprint 8
// 🐛 Fix Sprint 15 — useMemo en paneles, guías y tina
//
// PROBLEMA:
//   renderPanel(), renderGuias() y renderTina() eran funciones inline
//   sin memoización → todas las geometrías se recreaban en cada render
//   del componente padre (cambio de color, ancho, alto, etc.).
//   Todos los demás *Scene.jsx ya usaban useMemo desde Sprint 15.
//
// FIX:
//   Convertir las tres funciones en valores memoizados con useMemo.
//   El patron es consistente con PuertaScene, VentanaScene y VitrinaScene.

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

export default function CortinasBanoScene({
  ancho,
  alto,
  tipo,
  sistema,
  colorMarco,
  colorVidrio,
}) {
  const anchoN        = Math.max(0.1, Number.parseFloat(ancho) || 1.0);
  const altoN         = Math.max(0.1, Number.parseFloat(alto)  || 2.0);
  const espesorMarco  = 0.03;
  const profundidad   = 0.006;
  const numPaneles    = 2;
  const anchoPorPanel = anchoN / numPaneles;

  // ── Tina memoizada ────────────────────────────────────────────────────────
  const tina = useMemo(() => (
    <group position={[0, -0.3, 0.4]}>
      <mesh>
        <boxGeometry args={[anchoN + 0.3, 0.5, 0.7]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.25, -0.35]}>
        <boxGeometry args={[anchoN + 0.32, 0.02, 0.02]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.3} />
      </mesh>
    </group>
  ), [anchoN]);

  // ── Guías corrediza memoizadas ────────────────────────────────────────────
  const guias = useMemo(() => {
    if (sistema !== "Corrediza") return null;
    return (
      <>
        <mesh position={[0, altoN + 0.03, 0]}>
          <boxGeometry args={[anchoN, 0.03, 0.03]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[anchoN, 0.03, 0.03]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} />
        </mesh>
      </>
    );
  }, [sistema, anchoN, altoN]);

  // ── Paneles memoizados ────────────────────────────────────────────────────
  const paneles = useMemo(() =>
    Array.from({ length: numPaneles }, (_, index) => {
      const xPos     = (index - numPaneles/2 + 0.5) * anchoPorPanel;
      const rotacion = sistema === "Batiente" && index === 0 ? -0.4 : 0;

      const vidrioProps = tipo === "Esmerilado"
        ? {
            color: "#f0f0f0", transparent: true, opacity: 0.8,
            roughness: 0.95, metalness: 0, transmission: 0.2,
            side: DoubleSide,
          }
        : {
            color: colorVidrio, transparent: true, opacity: 0.3,
            roughness: 0.05, metalness: 0, transmission: 0.95,
            thickness: 0.5, side: DoubleSide,
          };

      const mMarco = {
        color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
      };

      return (
        <group key={index} position={[xPos, altoN/2, 0]}>
          <group rotation={[0, rotacion, 0]}>
            {/* Marco superior */}
            <mesh position={[0, altoN/2 - espesorMarco/2, 0]}>
              <boxGeometry args={[anchoPorPanel, espesorMarco, 0.025]} />
              <meshStandardMaterial {...mMarco} />
            </mesh>
            {/* Marco inferior */}
            <mesh position={[0, -altoN/2 + espesorMarco/2, 0]}>
              <boxGeometry args={[anchoPorPanel, espesorMarco, 0.025]} />
              <meshStandardMaterial {...mMarco} />
            </mesh>
            {/* Marco izquierdo */}
            <mesh position={[-anchoPorPanel/2 + espesorMarco/2, 0, 0]}>
              <boxGeometry args={[espesorMarco, altoN, 0.025]} />
              <meshStandardMaterial {...mMarco} />
            </mesh>
            {/* Marco derecho */}
            <mesh position={[anchoPorPanel/2 - espesorMarco/2, 0, 0]}>
              <boxGeometry args={[espesorMarco, altoN, 0.025]} />
              <meshStandardMaterial {...mMarco} />
            </mesh>
            {/* Vidrio */}
            <mesh>
              <boxGeometry args={[
                anchoPorPanel - espesorMarco * 2,
                altoN - espesorMarco * 2,
                profundidad,
              ]} />
              <meshPhysicalMaterial {...vidrioProps} />
            </mesh>
            {/* Manija batiente */}
            {sistema === "Batiente" && (
              <mesh position={[anchoPorPanel/2 - 0.08, 0, 0.015]}>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 16]} />
                <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
              </mesh>
            )}
          </group>
        </group>
      );
    }),
  [numPaneles, anchoPorPanel, altoN, tipo, sistema, colorMarco, colorVidrio, espesorMarco, profundidad]);

  return (
    <group position={[0, -0.3, 0]}>
      {tina}
      {guias}
      {paneles}
    </group>
  );
}
