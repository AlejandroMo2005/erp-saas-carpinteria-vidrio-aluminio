// src/modules/comercial/facturacion/facturacion.repository.js
// 📦 Sprint 20 — Movido de models/Facturacion.js
'use strict';

const db = require('../../../config/database.js');

// Construye los filtros compartidos por las consultas de facturas.
const construirFiltrosFactura = (filtros = {}, prefijo = '') => {
  const {
    fechaDesde,
    fechaHasta,
    estado,
    estadoSRI,
    clienteNombre,
    numeroFactura,
    pedidoId,
    empresaId,
  } = filtros;

  const where = ['1=1'];
  const params = [];
  const columna = (campo) => `${prefijo}${campo}`;

  if (empresaId) {
    where.push(`${columna('empresa_id')} = ?`);
    params.push(empresaId);
  }
  if (pedidoId) {
    where.push(`${columna('pedido_id')} = ?`);
    params.push(pedidoId);
  }
  if (fechaDesde) {
    where.push(`${columna('fecha_emision')} >= ?`);
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    where.push(`${columna('fecha_emision')} <= ?`);
    params.push(fechaHasta);
  }
  if (estado) {
    where.push(`${columna('estado')} = ?`);
    params.push(estado);
  }
  if (estadoSRI) {
    where.push(`${columna('estado_sri')} = ?`);
    params.push(estadoSRI);
  }
  if (clienteNombre) {
    where.push(`${columna('cliente_nombre')} LIKE ?`);
    params.push(`%${clienteNombre}%`);
  }
  if (numeroFactura) {
    where.push(`${columna('numero_factura')} LIKE ?`);
    params.push(`%${numeroFactura}%`);
  }

  return { where, params };
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTURAS — LECTURA
// ═══════════════════════════════════════════════════════════════════════════

const obtenerFacturas = async (filtros = {}, paginacion = {}) => {
  const { limite = 50, offset = 0 } = paginacion;

  // Sprint 19: filtro de empresa SIEMPRE presente si se proporciona
  const { where, params } = construirFiltrosFactura(filtros, 'f.');

  const sql = `
    SELECT
      f.id,
      f.numero_factura,
      f.clave_acceso,
      f.fecha_emision,
      f.fecha_autorizacion,
      f.cliente_nombre,
      f.cliente_identificacion,
      f.cliente_tipo_identificacion,
      f.cliente_telefono,
      f.cliente_email,
      f.subtotal_sin_iva,
      f.subtotal_con_iva,
      f.iva,
      f.descuento,
      f.total,
      f.estado,
      f.estado_sri,
      f.pedido_id,
      f.observaciones,
      f.created_at,
      u.nombre AS vendedor_nombre,
      p.fecha  AS pedido_fecha,
      COUNT(fd.id) AS total_items
    FROM facturas f
    LEFT JOIN usuarios        u  ON f.usuario_id  = u.id
    LEFT JOIN pedidos         p  ON f.pedido_id   = p.id
    LEFT JOIN factura_detalle fd ON f.id           = fd.factura_id
    WHERE ${where.join(' AND ')}
    GROUP BY f.id
    ORDER BY f.fecha_emision DESC, f.id DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limite, offset);
  return db.query(sql, params);
};

const contarFacturas = async (filtros = {}) => {
  const { where, params } = construirFiltrosFactura(filtros);

  return db.query(
    `SELECT COUNT(*) AS total FROM facturas WHERE ${where.join(' AND ')}`,
    params
  );
};

// Sprint 19: acepta empresaId como segundo parámetro
const obtenerFacturaPorId = async (id, empresaId = null) => {
  const whereExtra = empresaId ? 'AND f.empresa_id = ?' : '';
  const params     = empresaId ? [id, empresaId] : [id];

  const [rows] = await db.query(
    `SELECT
       f.*,
       u.nombre AS usuario_nombre,
       u.email  AS usuario_email,
       p.fecha  AS pedido_fecha,
       p.estado AS pedido_estado,
       anu.nombre AS anulada_por_nombre
     FROM facturas f
     LEFT JOIN usuarios u   ON f.usuario_id  = u.id
     LEFT JOIN pedidos  p   ON f.pedido_id   = p.id
     LEFT JOIN usuarios anu ON f.anulada_por = anu.id
     WHERE f.id = ? ${whereExtra}`,
    params
  );

  if (!rows || rows.length === 0) return null;

  const [detalle] = await db.query(
    `SELECT
       fd.*,
       m.nombre      AS material_nombre,
       m.descripcion AS material_descripcion
     FROM factura_detalle fd
     LEFT JOIN materiales m ON fd.material_id = m.id
     WHERE fd.factura_id = ?
     ORDER BY fd.id`,
    [id]
  );

  return { ...rows[0], detalle: detalle ?? [] };
};

const obtenerFacturaPorNumero = async (numeroFactura) => {
  return db.query('SELECT * FROM facturas WHERE numero_factura = ?', [numeroFactura]);
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTURAS — ESCRITURA
// ═══════════════════════════════════════════════════════════════════════════

const crearFactura = async (datos) => {
  return db.query(
    `INSERT INTO facturas (
       empresa_id,
       numero_factura, clave_acceso,
       pedido_id, cliente_id, usuario_id,
       cliente_identificacion, cliente_tipo_identificacion,
       cliente_nombre, cliente_direccion, cliente_telefono, cliente_email,
       fecha_emision,
       subtotal_sin_iva, subtotal_con_iva, iva, descuento, propina, total,
       estado, estado_sri, observaciones, datos_adicionales
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      datos.empresa_id,
      datos.numero_factura,
      datos.clave_acceso,
      datos.pedido_id,
      datos.cliente_id,
      datos.usuario_id,
      datos.cliente_identificacion,
      datos.cliente_tipo_identificacion,
      datos.cliente_nombre,
      datos.cliente_direccion,
      datos.cliente_telefono,
      datos.cliente_email,
      datos.fecha_emision,
      datos.subtotal_sin_iva,
      datos.subtotal_con_iva,
      datos.iva,
      datos.descuento  ?? 0,
      datos.propina    ?? 0,
      datos.total,
      datos.estado     ?? 'BORRADOR',
      datos.estado_sri ?? 'SIN_ENVIAR',
      datos.observaciones,
      datos.datos_adicionales ? JSON.stringify(datos.datos_adicionales) : null,
    ]
  );
};

