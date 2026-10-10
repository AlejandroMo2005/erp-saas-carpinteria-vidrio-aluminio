import PuertaScene from "./PuertaScene";
import PuertaPreviewBase from "../PuertaPreviewBase";
import "./Puertas3D.css";

export default function PuertaPreview({
  ancho,
  alto,
  colorMarco = "#888888",
  colorVidrio = "#e0f2ff",
}) {
  return (
    <PuertaPreviewBase
      SceneComponent={PuertaScene}
      wrapperClass="puerta-preview"
      controlesClass="puerta-controles"
      renderClass="puerta-render"
      infoClass="puerta-info"
      opcionesHojas={[1, 2, 3, 4]}
      opcionesTipo={["Corrediza", "Abatible"]}
      opcionesMaterial={["Vidrio", "Aluminio", "Mixta"]}
      hojasIniciales={2}
      tipoInicial="Corrediza"
      materialInicial="Mixta"
      ancho={ancho}
      alto={alto}
      anchoPredeterminado={1.5}
      altoPredeterminado={2.1}
      colorMarco={colorMarco}
      colorVidrio={colorVidrio}
    />
  );
}