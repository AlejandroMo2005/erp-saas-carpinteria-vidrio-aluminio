/**
 * @fileoverview Servicio de Comprobantes Electrónicos
 * @module services/comprobanteService
 *
 * 🐛 Sprint 13 — Fix facturación desde pedido
 *
 * BUGS CORREGIDOS:
 *   Bug F1 — crearFacturaDesdePedido hacía JOIN con tabla `clientes` que no existe.
 *             El cliente vive en `proformas.cliente` y `proformas.telefono`.
 *
 *   Bug F2 — Los items de factura se tomaban de `pedido_detalle JOIN materiales`
 *             (inventario de materiales) en lugar de `proforma_items JOIN trabajos`
 *             (trabajos encargados por el cliente). Resultado: la factura mostraba
 *             materiales (vidrio, aluminio…) en vez de los trabajos (ventana, puerta…).
 *
 *   Bug F3 — `proforma_items` no tenía precio_unitario ni subtotal, por lo que no
 *             era posible facturar por ítem. Solución: migración sprint13 + guardar
 *             precios al calcular la proforma (ver proformaController).
 *
 *   Bug F4 — console.error → logger Winston (consistencia Sprint 11).
 *
 * FLUJO CORRECTO AHORA:
 *   pedidos.proforma_id
 *     → proformas (cliente, telefono, total)
 *       → proforma_items (trabajo_id, color_id, ancho, alto, cantidad, subtotal)
 *         → trabajos (nombre)
 *         → colores  (nombre)
 *           → factura_detalle (descripcion = "Trabajo — Color (AxH) × Cant")
 */

const db     = require('../config/database');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera la clave de acceso del comprobante (48 dígitos + verificador)
 * Formato SRI Ecuador: ddmmyyyy + tipoDoc + RUC + ambiente + serie + secuencia + codNumerico + tipoEmision
 */
const generarClaveAcceso = (datos) => {
  const {
    fecha,
    tipoComprobante  = '01',         // 01 = Factura
    ruc              = '9999999999001',
    ambiente         = '1',           // 1 = Pruebas, 2 = Producción
    serie            = '001001',
    numeroComprobante,
    codigoNumerico   = '00000001',
    tipoEmision      = '1'            // 1 = Normal
  } = datos;

  const fechaFormato = fecha.replace(/[^0-9]/g, '').slice(0, 8); // ddmmyyyy

  const claveSinVerificador =
    fechaFormato                                  +  // 8
    tipoComprobante                               +  // 2
    ruc                                           +  // 13
    ambiente                                      +  // 1
    serie                                         +  // 6
    numeroComprobante.padStart(9, '0')            +  // 9
    codigoNumerico                                +  // 8
    tipoEmision;                                     // 1  → total 48

  return claveSinVerificador + calcularModulo11(claveSinVerificador);
};

