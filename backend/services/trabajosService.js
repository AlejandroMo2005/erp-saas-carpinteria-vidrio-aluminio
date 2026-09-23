// src/services/trabajosService.js
import api from './api';

/**
 * Obtiene TODOS los trabajos activos
 * No filtra, no transforma, no rompe nada existente
 */
export const getTrabajos = async () => {
  const response = await api.get('/trabajos');
  return response.data;
};
