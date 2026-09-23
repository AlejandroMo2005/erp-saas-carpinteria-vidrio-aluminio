const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/colores
 * Retorna colores activos (MARCO y VIDRIO) con su valor real
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        nombre,
        valor,
        tipo
      FROM colores
      WHERE activo = 1
      ORDER BY tipo, nombre
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('❌ Error obteniendo colores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo colores'
    });
  }
});

module.exports = router;
