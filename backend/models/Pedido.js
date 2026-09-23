// backend/models/Pedido.js
// 🏢 Sprint 19 — Multi-empresa: empresa_id en todos los INSERT/SELECT/UPDATE

const db = require('../config/database');

class Pedido {

  static async create(pedidoData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Sprint 19: empresa_id obligatorio
      const pedidoSql = `
        INSERT INTO pedidos (empresa_id, fecha, estado, total, observaciones, proforma_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [pedidoResult] = await connection.execute(pedidoSql, [
        pedidoData.empresa_id,                 // ← Sprint 19
        pedidoData.fecha         || new Date(),
        pedidoData.estado        || 'PENDIENTE',
        pedidoData.total         || 0,
        pedidoData.observaciones || null,
        pedidoData.proforma_id   || null,
      ]);

      const pedidoId = pedidoResult.insertId;
      let total = 0;

      // ── SI VIENE DESDE PROFORMA ─────────────────────────────────────────
      if (pedidoData.proforma_id) {

        // Verificar que la proforma pertenece a la misma empresa
        const [proformaCheck] = await connection.execute(
          'SELECT id FROM proformas WHERE id = ? AND empresa_id = ?',
          [pedidoData.proforma_id, pedidoData.empresa_id]
        );

        if (!proformaCheck.length) {
          throw new Error('Proforma no encontrada o no pertenece a esta empresa');
        }

        const [proformaItems] = await connection.execute(
          `SELECT material_id, cantidad, precio_unitario, detalle
           FROM proforma_items
           WHERE proforma_id = ?`,
          [pedidoData.proforma_id]
        );

        const detalleSql = `
          INSERT INTO pedido_detalle
          (pedido_id, material_id, cantidad, precio_unitario, detalle)
          VALUES (?, ?, ?, ?, ?)
        `;

        for (const item of proformaItems) {
          await connection.execute(detalleSql, [
            pedidoId,
            item.material_id,
            item.cantidad,
            item.precio_unitario,
            item.detalle || null,
          ]);

          total += item.cantidad * item.precio_unitario;

          // Solo descontar stock de materiales de la misma empresa
          await connection.execute(
            'UPDATE materiales SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
            [item.cantidad, item.material_id, pedidoData.empresa_id]
          );
        }
      }

      // ── SI VIENE MANUAL ─────────────────────────────────────────────────
      else if (pedidoData.detalles?.length) {

        const detalleSql = `
          INSERT INTO pedido_detalle
          (pedido_id, material_id, cantidad, precio_unitario, detalle)
          VALUES (?, ?, ?, ?, ?)
        `;

        for (const d of pedidoData.detalles) {
          await connection.execute(detalleSql, [
            pedidoId,
            d.material_id,
            d.cantidad,
            d.precio_unitario,
            d.detalle || null,
          ]);

          total += d.cantidad * d.precio_unitario;

          await connection.execute(
            'UPDATE materiales SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
            [d.cantidad, d.material_id, pedidoData.empresa_id]
          );
        }
      }

      await connection.execute(
        'UPDATE pedidos SET total = ? WHERE id = ?',
        [total, pedidoId]
      );

      await connection.commit();
      return await this.getById(pedidoId, pedidoData.empresa_id);

    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }

  // Sprint 19: empresa_id requerido para evitar fugas entre empresas
  static async getById(id, empresaId) {
    const [rows] = await db.query(
      `SELECT p.*, pd.detalle
       FROM pedidos p
       LEFT JOIN pedido_detalle pd ON pd.pedido_id = p.id
       WHERE p.id = ? AND p.empresa_id = ?`,
      [id, empresaId]
    );

    return rows.length ? rows : null;
  }

  static async delete(id, empresaId) {
    // Verificar que el pedido pertenece a la empresa antes de borrar
    await db.query(
      'DELETE FROM pedido_detalle WHERE pedido_id = ? AND EXISTS (SELECT 1 FROM pedidos WHERE id = ? AND empresa_id = ?)',
      [id, id, empresaId]
    );
    const [res] = await db.query(
      'DELETE FROM pedidos WHERE id = ? AND empresa_id = ?',
      [id, empresaId]
    );
    return res.affectedRows > 0;
  }

  static async cancelar(id, empresaId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar que el pedido existe y pertenece a la empresa
      const [pedidoRows] = await connection.execute(
        'SELECT estado FROM pedidos WHERE id = ? AND empresa_id = ?',
        [id, empresaId]
      );

      if (!pedidoRows.length) {
        throw new Error('Pedido no encontrado');
      }

      if (pedidoRows[0].estado === 'CANCELADO') {
        throw new Error('El pedido ya está cancelado');
      }

      // Restaurar stock — solo materiales de la misma empresa
      const [detalles] = await connection.execute(
        'SELECT material_id, cantidad FROM pedido_detalle WHERE pedido_id = ?',
        [id]
      );

      for (const d of detalles) {
        if (d.material_id && d.cantidad > 0) {
          await connection.execute(
            'UPDATE materiales SET stock = stock + ? WHERE id = ? AND empresa_id = ?',
            [d.cantidad, d.material_id, empresaId]
          );
        }
      }

      const [result] = await connection.execute(
        'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ? AND empresa_id = ?',
        ['CANCELADO', id, empresaId]
      );

      await connection.commit();
      return result.affectedRows > 0;

    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }
}

module.exports = Pedido;