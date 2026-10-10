import { useMemo } from "react";
import useSceneMaterials from "../useSceneMaterials";
import ContenidoHoja from "../ContenidoHoja";


export default function PuertaScene({
  hojas = 2,
  anchoHoja = 0.75,
  alto = 2.1,
  tipo = "Corrediza",
  material = "Mixta",
  colorMarco = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const altoN = Math.max(0.2, Number.parseFloat(alto) || 2.1);
  const anchoHojaN = Math.max(0.1, Number.parseFloat(anchoHoja) || 0.75);

  const { mMarco, mVidrio } = useSceneMaterials(colorMarco, colorVidrio);

  const contenidoHoja = useMemo(
    () => (
      <ContenidoHoja
        material={material}
        anchoHojaN={anchoHojaN}
        altoN={altoN}
        tipo={tipo}
        mMarco={mMarco}
        mVidrio={mVidrio}
        radioManija={0.015}
        altoManija={0.08}
      />
    ),
    [material, anchoHojaN, altoN, tipo, mMarco, mVidrio],
  );

  const paneles = useMemo(
    () =>
      Array.from({ length: hojas }, (_, i) => {
        const xPos = (i - hojas / 2 + 0.5) * anchoHojaN;
        const rotY = tipo === "Abatible" && i % 2 === 0 ? -0.3 : 0;

        return (
          <group key={i} position={[xPos, altoN / 2, 0]}>
            {tipo === "Abatible" ? (
              <group rotation={[0, rotY, 0]}>{contenidoHoja}</group>
            ) : (
              contenidoHoja
            )}
          </group>
        );
      }),
    [hojas, anchoHojaN, altoN, tipo, contenidoHoja],
  );

  const rieles = useMemo(() => {
    if (tipo !== "Corrediza") return null;

    const anchoTotal = hojas * anchoHojaN;

    return (
      <>
        <mesh position={[0, altoN + 0.05, 0]}>
          <boxGeometry args={[anchoTotal, 0.05, 0.08]} />
          <meshStandardMaterial
            color="#666666"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>

        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[anchoTotal, 0.05, 0.08]} />
          <meshStandardMaterial
            color="#666666"
            roughness={0.4}
            metalness={0.7}
          />
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
