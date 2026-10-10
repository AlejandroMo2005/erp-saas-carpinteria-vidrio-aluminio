import { useMemo } from "react";
import useSceneMaterials, { DoubleSide } from "../useSceneMaterials";
import ContenidoHoja from "../ContenidoHoja";
import PanelesYRieles from "../PanelesYRieles";

const ESPESOR_PARED = 0.2;

export default function VentanaScene({
  hojas = 2,
  anchoHoja = 0.75,
  alto = 1.2,
  tipo = "Corrediza",
  material = "Mixta",
  colorMarco = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  const altoN = Math.max(0.2, Number.parseFloat(alto) || 1.2);
  const anchoHojaN = Math.max(0.1, Number.parseFloat(anchoHoja) || 0.75);
  const anchoTotal = hojas * anchoHojaN;

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
        radioManija={0.012}
        altoManija={0.06}
      />
    ),
    [material, anchoHojaN, altoN, tipo, mMarco, mVidrio],
  );

  const marcoPared = useMemo(() => {
    const anchoPared = anchoTotal + 0.4;
    const altoPared = altoN + 0.4;
    const mPared = {
      color: "#d0d0d0",
      roughness: 0.8,
      side: DoubleSide,
    };

    return (
      <group position={[0, altoN / 2, -0.1]}>
        <mesh position={[0, altoPared / 2 + ESPESOR_PARED / 2, 0]}>
          <boxGeometry args={[anchoPared, ESPESOR_PARED, ESPESOR_PARED]} />
          <meshStandardMaterial {...mPared} />
        </mesh>

        <mesh position={[0, -altoPared / 2 - ESPESOR_PARED / 2, 0]}>
          <boxGeometry args={[anchoPared, ESPESOR_PARED, ESPESOR_PARED]} />
          <meshStandardMaterial {...mPared} />
        </mesh>

        <mesh position={[-anchoPared / 2 - ESPESOR_PARED / 2, 0, 0]}>
          <boxGeometry
            args={[
              ESPESOR_PARED,
              altoPared + ESPESOR_PARED * 2,
              ESPESOR_PARED,
            ]}
          />
          <meshStandardMaterial {...mPared} />
        </mesh>

        <mesh position={[anchoPared / 2 + ESPESOR_PARED / 2, 0, 0]}>
          <boxGeometry
            args={[
              ESPESOR_PARED,
              altoPared + ESPESOR_PARED * 2,
              ESPESOR_PARED,
            ]}
          />
          <meshStandardMaterial {...mPared} />
        </mesh>
      </group>
    );
  }, [anchoTotal, altoN]);

  return (
    <group position={[0, 0, 0]}>
      {marcoPared}
      <PanelesYRieles
        hojas={hojas}
        anchoHojaN={anchoHojaN}
        altoN={altoN}
        tipo={tipo}
        contenidoHoja={contenidoHoja}
        anguloAbatible={-0.25}
        anchoTotal={anchoTotal}
      />
    </group>
  );
}
