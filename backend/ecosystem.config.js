// backend/ecosystem.config.js
// Sprint 17 — DT-03 PM2 Cluster
//
// Ubicación: backend/ecosystem.config.js  (misma carpeta que server.js)
//
// Arranque:
//   pm2 start ecosystem.config.js --env production
//
// Con 4 cores → 4 workers → ~200 usuarios concurrentes vs ~50 en single process.
// El estado crítico (blacklist, sesiones) ya está en Redis + MySQL → cluster seguro.

'use strict';

module.exports = {
  apps: [
    {
      name:      'inventario-proformas',
      script:    './server.js',           // relativo a la ubicación de este archivo
      instances: 'max',                   // un worker por core físico (os.cpus().length)
      exec_mode: 'cluster',               // comparte el puerto entre workers vía IPC del SO

      // ── Entorno ──────────────────────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        // PORT lo hereda del .env — no se sobreescribe aquí para no
        // entrar en conflicto con el valor que ya tiene configurado.
      },
      env_development: {
        NODE_ENV: 'development',
      },

      // ── Logs ─────────────────────────────────────────────────────────────
      // Coincide con la carpeta ./logs/ que ya usa Winston en el proyecto.
      error_file: './logs/pm2-error.log',
      out_file:   './logs/pm2-out.log',
      merge_logs: true,                   // un solo archivo combinado de todos los workers
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // ── Memoria ──────────────────────────────────────────────────────────
      // Si un worker supera 400 MB se reinicia solo, sin tumbar los demás.
      max_memory_restart: '400M',

      // ── Estabilidad ──────────────────────────────────────────────────────
      watch:         false,               // nunca true en producción
      autorestart:   true,
      restart_delay: 2000,                // espera 2 s antes de reiniciar un worker caído

      // ── Graceful shutdown ─────────────────────────────────────────────────
      // Tiempo que PM2 espera a que las requests en curso terminen
      // antes de matar el proceso (SIGTERM → SIGKILL).
      // Debe ser mayor que el timeout más largo de tus rutas.
      kill_timeout:   5000,               // 5 s
      listen_timeout: 8000,               // 8 s para que el worker levante y empiece a escuchar
    },
  ],
};