// VentanaScene.jsx — Sprint 8
// 🔧 Sprint 15 — Fix vendor-three en carga inicial:
//   ANTES: import { DoubleSide } from "three"
//          → Rollup detecta import estático de "three" en este módulo
//          → si el chunk analyzer rastrea esta dependencia hacia el bundle inicial,
//            vendor-three (754KB gzip) se carga en el arranque.
//   AHORA: DoubleSide = 2 (constante numérica de three.js — nunca cambia).
//          Este módulo ya no tiene ningún import de "three", @react-three/fiber
//          ni @react-three/drei. Las primitivas JSX (<boxGeometry>, etc.) son
//          manejadas por @react-three/fiber sin necesitar import directo...
import { useMemo } from "react";
import useSceneMaterials, { DoubleSide } from "../useSceneMaterials";


const ESPESOR_MARCO = 0.08;
const PROFUNDIDAD   = 0.05;
const ESPESOR_PARED = 0.2;

export default function VentanaScene({
  hojas       = 2,
  anchoHoja   = 0.75,
  alto        = 1.2,
  tipo        = "Corrediza",
  material    = "Mixta",
  colorMarco  = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const altoN      = Math.max(0.2, Number.parseFloat(alto)     || 1.2);
  const anchoHojaN = Math.max(0.1, Number.parseFloat(anchoHoja) || 0.75);
  const anchoTotal = hojas * anchoHojaN;

  const { mMarco, mVidrio } = useSceneMaterials(colorMarco, colorVidrio);

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
        <meshStandardMaterial {...mMarco} />
      </mesh>
    );

    // Mixta
    return (
      <>
        <mesh position={[0, altoN/2 - ESPESOR_MARCO/2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        <mesh position={[0, -altoN/2 + ESPESOR_MARCO/2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        <mesh position={[-anchoHojaN/2 + ESPESOR_MARCO/2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        <mesh position={[anchoHojaN/2 - ESPESOR_MARCO/2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
        <mesh>
          <boxGeometry args={[
            anchoHojaN - ESPESOR_MARCO * 2,
            altoN - ESPESOR_MARCO * 2,
            PROFUNDIDAD * 0.6,
          ]} />
          <meshPhysicalMaterial {...mVidrio} />
        </mesh>
        {tipo === "Abatible" && (
          <mesh position={[anchoHojaN/2 - 0.15, 0, PROFUNDIDAD/2 + 0.03]}>
            <cylinderGeometry args={[0.012, 0.012, 0.06, 16]} />
            <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
          </mesh>
        )}
      </>
    );
  }, [material, anchoHojaN, altoN, tipo, mMarco, mVidrio]);

  // ── Hojas ────────────────────────────────────────────────────────────────
  const paneles = useMemo(() =>
    Array.from({ length: hojas }, (_, i) => {
      const xPos = (i - hojas/2 + 0.5) * anchoHojaN;
      const rotY = tipo === "Abatible" && i % 2 === 0 ? -0.25 : 0;
      return (
        <group key={i} position={[xPos, altoN/2, 0]}>
          {tipo === "Abatible"
            ? <group rotation={[0, rotY, 0]}>{ContenidoHoja}</group>
            : ContenidoHoja}
        </group>
      );
    }),
  [hojas, anchoHojaN, altoN, tipo, ContenidoHoja]);

  // ── Rieles corrediza ─────────────────────────────────────────────────────
  const rieles = useMemo(() => {
    if (tipo !== "Corrediza") return null;
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
  }, [tipo, anchoTotal, altoN]);

  // ── Marco de pared ───────────────────────────────────────────────────────
  const marcoPared = useMemo(() => {
    const anchoPared = anchoTotal + 0.4;
    const altoPared  = altoN + 0.4;
    const mPared = { color: "#d0d0d0", roughness: 0.8, side: DoubleSide };
    return (
      <group position={[0, altoN/2, -0.1]}>
        <mesh position={[0, altoPared/2 + ESPESOR_PARED/2, 0]}>
          <boxGeometry args={[anchoPared, ESPESOR_PARED, ESPESOR_PARED]} />
          <meshStandardMaterial {...mPared} />
        </mesh>
        <mesh position={[0, -altoPared/2 - ESPESOR_PARED/2, 0]}>
          <boxGeometry args={[anchoPared, ESPESOR_PARED, ESPESOR_PARED]} />
          <meshStandardMaterial {...mPared} />
        </mesh>
        <mesh position={[-anchoPared/2 - ESPESOR_PARED/2, 0, 0]}>
          <boxGeometry args={[ESPESOR_PARED, altoPared + ESPESOR_PARED*2, ESPESOR_PARED]} />
          <meshStandardMaterial {...mPared} />
        </mesh>
        <mesh position={[anchoPared/2 + ESPESOR_PARED/2, 0, 0]}>
          <boxGeometry args={[ESPESOR_PARED, altoPared + ESPESOR_PARED*2, ESPESOR_PARED]} />
          <meshStandardMaterial {...mPared} />
        </mesh>
      </group>
    );
  }, [anchoTotal, altoN]);

  return (
    <group position={[0, 0, 0]}>
      {marcoPared}
      {rieles}
      {paneles}
    </group>
  );
}
