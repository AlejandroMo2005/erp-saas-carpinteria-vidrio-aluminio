// PuertaCocinaScene.jsx — Sprint 8
// useMemo en geometrías, colorMarco/colorVidrio hex puro, position=[0,0,0]
// 🔧 Sprint 15 — DoubleSide = 2, elimina import de "three"

import { useMemo } from "react";

const DoubleSide = 2;

const ESPESOR_MARCO = 0.04;
const PROFUNDIDAD   = 0.02;
const ANGULO_MAX    = Math.PI / 3;

export default function PuertaCocinaScene({
  hojas       = 2,
  anchoHoja   = 0.3,
  alto        = 0.7,
  acabado     = "Lacado",
  conVidrio   = false,
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
  apertura    = 0.5,
}) {
  const altoN      = Math.max(0.1, parseFloat(alto)     || 0.7);
  const anchoHojaN = Math.max(0.1, parseFloat(anchoHoja) || 0.3);
  const anchoTotal = hojas * anchoHojaN;

  const mMarco = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
  }), [colorMarco]);

  const mVidrio = useMemo(() => ({
    color: colorVidrio, transparent: true, opacity: 0.4,
    roughness: 0.1, metalness: 0, transmission: 0.9, thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio]);

  const colorBase = acabado === "Madera" ? "#8B4513" : colorMarco;
  const roughBase = acabado === "Madera" ? 0.7 : 0.2;
  const metalBase = acabado === "Madera" ? 0.0 : 0.1;

  const mPanel = useMemo(() => ({
    color: colorBase, roughness: roughBase, metalness: metalBase, side: DoubleSide,
  }), [colorBase, roughBase, metalBase]);

  const mBisel = useMemo(() => ({
    color: colorBase, roughness: Math.max(0, roughBase - 0.1),
    metalness: Math.min(1, metalBase + 0.1),
  }), [colorBase, roughBase, metalBase]);

  const paneles = useMemo(() =>
    Array.from({ length: hojas }, (_, index) => {
      const xPos = hojas === 1 ? 0
        : index === 0
          ? -anchoTotal / 2 + anchoHojaN / 2
          :  anchoTotal / 2 - anchoHojaN / 2;

      const rotacion = index === 0
        ? -apertura * ANGULO_MAX
        :  apertura * ANGULO_MAX;

      const pivotX = index === 0 ? anchoHojaN / 2 : -anchoHojaN / 2;

      return (
        <group key={index} position={[xPos, altoN / 2, 0]}>
          <group position={[-pivotX, 0, 0]}>
            <group rotation={[0, rotacion, 0]}>
              <group position={[pivotX, 0, 0]}>

                {acabado === "Vidrio" && (
                  <>
                    {[
                      [0, altoN/2 - ESPESOR_MARCO/2, 0,  [anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]],
                      [0, -altoN/2 + ESPESOR_MARCO/2, 0, [anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]],
                      [-anchoHojaN/2 + ESPESOR_MARCO/2, 0, 0, [ESPESOR_MARCO, altoN, PROFUNDIDAD]],
                      [anchoHojaN/2 - ESPESOR_MARCO/2, 0, 0,  [ESPESOR_MARCO, altoN, PROFUNDIDAD]],
                      [0, 0, 0, [anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]],
                    ].map(([x, y, z, args], i) => (
                      <mesh key={i} position={[x, y, z]}>
                        <boxGeometry args={args} />
                        <meshStandardMaterial {...mMarco} />
                      </mesh>
                    ))}
                    {[altoN/4, -altoN/4].map((y, i) => (
                      <mesh key={`v-${i}`} position={[0, y, 0]}>
                        <boxGeometry args={[
                          anchoHojaN - ESPESOR_MARCO * 2,
                          altoN / 2 - ESPESOR_MARCO * 2,
                          PROFUNDIDAD * 0.5,
                        ]} />
                        <meshPhysicalMaterial {...mVidrio} />
                      </mesh>
                    ))}
                    <mesh position={[
                      index === 0 ? anchoHojaN/2 - 0.1 : -anchoHojaN/2 + 0.1,
                      0, PROFUNDIDAD/2 + 0.015,
                    ]}>
                      <boxGeometry args={[0.02, 0.12, 0.02]} />
                      <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
                    </mesh>
                  </>
                )}

                {(acabado === "Lacado" || acabado === "Madera") && (
                  <>
                    <mesh>
                      <boxGeometry args={[anchoHojaN - 0.01, altoN - 0.01, PROFUNDIDAD]} />
                      <meshStandardMaterial {...mPanel} />
                    </mesh>
                    {[
                      [0, altoN/2 - 0.08,   PROFUNDIDAD/2 + 0.005, [anchoHojaN - 0.12, 0.03, 0.01]],
                      [0, -altoN/2 + 0.08,  PROFUNDIDAD/2 + 0.005, [anchoHojaN - 0.12, 0.03, 0.01]],
                      [-anchoHojaN/2 + 0.08, 0, PROFUNDIDAD/2 + 0.005, [0.03, altoN - 0.16, 0.01]],
                      [anchoHojaN/2 - 0.08,  0, PROFUNDIDAD/2 + 0.005, [0.03, altoN - 0.16, 0.01]],
                    ].map(([x, y, z, args], i) => (
                      <mesh key={`b-${i}`} position={[x, y, z]}>
                        <boxGeometry args={args} />
                        <meshStandardMaterial {...mBisel} />
                      </mesh>
                    ))}
                    {conVidrio && (
                      <mesh position={[0, altoN/4, PROFUNDIDAD/2 + 0.006]}>
                        <boxGeometry args={[anchoHojaN * 0.4, altoN * 0.3, 0.005]} />
                        <meshPhysicalMaterial {...mVidrio} />
                      </mesh>
                    )}
                    <mesh position={[
                      index === 0 ? anchoHojaN/2 - 0.1 : -anchoHojaN/2 + 0.1,
                      0, PROFUNDIDAD/2 + 0.015,
                    ]}>
                      <boxGeometry args={[0.02, 0.12, 0.02]} />
                      <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
                    </mesh>
                  </>
                )}

              </group>
            </group>
          </group>
        </group>
      );
    }),
  [hojas, anchoHojaN, altoN, anchoTotal, acabado, conVidrio, apertura, mMarco, mVidrio, mPanel, mBisel]);

  const marcoGabinete = useMemo(() => (
    <group position={[0, altoN / 2, -0.05]}>
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[anchoTotal + 0.1, altoN + 0.1, 0.02]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.6} side={DoubleSide} />
      </mesh>
      <mesh position={[-anchoTotal / 2 - 0.03, 0, -0.05]}>
        <boxGeometry args={[0.06, altoN + 0.1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh position={[anchoTotal / 2 + 0.03, 0, -0.05]}>
        <boxGeometry args={[0.06, altoN + 0.1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh position={[0, altoN / 2 + 0.05, 0]}>
        <boxGeometry args={[anchoTotal + 0.1, 0.1, 0.15]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
    </group>
  ), [anchoTotal, altoN, mMarco]);

  return (
    <group position={[0, 0, 0]}>
      {marcoGabinete}
      {paneles}
    </group>
  );
}