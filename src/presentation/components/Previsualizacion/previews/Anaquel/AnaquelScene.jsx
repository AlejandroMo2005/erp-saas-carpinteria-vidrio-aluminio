// previews/Anaquel/AnaquelScene.jsx
// Sprint 18 DT-IA-01 — AnaquelSistema como import estático para evitar
// contexto R3F roto por lazy dentro del Canvas...

import { useMemo } from "react";
import AnaquelSistema from "./AnaquelSistema";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

const ESPESOR_ESTANTE = 0.025;
const ESPESOR_POSTE   = 0.04;
const ESPESOR_FONDO   = 0.010;

const POSTE_POSITIONS = [
  [-1,  1],
  [ 1,  1],
  [-1, -1],
  [ 1, -1],
];

const MAT_ESTANTE = {
  Madera: { color: "#A0522D", roughness: 0.85, metalness: 0.0 },
  Metal:  { color: null,      roughness: 0.30, metalness: 0.8 },
  Vidrio: null,
};

const MAT_POSTE = {
  Madera: { color: "#7B3A10", roughness: 0.80, metalness: 0.0 },
  Metal:  { color: null,      roughness: 0.25, metalness: 0.85 },
  Vidrio: { color: null,      roughness: 0.25, metalness: 0.85 },
};

export default function AnaquelScene({
  ancho,
  alto,
  niveles,
  material,
  profundidad,
  colorMarcoHex  = "#888888",
  colorVidrioHex = "#888888",
  opacidadMarco  = 1,
  opacidadVidrio = 0.35,
  tipoPuerta     = "Sin puerta",
  estadoPuerta   = "Cerrada",
}) {
  const anchoS   = Math.max(0.1, ancho);
  const altoS    = Math.max(0.1, alto);
  const profS    = Math.max(0.05, profundidad);
  const nivelesS = Math.min(10, Math.max(2, niveles));

  const altoUtil     = altoS - ESPESOR_ESTANTE;
  const altoPorNivel = altoUtil / (nivelesS - 1);

  const propsMarco = useMemo(() => {
    const base = MAT_POSTE[material] ?? MAT_POSTE.Metal;
    return {
      color:       base.color ?? colorMarcoHex,
      roughness:   base.roughness,
      metalness:   base.metalness,
      side:        DoubleSide,
      transparent: opacidadMarco < 1,
      opacity:     opacidadMarco,
    };
  }, [material, colorMarcoHex, opacidadMarco]);

  const propsEstante = useMemo(() => {
    if (material === "Vidrio") return null;
    const base = MAT_ESTANTE[material] ?? MAT_ESTANTE.Metal;
    return {
      color:     base.color ?? colorMarcoHex,
      roughness: base.roughness,
      metalness: base.metalness,
      side:      DoubleSide,
    };
  }, [material, colorMarcoHex]);

  const estantes = useMemo(() => {
    const lista = [];
    for (let i = 0; i < nivelesS; i++) {
      const yPos = -altoS / 2 + ESPESOR_ESTANTE / 2 + i * altoPorNivel;

      if (material === "Vidrio") {
        lista.push(
          <mesh key={`est-${i}`} position={[0, yPos, 0]}>
            <boxGeometry args={[anchoS, ESPESOR_ESTANTE, profS]} />
            <meshPhysicalMaterial
              color={colorVidrioHex}
              transparent
              opacity={Math.min(1, opacidadVidrio * 0.7 + 0.15)}
              transmission={0.8}
              roughness={0.05}
              thickness={0.3}
              side={DoubleSide}
            />
          </mesh>
        );
      } else {
        lista.push(
          <mesh key={`est-${i}`} position={[0, yPos, 0]}>
            <boxGeometry args={[anchoS, ESPESOR_ESTANTE, profS]} />
            <meshStandardMaterial {...propsEstante} />
          </mesh>
        );
      }
    }
    return lista;
  }, [nivelesS, altoS, altoPorNivel, anchoS, profS, material, colorVidrioHex, opacidadVidrio, propsEstante]);

  const postes = useMemo(() =>
    POSTE_POSITIONS.map(([sx, sz], i) => (
      <mesh
        key={`poste-${i}`}
        position={[
          sx * (anchoS / 2 - ESPESOR_POSTE / 2),
          0,
          sz * (profS  / 2 - ESPESOR_POSTE / 2),
        ]}
      >
        <boxGeometry args={[ESPESOR_POSTE, altoS, ESPESOR_POSTE]} />
        <meshStandardMaterial {...propsMarco} />
      </mesh>
    )),
  [anchoS, altoS, profS, propsMarco]);

  const fondo = useMemo(() => {
    const zFondo = -profS / 2 + ESPESOR_FONDO / 2;

    if (material === "Vidrio") {
      return (
        <mesh position={[0, 0, zFondo]}>
          <boxGeometry args={[anchoS, altoS, ESPESOR_FONDO]} />
          <meshPhysicalMaterial
            color={colorVidrioHex}
            transparent
            opacity={opacidadVidrio * 0.35 + 0.08}
            transmission={0.6}
            roughness={0.1}
            side={DoubleSide}
          />
        </mesh>
      );
    }

    const base = MAT_ESTANTE[material] ?? MAT_ESTANTE.Metal;
    return (
      <mesh position={[0, 0, zFondo]}>
        <boxGeometry args={[anchoS, altoS, ESPESOR_FONDO]} />
        <meshStandardMaterial
          color={base.color ?? colorMarcoHex}
          roughness={base.roughness}
          metalness={base.metalness}
          side={DoubleSide}
        />
      </mesh>
    );
  }, [anchoS, altoS, profS, material, colorVidrioHex, opacidadVidrio, colorMarcoHex]);

  return (
    <group position={[0, 0, 0]}>
      {fondo}
      {postes}
      {estantes}
      <AnaquelSistema
        ancho={anchoS}
        alto={altoS}
        profundidad={profS}
        tipoPuerta={tipoPuerta}
        estadoPuerta={estadoPuerta}
        colorVidrioHex={colorVidrioHex}
        opacidadVidrio={opacidadVidrio}
        colorMarcoHex={colorMarcoHex}
        opacidadMarco={opacidadMarco}
      />
    </group>
  );
}
