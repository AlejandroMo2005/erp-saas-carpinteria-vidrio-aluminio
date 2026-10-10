import { useMemo } from "react";

const ESPESOR_MARCO = 0.08;
const PROFUNDIDAD = 0.05;

export default function ContenidoHoja({
  material,
  anchoHojaN,
  altoN,
  tipo,
  mMarco,
  mVidrio,
  radioManija = 0.015,
  altoManija = 0.08,
}) {
  return useMemo(() => {
    if (material === "Vidrio") {
      return (
        <mesh>
          <boxGeometry args={[anchoHojaN - 0.02, altoN - 0.02, PROFUNDIDAD]} />
          <meshPhysicalMaterial {...mVidrio} />
        </mesh>
      );
    }

    if (material === "Aluminio") {
      return (
        <mesh>
          <boxGeometry args={[anchoHojaN - 0.02, altoN - 0.02, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>
      );
    }

    return (
      <>
        <mesh position={[0, altoN / 2 - ESPESOR_MARCO / 2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>

        <mesh position={[0, -altoN / 2 + ESPESOR_MARCO / 2, 0]}>
          <boxGeometry args={[anchoHojaN, ESPESOR_MARCO, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>

        <mesh position={[-anchoHojaN / 2 + ESPESOR_MARCO / 2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>

        <mesh position={[anchoHojaN / 2 - ESPESOR_MARCO / 2, 0, 0]}>
          <boxGeometry args={[ESPESOR_MARCO, altoN, PROFUNDIDAD]} />
          <meshStandardMaterial {...mMarco} />
        </mesh>

        <mesh>
          <boxGeometry
            args={[
              anchoHojaN - ESPESOR_MARCO * 2,
              altoN - ESPESOR_MARCO * 2,
              PROFUNDIDAD * 0.6,
            ]}
          />
          <meshPhysicalMaterial {...mVidrio} />
        </mesh>

        {tipo === "Abatible" && (
          <mesh
            position={[
              anchoHojaN / 2 - 0.15,
              0,
              PROFUNDIDAD / 2 + 0.03,
            ]}
          >
            <cylinderGeometry
              args={[radioManija, radioManija, altoManija, 16]}
            />
            <meshStandardMaterial
              color="#888888"
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        )}
      </>
    );
  }, [
    material,
    anchoHojaN,
    altoN,
    tipo,
    mMarco,
    mVidrio,
    radioManija,
    altoManija,
  ]);
}