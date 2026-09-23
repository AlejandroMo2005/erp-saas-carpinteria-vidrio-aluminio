// src/presentation/components/Pedidos/VisualizadorModal/utils.js
import { HEX_COLORES } from './constants';

/**
 * Convierte un nombre de color de la API o un valor hex directo
 * al formato hex que necesita el canvas R3F.
 */
export function normalizarColor(valor) {
  if (!valor) return '#808080';
  if (valor.startsWith('#')) return valor;
  return HEX_COLORES[valor] ?? '#808080';
}