/** Módulo 11 — dígito verificador SRI */
const calcularModulo11 = (cadena) => {
  let suma   = 0;
  let factor = 2;
  for (let i = cadena.length - 1; i >= 0; i--) {
    suma  += parseInt(cadena[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const modulo = 11 - (suma % 11);
  if (modulo === 11) return '0';
  if (modulo === 10) return '1';
  return modulo.toString();
};

/** Formatea número de factura: 001-001-000000001 */
const formatearNumeroFactura = (establecimiento, puntoEmision, secuencia) =>
  `${establecimiento.padStart(3, '0')}-${puntoEmision.padStart(3, '0')}-${secuencia.toString().padStart(9, '0')}`;

/** Obtiene tasa IVA desde configuración (default 15%) */
const obtenerPorcentajeIVA = async () => {
  try {
    const [rows] = await db.query(
      "SELECT valor FROM configuracion WHERE clave = 'IVA' LIMIT 1"
    );
    return rows.length > 0 ? parseFloat(rows[0].valor) : 0.15;
  } catch (error) {
    // Sprint 11: logger en vez de console.error
    logger.warn('IVA_CONFIG_FALLBACK', {
      event:   'facturacion.iva_fallback',
      message: error.message
    });
    return 0.15;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SECUENCIAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene y reserva la siguiente secuencia de factura (transacción atómica con FOR UPDATE)
 */
const obtenerSiguienteSecuencia = async (
  tipoComprobante = 'FACTURA',
  establecimiento = '001',
  puntoEmision    = '001'
) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, secuencia_actual
       FROM secuencias_comprobantes
       WHERE tipo_comprobante = ?
         AND establecimiento  = ?
         AND punto_emision    = ?
         AND activo = 1
       FOR UPDATE`,
      [tipoComprobante, establecimiento, puntoEmision]
    );

    if (rows.length === 0)
      throw new Error(`No existe secuencia activa para ${tipoComprobante} ${establecimiento}-${puntoEmision}`);

    const secuenciaActual = rows[0].secuencia_actual + 1;

    await connection.query(
      'UPDATE secuencias_comprobantes SET secuencia_actual = ? WHERE id = ?',
      [secuenciaActual, rows[0].id]
    );

    await connection.commit();

    return {
      secuencia:        secuenciaActual,
      numeroFormateado: formatearNumeroFactura(establecimiento, puntoEmision, secuenciaActual)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CREAR FACTURA DESDE PEDIDO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea una factura electrónica a partir de un pedido ENTREGADO.
 *
 * FLUJO:
 *   1. Pedido → proforma_id → proformas (cliente, telefono)
 *   2. proforma_items JOIN trabajos JOIN colores → líneas de factura
 *   3. Calcula subtotales con IVA
 *   4. Inserta facturas + factura_detalle en transacción
 *
 * @param {number} pedidoId
 * @param {number} usuarioId
 * @param {Object} datosAdicionales  — datos opcionales del cliente (sobreescriben los de proforma)
 */
const crearFacturaDesdePedido = async (pedidoId, usuarioId, datosAdicionales = {}) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // ── 1. Pedido + Proforma (cliente vive en proformas, no en clientes) ──────
    // FIX Bug F1: eliminado LEFT JOIN clientes (tabla inexistente).
    // El cliente y teléfono vienen de proformas.cliente / proformas.telefono.
    const [pedidos] = await connection.query(
      `SELECT p.id,
              p.estado,
              p.total            AS pedido_total,
              p.proforma_id,
              p.observaciones,
              pr.cliente         AS cliente_nombre,
              pr.telefono        AS cliente_telefono,
              pr.usuario_id      AS proforma_usuario_id
       FROM pedidos p
       INNER JOIN proformas pr ON pr.id = p.proforma_id
       WHERE p.id = ?
         AND p.deleted_at IS NULL`,
      [pedidoId]
    );

    if (pedidos.length === 0)
      throw new Error('Pedido no encontrado');

    const pedido = pedidos[0];

    if (!pedido.proforma_id)
      throw new Error('El pedido no tiene proforma asociada. Usa factura manual para este caso.');

    // Solo facturar pedidos entregados
    if (pedido.estado !== 'ENTREGADO')
      throw new Error(`El pedido debe estar en estado ENTREGADO para facturar. Estado actual: ${pedido.estado}`);

    // ── 2. Items desde proforma_items JOIN trabajos + colores ─────────────────
    // FIX Bug F2: reemplazado pedido_detalle JOIN materiales por
    // proforma_items JOIN trabajos JOIN colores.
    const [items] = await connection.query(
      `SELECT pi.id,
              pi.trabajo_id,
              pi.color_id,
              pi.ancho,
              pi.alto,
              pi.cantidad,
              pi.detalle,
              pi.precio_unitario,   -- Sprint 13: nuevo campo (migración)
              pi.subtotal,          -- Sprint 13: nuevo campo (migración)
              t.nombre  AS trabajo_nombre,
              c.nombre  AS color_nombre
       FROM proforma_items pi
       INNER JOIN trabajos t ON t.id = pi.trabajo_id
       LEFT  JOIN colores  c ON c.id = pi.color_id
       WHERE pi.proforma_id = ?
       ORDER BY pi.id`,
      [pedido.proforma_id]
    );

    if (items.length === 0)
      throw new Error('La proforma asociada no tiene trabajos registrados');

    // ── 3. Secuencia y clave de acceso ────────────────────────────────────────
    const { secuencia, numeroFormateado } = await obtenerSiguienteSecuencia('FACTURA', '001', '001');

    const fechaEmision = new Date().toISOString().split('T')[0];
    const claveAcceso  = generarClaveAcceso({
      fecha:             fechaEmision.replace(/-/g, ''),
      tipoComprobante:   '01',
      serie:             '001001',
      numeroComprobante: secuencia.toString(),
      ambiente:          process.env.SRI_AMBIENTE || '1'
    });

    // ── 4. Calcular totales con IVA ───────────────────────────────────────────
    const porcentajeIVA = await obtenerPorcentajeIVA();

    let subtotalConIVA = 0;
    let totalIVA       = 0;

    const detalleCalculado = items.map(item => {
      // Si el subtotal ya viene guardado (post-migración) lo usamos directamente.
      // Si es 0 (pre-migración o dato antiguo) usamos pedido_total / n_items como fallback.
      const subtotalItem = parseFloat(item.subtotal) > 0
        ? parseFloat(item.subtotal)
        : parseFloat(pedido.pedido_total) / items.length;

      const ivaItem = parseFloat((subtotalItem * porcentajeIVA).toFixed(2));

      subtotalConIVA += subtotalItem;
      totalIVA       += ivaItem;

      // Descripción legible para el RIDE:
      // "Ventana Corredera — Bronce (1.20×1.50m) ×2 · Detalle personalizado"
      const medidas = `${parseFloat(item.ancho).toFixed(2)}×${parseFloat(item.alto).toFixed(2)}m`;
      let descripcion = `${item.trabajo_nombre}`;
      if (item.color_nombre)  descripcion += ` — ${item.color_nombre}`;
      descripcion += ` (${medidas}) ×${item.cantidad}`;
      if (item.detalle?.trim()) descripcion += ` · ${item.detalle.trim()}`;

      return {
        descripcion:          descripcion.slice(0, 300), // límite SRI
        cantidad:             parseFloat(item.cantidad),
        precio_unitario:      parseFloat(item.precio_unitario) || 0,
        subtotal:             subtotalItem,
        porcentaje_iva:       porcentajeIVA * 100,
        valor_iva:            ivaItem,
        // trabajo_id para referencia interna (factura_detalle.material_id queda NULL)
        trabajo_id:           item.trabajo_id
      };
    });

    const total = parseFloat((subtotalConIVA + totalIVA).toFixed(2));

    // ── 5. Insertar factura ───────────────────────────────────────────────────
    const clienteNombre = datosAdicionales.clienteNombre
      || pedido.cliente_nombre
      || 'CONSUMIDOR FINAL';

    const [resultFactura] = await connection.query(
      `INSERT INTO facturas (
        numero_factura,
        clave_acceso,
        pedido_id,
        usuario_id,
        cliente_tipo_identificacion,
        cliente_nombre,
        cliente_identificacion,
        cliente_direccion,
        cliente_telefono,
        cliente_email,
        fecha_emision,
        subtotal_sin_iva,
        subtotal_con_iva,
        iva,
        descuento,
        propina,
        total,
        estado,
        estado_sri,
        observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EMITIDA', 'SIN_ENVIAR', ?)`,
      [
        numeroFormateado,
        claveAcceso,
        pedidoId,
        usuarioId,
        datosAdicionales.tipoIdentificacion   || 'CONSUMIDOR_FINAL',
        clienteNombre,
        datosAdicionales.clienteIdentificacion || null,
        datosAdicionales.clienteDireccion      || null,
        datosAdicionales.clienteTelefono       || pedido.cliente_telefono || null,
        datosAdicionales.clienteEmail          || null,
        fechaEmision,
        '0.00',                                           // subtotal_sin_iva (trabajos gravan IVA)
        subtotalConIVA.toFixed(2),
        totalIVA.toFixed(2),
        '0.00',
        '0.00',
        total,
        datosAdicionales.observaciones || pedido.observaciones || null
      ]
    );

    const facturaId = resultFactura.insertId;

    // ── 6. Insertar detalle de factura ────────────────────────────────────────
    // FIX Bug F2: material_id = NULL (los trabajos no son materiales de inventario)
    for (const item of detalleCalculado) {
      await connection.query(
        `INSERT INTO factura_detalle (
          factura_id,
          material_id,
          descripcion,
          cantidad,
          precio_unitario,
          descuento,
          precio_total_sin_iva,
          porcentaje_iva,
          valor_iva
        ) VALUES (?, NULL, ?, ?, ?, 0.00, ?, ?, ?)`,
        [
          facturaId,
          item.descripcion,
          item.cantidad,
          item.precio_unitario.toFixed(4),
          item.subtotal.toFixed(2),
          item.porcentaje_iva.toFixed(2),
          item.valor_iva.toFixed(2)
        ]
      );
    }

    await connection.commit();

    logger.info('FACTURA_CREADA_DESDE_PEDIDO', {
      event:         'facturacion.creada_desde_pedido',
      facturaId,
      numeroFactura: numeroFormateado,
      pedidoId,
      proformaId:    pedido.proforma_id,
      cliente:       clienteNombre,
      total,
      userId:        usuarioId
    });

    return await obtenerFacturaPorId(facturaId);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBTENER FACTURA POR ID
// ═══════════════════════════════════════════════════════════════════════════

const obtenerFacturaPorId = async (facturaId) => {
  const [facturas] = await db.query(
    `SELECT f.*,
            u.nombre AS vendedor_nombre
     FROM facturas f
     LEFT JOIN usuarios u ON u.id = f.usuario_id
     WHERE f.id = ?`,
    [facturaId]
  );

  if (facturas.length === 0)
    throw new Error('Factura no encontrada');

  const [detalle] = await db.query(
    'SELECT * FROM factura_detalle WHERE factura_id = ? ORDER BY id',
    [facturaId]
  );

  return { ...facturas[0], detalle };
};

// ═══════════════════════════════════════════════════════════════════════════
// LISTAR FACTURAS
// ═══════════════════════════════════════════════════════════════════════════

const listarFacturas = async (filtros = {}) => {
  const where  = ['1=1'];
  const params = [];

  if (filtros.fechaDesde)    { where.push('f.fecha_emision >= ?');        params.push(filtros.fechaDesde); }
  if (filtros.fechaHasta)    { where.push('f.fecha_emision <= ?');        params.push(filtros.fechaHasta); }
  if (filtros.estado)        { where.push('f.estado = ?');                params.push(filtros.estado); }
  if (filtros.estadoSRI)     { where.push('f.estado_sri = ?');            params.push(filtros.estadoSRI); }
  if (filtros.numeroFactura) { where.push('f.numero_factura LIKE ?');     params.push(`%${filtros.numeroFactura}%`); }
  if (filtros.clienteNombre) { where.push('f.cliente_nombre LIKE ?');     params.push(`%${filtros.clienteNombre}%`); }
  if (filtros.pedidoId)      { where.push('f.pedido_id = ?');             params.push(filtros.pedidoId); }

  const limit  = filtros.limite  || 50;
  const offset = filtros.offset  || 0;

  params.push(limit, offset);

  const [facturas] = await db.query(
    `SELECT f.*,
            u.nombre          AS vendedor_nombre,
            COUNT(fd.id)      AS total_items
     FROM facturas f
     LEFT JOIN usuarios       u  ON u.id  = f.usuario_id
     LEFT JOIN factura_detalle fd ON fd.factura_id = f.id
     WHERE ${where.join(' AND ')}
     GROUP BY f.id
     ORDER BY f.fecha_emision DESC, f.id DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return facturas;
};

// ═══════════════════════════════════════════════════════════════════════════
// ANULAR FACTURA
// ═══════════════════════════════════════════════════════════════════════════

const anularFactura = async (facturaId, usuarioId, motivo) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [facturas] = await connection.query(
      'SELECT estado FROM facturas WHERE id = ?',
      [facturaId]
    );

    if (facturas.length === 0)        throw new Error('Factura no encontrada');
    if (facturas[0].estado === 'ANULADA') throw new Error('La factura ya está anulada');

    await connection.query(
      `UPDATE facturas
       SET estado          = 'ANULADA',
           estado_sri      = 'SIN_ENVIAR',
           anulada_at      = NOW(),
           anulada_por     = ?,
           motivo_anulacion = ?
       WHERE id = ?`,
      [usuarioId, motivo, facturaId]
    );

    await connection.commit();

    logger.info('FACTURA_ANULADA', {
      event:     'facturacion.anulada',
      facturaId,
      motivo,
      userId:    usuarioId
    });

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════════════════

const obtenerEstadisticas = async (filtros = {}) => {
  const fechaDesde = filtros.fechaDesde || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const fechaHasta = filtros.fechaHasta || new Date().toISOString().split('T')[0];

  const [stats] = await db.query(
    `SELECT
       COUNT(*)                                                              AS total_facturas,
       SUM(CASE WHEN estado IN ('EMITIDA','AUTORIZADA') THEN 1 ELSE 0 END)  AS facturas_vigentes,
       SUM(CASE WHEN estado = 'ANULADA' THEN 1 ELSE 0 END)                 AS facturas_anuladas,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN total ELSE 0   END), 0) AS monto_total_facturado,
       COALESCE(AVG(CASE WHEN estado != 'ANULADA' THEN total ELSE NULL END), 0) AS ticket_promedio
     FROM facturas
     WHERE fecha_emision BETWEEN ? AND ?`,
    [fechaDesde, fechaHasta]
  );

  return stats[0];
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  generarClaveAcceso,
  formatearNumeroFactura,
  obtenerPorcentajeIVA,
  obtenerSiguienteSecuencia,
  crearFacturaDesdePedido,
  obtenerFacturaPorId,
  listarFacturas,
  anularFactura,
  obtenerEstadisticas
};