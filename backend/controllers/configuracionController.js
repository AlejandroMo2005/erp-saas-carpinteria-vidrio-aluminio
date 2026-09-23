// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER: CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const Configuracion = require('../models/Configuracion');

/**
 * GET /api/configuracion
 * Devuelve todos los pares clave-valor
 */
async function obtenerTodos(req, res) {
  try {
    const datos = await Configuracion.obtenerTodos();

    return res.json({
      success: true,
      data:    datos
    });
  } catch (err) {
    console.error('Error en obtenerTodos configuracion:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
}

/**
 * GET /api/configuracion/:clave
 * Devuelve el valor de una clave específica
 */
async function obtenerPorClave(req, res) {
  try {
    const { clave } = req.params;

    if (!clave || typeof clave !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Clave inválida'
      });
    }

    const valor = await Configuracion.obtenerValor(clave.toUpperCase());

    if (valor === null) {
      return res.status(404).json({
        success: false,
        message: `Clave '${clave}' no encontrada`
      });
    }

    return res.json({
      success: true,
      data: {
        clave: clave.toUpperCase(),
        valor
      }
    });
  } catch (err) {
    console.error('Error en obtenerPorClave:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
}

/**
 * PUT /api/configuracion/:clave
 * Actualiza o inserta un valor (solo ADMIN)
 */
async function actualizarValor(req, res) {
  try {
    const { clave }  = req.params;
    const { valor }  = req.body;

    if (!clave || valor === undefined || valor === null) {
      return res.status(400).json({
        success: false,
        message: 'Clave y valor son requeridos'
      });
    }

    // Validación específica para IVA
    if (clave.toUpperCase() === 'IVA') {
      const tasa = parseFloat(valor);
      if (isNaN(tasa) || tasa < 0 || tasa > 1) {
        return res.status(400).json({
          success: false,
          message: 'El IVA debe ser un número entre 0 y 1 (ej: 0.15 para 15%)'
        });
      }
    }

    await Configuracion.guardarValor(clave.toUpperCase(), valor);

    return res.json({
      success: true,
      message: 'Configuración actualizada',
      data: {
        clave: clave.toUpperCase(),
        valor: String(valor)
      }
    });
  } catch (err) {
    console.error('Error en actualizarValor:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
}

/**
 * GET /api/configuracion/iva/tasa
 * Endpoint rápido para obtener la tasa de IVA como número
 */
async function obtenerTasaIva(req, res) {
  try {
    const tasa = await Configuracion.obtenerTasaIva();
    return res.json({
      success: true,
      data: {
        clave: 'IVA',
        valor: String(tasa),
        porcentaje: `${(tasa * 100).toFixed(0)}%`
      }
    });
  } catch (err) {
    console.error('Error en obtenerTasaIva:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tasa de IVA'
    });
  }
}

module.exports = {
  obtenerTodos,
  obtenerPorClave,
  actualizarValor,
  obtenerTasaIva
};