/**
 * Crea factura + detalle en una sola transacción (Sprint 5).
 * Usado por crearFacturaManual.
 */
const crearFacturaConDetalle = async (datosFact, items) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO facturas (
         empresa_id,
         numero_factura, clave_acceso,
         pedido_id, cliente_id, usuario_id,
         cliente_identificacion, cliente_tipo_identificacion,
         cliente_nombre, cliente_direccion, cliente_telefono, cliente_email,
         fecha_emision,
         subtotal_sin_iva, subtotal_con_iva, iva, descuento, propina, total,
         estado, estado_sri, observaciones
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        datosFact.empresa_id,
        datosFact.numero_factura,
        datosFact.clave_acceso      ?? null,
        datosFact.pedido_id         ?? null,
        datosFact.cliente_id        ?? null,
        datosFact.usuario_id,
        datosFact.cliente_identificacion      ?? null,
        datosFact.cliente_tipo_identificacion ?? 'CONSUMIDOR_FINAL',
        datosFact.cliente_nombre,
        datosFact.cliente_direccion ?? null,
        datosFact.cliente_telefono  ?? null,
        datosFact.cliente_email     ?? null,
        datosFact.fecha_emision,
        datosFact.subtotal_sin_iva,
        datosFact.subtotal_con_iva,
        datosFact.iva,
        datosFact.descuento         ?? 0,
        datosFact.propina           ?? 0,
        datosFact.total,
        datosFact.estado            ?? 'EMITIDA',
        datosFact.estado_sri        ?? 'SIN_ENVIAR',
        datosFact.observaciones     ?? null,
      ]
    );

    const facturaId = result.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO factura_detalle (
           factura_id, material_id,
           codigo_principal, codigo_auxiliar,
           descripcion, cantidad, precio_unitario,
           descuento, precio_total_sin_iva,
           porcentaje_iva, valor_iva, detalles_adicionales
         ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          facturaId,
          item.material_id          ?? null,
          item.codigo_principal     ?? null,
          item.codigo_auxiliar      ?? null,
          item.descripcion,
          item.cantidad,
          item.precio_unitario,
          item.descuento            ?? 0,
          item.precio_total_sin_iva,
          item.porcentaje_iva       ?? 0,
          item.valor_iva            ?? 0,
          item.detalles_adicionales ? JSON.stringify(item.detalles_adicionales) : null,
        ]
      );
    }

    await conn.commit();
    return facturaId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Sprint 19: empresa_id en el WHERE
