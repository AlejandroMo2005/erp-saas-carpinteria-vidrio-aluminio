// backend/models/Proforma.js
const db = require('../config/database');

class Proforma {
  /**
   * Obtener todas las proformas
   */
  static async getAll() {
    const sql = `
      SELECT id, fecha, cliente, total, created_at, updated_at
      FROM proformas
      ORDER BY created_at DESC
    `;
    return await db.query(sql);
  }

  /**
   * Obtener una proforma por ID con sus detalles
   */
  static async getById(id) {
    const proformaSql = `
      SELECT id, fecha, cliente, total, created_at, updated_at
      FROM proformas
      WHERE id = ?
    `;
    const detalleSql = `
      SELECT 
        pd.id,
        pd.material_id,
        m.nombre as material_nombre,
        pd.cantidad,
        pd.precio_unitario,
        (pd.cantidad * pd.precio_unitario) as subtotal
      FROM proforma_detalle pd
      INNER JOIN materiales m ON pd.material_id = m.id
      WHERE pd.proforma_id = ?
    `;
    
    const [proformas] = await db.query(proformaSql, [id]);
    if (!proformas) return null;
    
    const detalles = await db.query(detalleSql, [id]);
    
    return {
      ...proformas,
      detalles
    };
  }

  /**
   * Crear una nueva proforma con sus detalles
   */
  static async create(proformaData) {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insertar proforma
      const proformaSql = `
        INSERT INTO proformas (fecha, cliente, total)
        VALUES (?, ?, ?)
      `;
      const [proformaResult] = await connection.execute(proformaSql, [
        proformaData.fecha || new Date(),
        proformaData.cliente,
        proformaData.total || 0
      ]);
      
      const proformaId = proformaResult.insertId;
      
      // Insertar detalles de la proforma
      if (proformaData.detalles && proformaData.detalles.length > 0) {
        const detalleSql = `
          INSERT INTO proforma_detalle (proforma_id, material_id, cantidad, precio_unitario)
          VALUES (?, ?, ?, ?)
        `;
        
        let total = 0;
        for (const detalle of proformaData.detalles) {
          await connection.execute(detalleSql, [
            proformaId,
            detalle.material_id,
            detalle.cantidad,
            detalle.precio_unitario
          ]);
          
          total += detalle.cantidad * detalle.precio_unitario;
        }
        
        // Actualizar total de la proforma
        await connection.execute(
          'UPDATE proformas SET total = ? WHERE id = ?',
          [total, proformaId]
        );
      }
      
      await connection.commit();
      return await this.getById(proformaId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una proforma
   */
  static async delete(id) {
    const sql = `DELETE FROM proformas WHERE id = ?`;
    await db.query(sql, [id]);
    return true;
  }

  /**
   * Buscar proformas por cliente
   */
  static async searchByCliente(cliente) {
    const sql = `
      SELECT id, fecha, cliente, total, created_at, updated_at
      FROM proformas
      WHERE cliente LIKE ?
      ORDER BY created_at DESC
    `;
    return await db.query(sql, [`%${cliente}%`]);
  }
}

module.exports = Proforma;