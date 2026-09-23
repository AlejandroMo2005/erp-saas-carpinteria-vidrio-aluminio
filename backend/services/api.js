// frontend/src/services/api.js
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ===============================
// INSTANCIA CENTRAL DE AXIOS
// ===============================
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// INTERCEPTOR DE AUTENTICACIÓN
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// INTERCEPTOR DE RESPUESTAS (HARDENING)
// ===============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

// ===============================
// TRABAJOS
// ===============================
export const trabajosAPI = {
  getAll: () => api.get("/trabajos"),
  getRecetas: (trabajoId) =>
    api.get(`/trabajos/${Number(trabajoId)}/recetas`),
};

// ===============================
// AUTH
// ===============================
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  verify: () => api.get("/auth/verify"),
};

// ===============================
// MATERIALES
// ===============================
export const materialesAPI = {
  getAll: () => api.get("/materiales"),
  getById: (id) => api.get(`/materiales/${Number(id)}`),
  create: (data) => api.post("/materiales", data),
  update: (id, data) => api.put(`/materiales/${Number(id)}`, data),
  delete: (id) => api.delete(`/materiales/${Number(id)}`),
};

// ===============================
// PEDIDOS (ALINEADO AL BACKEND)
// ===============================
export const pedidosAPI = {
  getAll: () => api.get("/pedidos"),
  getById: (id) => api.get(`/pedidos/${Number(id)}`),
  create: (data) => api.post("/pedidos", data),
  updateEstado: (id, estado) =>
    api.put(`/pedidos/${Number(id)}/estado`, { estado }),
  delete: (id) => api.delete(`/pedidos/${Number(id)}`),
};

// ===============================
// PROFORMAS (ALINEADO AL BACKEND REAL)
// ===============================
export const proformasAPI = {
  getAll: () => api.get("/proformas"),
  getById: (id) => api.get(`/proformas/${Number(id)}`),

  // Cálculo de proforma
  calcular: (data) => api.post("/proformas/calcular", data),

  // Agendar proforma + pedido
  agendar: (data) => api.post("/proformas/agendar", data),
};

export default api;
