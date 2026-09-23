// VidrioTempladoScene.jsx — Sprint 8
// position=[0,0,0] — el -0.3 en Y desplazaba el objeto del target de cámara

import VidrioTempladoEntorno from "./VidrioTempladoEntorno";
import VidrioTempladoSistema from "./VidrioTempladoSistema";

export default function VidrioTempladoScene({
  ancho,
  alto,
  tipo,
  apertura,
  direccion,
  colorMarco,
  colorVidrio,
  opacidadMarco  = 1,
  opacidadVidrio = 0.3,
}) {
  return (
    <group position={[0, 0, 0]}>
      <VidrioTempladoEntorno ancho={ancho} alto={alto} />
      <VidrioTempladoSistema
        ancho={ancho}
        alto={alto}
        tipo={tipo}
        apertura={apertura}
        direccion={direccion}
        colorMarco={colorMarco}
        colorVidrio={colorVidrio}
        opacidadMarco={opacidadMarco}
        opacidadVidrio={opacidadVidrio}
      />
    </group>
  );
}