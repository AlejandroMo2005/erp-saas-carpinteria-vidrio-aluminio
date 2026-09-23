// CieloRasoScene.jsx
// Fix: Math.ceil en lugar de Math.floor → los paneles de borde
// se recortan visualmente (se reduce su ancho/largo) pero SIEMPRE
// se renderiza uno para rellenar el espacio restante.
//
// 🔧 Sprint 15 — Fix vendor-three en carga inicial:
//   ANTES: import { DoubleSide } from "three"
//   AHORA: DoubleSide = 2 (constante numérica, nunca cambia en three.js).
//          Este módulo ya no tiene imports directos de "three".

import { useMemo } from "react";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

export default function CieloRasoScene({
  ancho,
  alto,
  tipo,
  acabado,
  // Sanitizado: colorMarcoHex es #rrggbb puro — nunca rgba().
  colorMarcoHex = "#cccccc",
  modoLamparas = "Centro",
}) {
  const alturaCuarto   = 2.6;
  const espesorPlancha = 0.015;
  const moduloDrywall  = 0.6;
  const moduloPVC      = 0.25;

  // Sanitizado: clamp mínimo para evitar geometrías con dimensiones ≤ 0
  const anchoS = Math.max(0.1, parseFloat(ancho) || 1);
  const altoS  = Math.max(0.1, parseFloat(alto)  || 1);

  /* ── Paredes del cuarto ──────────────────────────────────────────────── */
  const paredes = useMemo(() => (
    <>
      <mesh position={[0, alturaCuarto / 2, -altoS / 2]}>
        <boxGeometry args={[anchoS, alturaCuarto, 0.08]} />
        <meshStandardMaterial color="#eeeeee" side={DoubleSide} />
      </mesh>
      <mesh position={[-anchoS / 2, alturaCuarto / 2, 0]}>
        <boxGeometry args={[0.08, alturaCuarto, altoS]} />
        <meshStandardMaterial color="#f2f2f2" side={DoubleSide} />
      </mesh>
      <mesh position={[anchoS / 2, alturaCuarto / 2, 0]}>
        <boxGeometry args={[0.08, alturaCuarto, altoS]} />
        <meshStandardMaterial color="#f2f2f2" side={DoubleSide} />
      </mesh>
    </>
  ), [anchoS, altoS]);

  /* ── Drywall ─────────────────────────────────────────────────────────── */
  const drywall = useMemo(() => {
    const nx = Math.ceil(anchoS / moduloDrywall);
    const nz = Math.ceil(altoS  / moduloDrywall);
    const elementos = [];

    for (let i = 0; i < nx; i++) {
      const wReal = Math.min(moduloDrywall, anchoS - i * moduloDrywall);
      const cx    = -anchoS / 2 + i * moduloDrywall + wReal / 2;

      for (let j = 0; j < nz; j++) {
        const dReal = Math.min(moduloDrywall, altoS - j * moduloDrywall);
        const cz    = -altoS / 2 + j * moduloDrywall + dReal / 2;

        elementos.push(
          <mesh key={`d-${i}-${j}`} position={[cx, alturaCuarto, cz]}>
            <boxGeometry args={[wReal - 0.02, espesorPlancha, dReal - 0.02]} />
            <meshStandardMaterial
              color="#f6f6f6"
              roughness={acabado === "Texturizado" ? 0.95 : 0.85}
              side={DoubleSide}
            />
          </mesh>
        );
      }
    }

    for (let i = 0; i <= nx; i++) {
      const x = -anchoS / 2 + i * moduloDrywall;
      elementos.push(
        <mesh key={`px-${i}`} position={[Math.min(x, anchoS / 2), alturaCuarto - 0.01, 0]}>
          <boxGeometry args={[0.025, 0.018, altoS]} />
          <meshStandardMaterial color="#cccccc" metalness={0.6} roughness={0.4} />
        </mesh>
      );
    }
    for (let j = 0; j <= nz; j++) {
      const z = -altoS / 2 + j * moduloDrywall;
      elementos.push(
        <mesh key={`pz-${j}`} position={[0, alturaCuarto - 0.01, Math.min(z, altoS / 2)]}>
          <boxGeometry args={[anchoS, 0.018, 0.025]} />
          <meshStandardMaterial color="#cccccc" metalness={0.6} roughness={0.4} />
        </mesh>
      );
    }

    return elementos;
  }, [anchoS, altoS, acabado]);

  /* ── PVC ─────────────────────────────────────────────────────────────── */
  const pvc = useMemo(() => {
    const num = Math.ceil(anchoS / moduloPVC);
    const elementos = [];

    for (let i = 0; i < num; i++) {
      const wReal = Math.min(moduloPVC, anchoS - i * moduloPVC);
      const cx    = -anchoS / 2 + i * moduloPVC + wReal / 2;

      elementos.push(
        <mesh key={`pvc-${i}`} position={[cx, alturaCuarto, 0]}>
          <boxGeometry args={[wReal - 0.008, espesorPlancha, altoS]} />
          <meshStandardMaterial
            color={colorMarcoHex}
            roughness={0.3}
            metalness={0.2}
            side={DoubleSide}
          />
        </mesh>
      );
      if (i < num - 1) {
        elementos.push(
          <mesh key={`j-${i}`} position={[cx + wReal / 2, alturaCuarto - 0.01, 0]}>
            <boxGeometry args={[0.018, 0.018, altoS]} />
            <meshStandardMaterial color="#dddddd" />
          </mesh>
        );
      }
    }
    return elementos;
  }, [anchoS, altoS, colorMarcoHex]);

  /* ── Lámparas ────────────────────────────────────────────────────────── */
  const posLamparas = useMemo(() => {
    const y = alturaCuarto - 0.05;
    const margen = 0.6;
    const pos = [];
    if (modoLamparas === "Centro" || modoLamparas === "Mixto")
      pos.push([0, y, 0]);
    if (modoLamparas === "Esquinas" || modoLamparas === "Mixto")
      pos.push(
        [-anchoS / 2 + margen, y, -altoS / 2 + margen],
        [ anchoS / 2 - margen, y, -altoS / 2 + margen],
        [-anchoS / 2 + margen, y,  altoS / 2 - margen],
        [ anchoS / 2 - margen, y,  altoS / 2 - margen],
      );
    return pos;
  }, [anchoS, altoS, modoLamparas]);

  return (
    <group>
      {paredes}
      {tipo === "Drywall" && drywall}
      {tipo === "PVC"     && pvc}
      {posLamparas.map((pos, i) => (
        <group key={`lamp-${i}`} position={pos}>
          <mesh>
            <boxGeometry args={[0.5, 0.02, 0.5]} />
            <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1} color="#ffffff" />
          </mesh>
          <pointLight intensity={1.2} distance={6} decay={2} position={[0, -0.2, 0]} />
        </group>
      ))}
    </group>
  );
}