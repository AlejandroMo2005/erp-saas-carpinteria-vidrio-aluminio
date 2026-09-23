// src/apiConfig.js

// Obtenemos el hostname dinámicamente
const hostname = window.location.hostname;

// Configura la URL base de la API según el entorno
export const API_BASE_URL = `http://${hostname}:5000/api`;

console.log("Conectando a la API en:", API_BASE_URL);