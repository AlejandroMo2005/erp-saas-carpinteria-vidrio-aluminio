import { useMemo } from 'react';

export default function usePreviewCalculator({
  ancho,
  alto,
  cantidad = 1
}) {
  return useMemo(() => {
    const nAncho = Number(ancho) || 0;
    const nAlto = Number(alto) || 0;
    const nCantidad = Number(cantidad) || 1;

    const anchoUnitario = nCantidad > 0 ? nAncho / nCantidad : 0;
    const areaTotal = nAncho * nAlto;
    const areaUnit = anchoUnitario * nAlto;

    return {
      anchoUnitario,
      areaTotal,
      areaUnit
    };
  }, [ancho, alto, cantidad]);
}
