import { useMemo } from "react";

export default function PanelesYRieles({
  hojas,
  anchoHojaN,
  altoN,
  tipo,
  contenidoHoja,
  anguloAbatible,
  anchoTotal,
}) {
  const paneles = useMemo(
    () =>
      Array.from({ length: hojas }, (_, i) => {
        const xPos = (i - hojas / 2 + 0.5) * anchoHojaN;
        const rotY =
          tipo === "Abatible" && i % 2 === 0 ? anguloAbatible : 0;

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
    [hojas, anchoHojaN, altoN, tipo, contenidoHoja, anguloAbatible],
  );

  const rieles = useMemo(() => {
    if (tipo !== "Corrediza") return null;

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
  }, [tipo, anchoTotal, altoN]);

  return (
    <>
      {rieles}
      {paneles}
    </>
  );
}
