import PuertaBanoScene from "./PuertaBanoScene";
import PuertaPreviewBase from "../PuertaPreviewBase";
import "./PuertaBano3D.css";

export default function PuertaBanoPreview({
  ancho,
  alto,
  colorMarco = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  return (
    <PuertaPreviewBase
      SceneComponent={PuertaBanoScene}
      wrapperClass="puerta-bano-preview"
      controlesClass="puerta-bano-controles"
      renderClass="puerta-bano-render"
      infoClass="puerta-bano-info"
      opcionesHojas={[1, 2]}
      opcionesTipo={["Corrediza", "Pivotante"]}
      opcionesMaterial={["Vidrio", "Esmerilado", "Con Marco"]}
      hojasIniciales={1}
      tipoInicial="Corrediza"
      materialInicial="Vidrio"
      ancho={ancho}
      alto={alto}
      anchoPredeterminado={0.9}
      altoPredeterminado={2.0}
      colorMarco={colorMarco}
      colorVidrio={colorVidrio}
    />
  );
}