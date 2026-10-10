import { useMemo } from "react";
import useSceneMaterials from "../useSceneMaterials";
import ContenidoHoja from "../ContenidoHoja";
import PanelesYRieles from "../PanelesYRieles";

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
        radioManija={0.015}
        altoManija={0.08}
      />
    ),
    [material, anchoHojaN, altoN, tipo, mMarco, mVidrio],
  );

  return (
    <group position={[0, 0, 0]}>
      <PanelesYRieles
        hojas={hojas}
        anchoHojaN={anchoHojaN}
        altoN={altoN}
        tipo={tipo}
        contenidoHoja={contenidoHoja}
        anguloAbatible={-0.3}
        anchoTotal={anchoTotal}
      />
    </group>
  );
}
