/* Servicio para recargas de insumos */

exports.saveSupplyRecharge = async (pool, { fecha, insumo, cantidad, unidad, costo, proveedor, notas }) => {
  try {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO praessia.recargainsumos (fecha, insumo, cantidad, tipoDato, costo, proveedor, notas, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await connection.execute(query, [
        fecha,
        insumo,
        cantidad,
        unidad,
        costo || 0,
        proveedor,
        notas || ''
      ]);
      return { id: result.insertId, success: true };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error al guardar recarga en servicio:', error);
    throw error;
  }
};

exports.getSupplyRecharge = async (pool) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM praessia.recargainsumos ORDER BY created_at DESC LIMIT 100'
      );
      return rows;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener recargas en servicio:', error);
    throw error;
  }
};

exports.getSuppliers = async (pool) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, proveedor FROM praessia.proveedores WHERE estado = 1 ORDER BY proveedor ASC'
      );
      return rows;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener proveedores en servicio:', error);
    throw error;
  }
};

exports.getFragrance = async (pool) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, insumo FROM praessia.inventario WHERE estado = 1 ORDER BY insumo ASC'
      );
      return rows;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener fragancias en servicio:', error);
    throw error;
  }
};