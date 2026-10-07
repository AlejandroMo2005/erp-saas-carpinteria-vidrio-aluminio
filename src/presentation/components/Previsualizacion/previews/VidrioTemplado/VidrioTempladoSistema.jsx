// VidrioTempladoSistema.jsx — Sprint 8
// useMemo en materiales y paneles — elimina recompilación de shaders en cada render
//
// 🔧 Sprint 15 — Fix vendor-three en carga inicial:
//   ANTES: import { DoubleSide } from "three"
//   AHORA: DoubleSide = 2 (constante numérica, nunca cambia en three.js).

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

const ESPESOR_MARCO        = 0.05;
const ESPESOR_VIDRIO       = 0.01;
const ANCHO_PANEL_ESTANDAR = 1.2;

export default function VidrioTempladoSistema({
  ancho,
  alto,
  tipo         = "Corrediza",
  apertura     = 0,
  direccion    = "derecha",
  colorMarco   = "#888888",
  colorVidrio  = "#0064ff",
  opacidadMarco  = 1,
  opacidadVidrio = 0.3,
}) {
  const anchoN = Math.max(0.5, Number.parseFloat(ancho) || 3);
  const altoN  = Math.max(0.5, Number.parseFloat(alto)  || 2.4);

  const numPaneles        = Math.ceil(anchoN / ANCHO_PANEL_ESTANDAR);
  const anchoPanelReal    = anchoN / numPaneles;
  const numPuertasMoviles = anchoN < 5 ? 1 : 2;

  const mMarco = useMemo(() => ({
    color: colorMarco, roughness: 0.3, metalness: 0.8, side: DoubleSide,
    transparent: opacidadMarco < 1, opacity: opacidadMarco,
  }), [colorMarco, opacidadMarco]);

  const mVidrio = useMemo(() => ({
    color: colorVidrio, transparent: true, opacity: opacidadVidrio,
    roughness: 0.05, metalness: 0, transmission: 0.98, thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio, opacidadVidrio]);

  // ── Rieles ────────────────────────────────────────────────────────────────
  const rieles = useMemo(() => {
    if (tipo !== "Corrediza") return null;
    return (
      <>
        <mesh position={[0, altoN, 0]}>
          <boxGeometry args={[anchoN, ESPESOR_MARCO, ESPESOR_MARCO * 2]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[anchoN, ESPESOR_MARCO, ESPESOR_MARCO * 2]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
      </>
    );
  }, [tipo, anchoN, altoN, mMarco]);

  // ── Paneles ───────────────────────────────────────────────────────────────
  const paneles = useMemo(() =>
    Array.from({ length: numPaneles }, (_, index) => {
      const xBase = -anchoN / 2 + index * anchoPanelReal + anchoPanelReal / 2;

      let esMovil;
      if (direccion === "centro" && numPuertasMoviles === 2) {
        esMovil = index < 2;
      } else if (direccion === "izquierda") {
        esMovil = index >= numPaneles - numPuertasMoviles;
      } else {
        esMovil = index < numPuertasMoviles;
      }

      let desplazamiento = 0;
      let rotacion       = 0;

      if (esMovil) {
        if (tipo === "Corrediza") {
          if (direccion === "izquierda") {
            desplazamiento = -apertura * anchoPanelReal * 0.8;
          } else if (direccion === "derecha") {
            desplazamiento = apertura * anchoPanelReal * 0.8;
          } else {
            desplazamiento = numPuertasMoviles === 2
              ? (index === 0 ? -apertura * anchoPanelReal * 0.8 : apertura * anchoPanelReal * 0.8)
              : apertura * anchoPanelReal * 0.8;
          }
        } else if (tipo === "Abatible") {
          if (direccion === "izquierda") {
            rotacion = apertura * (Math.PI / 2.5);
          } else if (direccion === "derecha") {
            rotacion = -apertura * (Math.PI / 2.5);
          } else {
            rotacion = index === 0 ? apertura * (Math.PI / 2.5) : -apertura * (Math.PI / 2.5);
          }
        }
      }

      const pivotX = (tipo === "Abatible" && esMovil)
        ? ((direccion === "izquierda" || (direccion === "centro" && index === 0))
          ?  anchoPanelReal / 2
          : -anchoPanelReal / 2)
        : 0;

      const posManija = esMovil
        ? (tipo === "Corrediza"
          ? (direccion === "izquierda" ? -anchoPanelReal / 2 + 0.15
            : direccion === "derecha"  ?  anchoPanelReal / 2 - 0.15
            : (index === 0 ? anchoPanelReal / 2 - 0.15 : -anchoPanelReal / 2 + 0.15))
          : ((direccion === "izquierda" || (direccion === "centro" && index === 0))
            ? -anchoPanelReal / 2 + 0.15
            :  anchoPanelReal / 2 - 0.15))
        : 0;

      const contenido = (
        <>
          {/* Marco */}
          {[
            [0,  altoN/2 - ESPESOR_MARCO/2, 0, [anchoPanelReal, ESPESOR_MARCO, ESPESOR_MARCO]],
            [0, -altoN/2 + ESPESOR_MARCO/2, 0, [anchoPanelReal, ESPESOR_MARCO, ESPESOR_MARCO]],
            [-anchoPanelReal/2 + ESPESOR_MARCO/2, 0, 0, [ESPESOR_MARCO, altoN, ESPESOR_MARCO]],
            [ anchoPanelReal/2 - ESPESOR_MARCO/2, 0, 0, [ESPESOR_MARCO, altoN, ESPESOR_MARCO]],
          ].map(([x, y, z, args], i) => (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={args} />
              <meshStandardMaterial {...mMarco} />
            </mesh>
          ))}
          {/* Vidrio */}
          <mesh>
            <boxGeometry args={[
              anchoPanelReal - ESPESOR_MARCO * 2,
              altoN          - ESPESOR_MARCO * 2,
              ESPESOR_VIDRIO,
            ]} />
            <meshPhysicalMaterial {...mVidrio} />
          </mesh>
          {/* Manija */}
          {esMovil && (
            <mesh position={[posManija, 0, ESPESOR_MARCO]}>
              <boxGeometry args={[0.03, 0.3, 0.05]} />
              <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
            </mesh>
          )}
          {/* LED indicador */}
          {esMovil && (
            <mesh position={[0, -altoN / 2 + 0.3, ESPESOR_MARCO]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
              <meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={0.3} />
            </mesh>
          )}
        </>
      );

      return (
        <group key={index} position={[xBase + desplazamiento, altoN / 2, 0]}>
          {tipo === "Abatible" && esMovil ? (
            <group position={[-pivotX, 0, 0]}>
              <group rotation={[0, rotacion, 0]}>
                <group position={[pivotX, 0, 0]}>{contenido}</group>
              </group>
            </group>
          ) : contenido}
        </group>
      );
    }),
  [numPaneles, anchoN, altoN, anchoPanelReal, numPuertasMoviles, tipo, apertura, direccion, mMarco, mVidrio]);

  return (
    <group>
      {rieles}
      {paneles}
    </group>
  );
}