const actualizarFactura = async (id, datos, empresaId = null) => {
  const campos  = [];
  const valores = [];

  const mapeables = [
    'estado', 'estado_sri', 'fecha_autorizacion',
    'xml_firmado', 'xml_autorizado', 'mensaje_sri', 'observaciones',
  ];

  for (const campo of mapeables) {
    if (datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(datos[campo]);
    }
  }

  if (campos.length === 0) throw new Error('No hay campos para actualizar');

  if (empresaId) {
    valores.push(id, empresaId);
    return db.query(
      `UPDATE facturas SET ${campos.join(', ')} WHERE id = ? AND empresa_id = ?`,
      valores
    );
  } else {
    valores.push(id);
    return db.query(`UPDATE facturas SET ${campos.join(', ')} WHERE id = ?`, valores);
  }
};

// Sprint 19: empresa_id en el WHERE
const anularFactura = async (id, usuarioId, motivo, empresaId = null) => {
  const whereExtra = empresaId ? 'AND empresa_id = ?' : '';
  const params     = empresaId
    ? [usuarioId, motivo, id, empresaId]
    : [usuarioId, motivo, id];

  return db.query(
    `UPDATE facturas
     SET estado           = 'ANULADA',
         estado_sri       = 'SIN_ENVIAR',
         anulada_at       = NOW(),
         anulada_por      = ?,
         motivo_anulacion = ?
     WHERE id = ? ${whereExtra}`,
    params
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DETALLE
// ═══════════════════════════════════════════════════════════════════════════

const crearDetalleFactura = async (datos) => {
  return db.query(
    `INSERT INTO factura_detalle (
       factura_id, material_id,
       codigo_principal, codigo_auxiliar,
       descripcion, cantidad, precio_unitario,
       descuento, precio_total_sin_iva,
       porcentaje_iva, valor_iva, detalles_adicionales
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      datos.factura_id,
      datos.material_id         ?? null,
      datos.codigo_principal    ?? null,
      datos.codigo_auxiliar     ?? null,
      datos.descripcion,
      datos.cantidad,
      datos.precio_unitario,
      datos.descuento           ?? 0,
      datos.precio_total_sin_iva,
      datos.porcentaje_iva,
      datos.valor_iva,
      datos.detalles_adicionales ? JSON.stringify(datos.detalles_adicionales) : null,
    ]
  );
};

const obtenerDetalleFactura = async (facturaId) => {
  return db.query(
    `SELECT fd.*, m.nombre AS material_nombre, m.descripcion AS material_descripcion
     FROM factura_detalle fd
     LEFT JOIN materiales m ON fd.material_id = m.id
     WHERE fd.factura_id = ?
     ORDER BY fd.id`,
    [facturaId]
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS — Sprint 19: empresa_id añadido a todas las queries
// ═══════════════════════════════════════════════════════════════════════════

const obtenerResumenFacturacion = async (fechaDesde, fechaHasta, empresaId = null) => {
  const whereEmpresa = empresaId ? 'AND empresa_id = ?' : '';
  const params       = empresaId
    ? [fechaDesde, fechaHasta, empresaId]
    : [fechaDesde, fechaHasta];

  return db.query(
    `SELECT
       COUNT(*)                                                                      AS total_facturas,
       SUM(CASE WHEN estado != 'ANULADA' THEN 1    ELSE 0 END)                      AS facturas_vigentes,
       SUM(CASE WHEN estado  = 'ANULADA' THEN 1    ELSE 0 END)                      AS facturas_anuladas,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN total            ELSE 0    END), 0) AS total_facturado,
       COALESCE(AVG(CASE WHEN estado != 'ANULADA' THEN total            ELSE NULL END), 0) AS ticket_promedio,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN subtotal_sin_iva ELSE 0    END), 0) AS subtotal_sin_iva,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN subtotal_con_iva ELSE 0    END), 0) AS subtotal_con_iva,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN iva              ELSE 0    END), 0) AS total_iva,
       COUNT(DISTINCT CASE WHEN estado != 'ANULADA' THEN cliente_nombre END)               AS clientes_unicos
     FROM facturas
     WHERE fecha_emision BETWEEN ? AND ? ${whereEmpresa}`,
    params
  );
};

const obtenerResumenMesAnterior = async (empresaId = null) => {
  const whereEmpresa = empresaId ? 'AND empresa_id = ?' : '';
  const params       = empresaId ? [empresaId] : [];

  return db.query(
    `SELECT
       COUNT(*)                                                               AS total_facturas,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN total ELSE 0 END), 0) AS total_facturado
     FROM facturas
     WHERE fecha_emision >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
       AND fecha_emision <  DATE_FORMAT(NOW(), '%Y-%m-01')
       ${whereEmpresa}`,
    params
  );
};

const obtenerFacturacionMensual = async (fechaDesde, fechaHasta, empresaId = null) => {
  const whereEmpresa = empresaId ? 'AND empresa_id = ?' : '';
  const params       = empresaId
    ? [fechaDesde, fechaHasta, empresaId]
    : [fechaDesde, fechaHasta];

  return db.query(
    `SELECT
       DATE_FORMAT(fecha_emision, '%Y-%m') AS mes,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN total ELSE 0 END), 0) AS total,
       COUNT(CASE WHEN estado != 'ANULADA' THEN 1 END)                       AS cantidad
     FROM facturas
     WHERE fecha_emision BETWEEN ? AND ? ${whereEmpresa}
     GROUP BY DATE_FORMAT(fecha_emision, '%Y-%m')
     ORDER BY mes ASC`,
    params
  );
};

const obtenerFacturasPorEstado = async (fechaDesde, fechaHasta, empresaId = null) => {
  const whereEmpresa = empresaId ? 'AND empresa_id = ?' : '';
  const params       = empresaId
    ? [fechaDesde, fechaHasta, empresaId]
    : [fechaDesde, fechaHasta];

  return db.query(
    `SELECT
       estado,
       COUNT(*)                AS cantidad,
       COALESCE(SUM(total), 0) AS total
     FROM facturas
     WHERE fecha_emision BETWEEN ? AND ? ${whereEmpresa}
     GROUP BY estado
     ORDER BY cantidad DESC`,
    params
  );
};

const obtenerTopClientes = async (fechaDesde, fechaHasta, limite = 10, empresaId = null) => {
  const whereEmpresa = empresaId ? 'AND empresa_id = ?' : '';
  const params       = empresaId
    ? [fechaDesde, fechaHasta, empresaId, limite]
    : [fechaDesde, fechaHasta, limite];

  return db.query(
    `SELECT
       cliente_nombre,
       cliente_identificacion,
       COUNT(*)                                                                       AS total_facturas,
       COALESCE(SUM(CASE WHEN estado != 'ANULADA' THEN total ELSE 0 END), 0)         AS total
     FROM facturas
     WHERE fecha_emision BETWEEN ? AND ? ${whereEmpresa}
     GROUP BY cliente_nombre, cliente_identificacion
     ORDER BY total DESC
     LIMIT ?`,
    params
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Lectura
  obtenerFacturas,
  contarFacturas,
  obtenerFacturaPorId,
  obtenerFacturaPorNumero,
  // Escritura
  crearFactura,
  crearFacturaConDetalle,
  actualizarFactura,
  anularFactura,
  // Detalle
  crearDetalleFactura,
  obtenerDetalleFactura,
  // Estadísticas
  obtenerResumenFacturacion,
  obtenerResumenMesAnterior,
  obtenerFacturacionMensual,
  obtenerFacturasPorEstado,
  obtenerTopClientes,
};