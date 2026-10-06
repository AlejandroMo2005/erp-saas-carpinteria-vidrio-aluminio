// src/config/database.js
// ⭐ Sprint 21 — Movido desde backend/config/database.js
//   Ruta canónica: src/config/database.js
//   Imports que apuntaban a backend/config/database → src/config/database
//
// Sin cambios de lógica respecto a la versión anterior.

'use strict';

const mysql = require('mysql2/promise');

// ── Validación temprana de variables críticas ────────────────────────────
// Fallar rápido al inicio es mejor que fallar en medio de una request.
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

for (const varName of REQUIRED_ENV) {
  if (!process.env[varName]) {
    console.error(`❌ CONFIGURACIÓN INCOMPLETA: Variable de entorno "${varName}" no definida.`);
    console.error('   Crea un archivo .env basado en .env.example y reinicia el servidor.');
    process.exit(1);
  }
}

// ── Pool de conexiones ───────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT, 10) || 3306,

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,

  enableKeepAlive:       true,
  keepAliveInitialDelay: 10000,

  timezone: 'local',
});

// ── Test de conexión ─────────────────────────────────────────────────────
pool.testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ Error de conexión a la base de datos:', err.message);
    return false;
  }
};

module.exports = pool;
