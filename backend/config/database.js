
const mysql = require('mysql2/promise');

// ── Validación temprana de variables críticas ────────────────────────────
// Fallar rápido al inicio es mejor que fallar en medio de una request.
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

for (const varName of REQUIRED_ENV) {
  if (!process.env[varName]) {
    console.error(`❌ CONFIGURACIÓN INCOMPLETA: Variable de entorno "${varName}" no definida.`);
    console.error('   Crea un archivo .env basado en .env.example y reinicia el servidor.');
    process.exit(1); // Detiene el servidor antes de aceptar cualquier request
  }
}

// ── Pool de conexiones ───────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     parseInt(process.env.DB_PORT, 10) || 3306,

  waitForConnections: true,
  connectionLimit:    10,    // máximo de conexiones simultáneas al pool
  queueLimit:         0,     // 0 = sin límite de cola (espera si todas están ocupadas)

  // Mantiene las conexiones vivas — evita "ECONNRESET" después de inactividad
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000, // 10s antes del primer keepalive

  // Timezone explícito — evita problemas con fechas entre Node y MySQL
  timezone: 'local',
});

// ── Test de conexión ─────────────────────────────────────────────────────
// Usado en startServer() y en el endpoint /health
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