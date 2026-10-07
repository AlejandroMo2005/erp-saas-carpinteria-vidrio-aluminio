// VidrioTempladoEntorno.jsx — Sprint 8
// useMemo en geometrías estáticas — evita recompilar shaders en cada render
//
// 🔧 Sprint 15 — Fix vendor-three en carga inicial:
//   ANTES: import { DoubleSide } from "three"
//   AHORA: DoubleSide = 2 (constante numérica, nunca cambia en three.js).

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

const PROFUNDIDAD_SALA = 4;
const COLOR_MADERA     = "#b8956a";
const COLOR_TECHO      = "#f5f5f5";
const COLOR_PARED      = "#e8e8e8";
const COLOR_FONDO      = "#f0f0f0";

export default function VidrioTempladoEntorno({ ancho, alto }) {
  const anchoN = Math.max(0.5, Number.parseFloat(ancho) || 3);
  const altoN  = Math.max(0.5, Number.parseFloat(alto)  || 2.4);

  const piso = useMemo(() => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -PROFUNDIDAD_SALA / 2]} receiveShadow>
      <planeGeometry args={[anchoN + 1, PROFUNDIDAD_SALA]} />
      <meshStandardMaterial color={COLOR_MADERA} roughness={0.8} metalness={0} side={DoubleSide} />
    </mesh>
  ), [anchoN]);

  const techo = useMemo(() => (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, altoN, -PROFUNDIDAD_SALA / 2]}>
        <planeGeometry args={[anchoN + 1, PROFUNDIDAD_SALA]} />
        <meshStandardMaterial color={COLOR_TECHO} roughness={0.9} side={DoubleSide} />
      </mesh>
      {[-anchoN / 3, 0, anchoN / 3].map((x, i) => (
        <mesh key={i} position={[x, altoN - 0.05, -PROFUNDIDAD_SALA / 2]}>
          <boxGeometry args={[0.15, 0.1, PROFUNDIDAD_SALA]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
      ))}
    </group>
  ), [anchoN, altoN]);

  const paredes = useMemo(() => (
    <>
      <mesh position={[-anchoN / 2 - 0.5, altoN / 2, -PROFUNDIDAD_SALA / 2]}>
        <boxGeometry args={[0.2, altoN, PROFUNDIDAD_SALA]} />
        <meshStandardMaterial color={COLOR_PARED} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[anchoN / 2 + 0.5, altoN / 2, -PROFUNDIDAD_SALA / 2]}>
        <boxGeometry args={[0.2, altoN, PROFUNDIDAD_SALA]} />
        <meshStandardMaterial color={COLOR_PARED} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[0, altoN / 2, -PROFUNDIDAD_SALA]}>
        <boxGeometry args={[anchoN + 1, altoN, 0.2]} />
        <meshStandardMaterial color={COLOR_FONDO} roughness={0.9} side={DoubleSide} />
      </mesh>
    </>
  ), [anchoN, altoN]);

  const muebles = useMemo(() => (
    <group>
      {/* Sofá en L */}
      <group position={[0, 0.35, -PROFUNDIDAD_SALA + 1.2]}>
        <mesh position={[-0.5, 0, 0]}>
          <boxGeometry args={[2.5, 0.7, 0.9]} />
          <meshStandardMaterial color="#6b6b6b" roughness={0.7} />
        </mesh>
        <mesh position={[-0.5, 0.4, -0.35]}>
          <boxGeometry args={[2.5, 0.5, 0.2]} />
          <meshStandardMaterial color="#6b6b6b" roughness={0.7} />
        </mesh>
        <mesh position={[1.5, 0, 0.5]}>
          <boxGeometry args={[0.9, 0.7, 1.5]} />
          <meshStandardMaterial color="#6b6b6b" roughness={0.7} />
        </mesh>
        <mesh position={[1.75, 0.4, 0.5]}>
          <boxGeometry args={[0.2, 0.5, 1.5]} />
          <meshStandardMaterial color="#6b6b6b" roughness={0.7} />
        </mesh>
        <mesh position={[-1.2, 0.6, 0]}>
          <boxGeometry args={[0.4, 0.15, 0.4]} />
          <meshStandardMaterial color="#d4af37" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.4, 0.15, 0.4]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.6} />
        </mesh>
      </group>

      {/* Mesa de centro */}
      <mesh position={[0, 0.25, -PROFUNDIDAD_SALA + 2.3]}>
        <boxGeometry args={[1.2, 0.05, 0.7]} />
        <meshStandardMaterial color="#3d2817" roughness={0.4} metalness={0.2} />
      </mesh>
      {[-0.5, 0.5].flatMap((x, i) =>
        [-0.3, 0.3].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.15, -PROFUNDIDAD_SALA + 2.3 + z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 12]} />
            <meshStandardMaterial color="#1a1410" roughness={0.5} metalness={0.3} />
          </mesh>
        ))
      )}

      {/* Lámpara colgante */}
      <group position={[0, altoN - 0.8, -PROFUNDIDAD_SALA + 2]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff8dc" emissiveIntensity={0.5} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Planta */}
      <group position={[-anchoN / 2 + 0.5, 0.4, -PROFUNDIDAD_SALA + 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.18, 0.4, 16]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.3, 0.6, 8]} />
          <meshStandardMaterial color="#2d5016" roughness={0.9} />
        </mesh>
      </group>

      {/* Alfombra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -PROFUNDIDAD_SALA + 2]}>
        <planeGeometry args={[2.5, 2]} />
        <meshStandardMaterial color="#8b7355" roughness={0.95} />
      </mesh>
    </group>
  ), [anchoN, altoN]);

  const luces = useMemo(() => (
    <>
      <pointLight position={[0, altoN - 1, -PROFUNDIDAD_SALA + 2]} intensity={0.8} color="#fff8dc" distance={5} />
      <pointLight position={[-anchoN / 3, altoN - 0.5, -PROFUNDIDAD_SALA / 2]} intensity={0.4} color="#ffffff" />
      <pointLight position={[ anchoN / 3, altoN - 0.5, -PROFUNDIDAD_SALA / 2]} intensity={0.4} color="#ffffff" />
    </>
  ), [anchoN, altoN]);

  return (
    <group>
      {piso}
      {techo}
      {paredes}
      {muebles}
      {luces}
    </group>
  );
}
