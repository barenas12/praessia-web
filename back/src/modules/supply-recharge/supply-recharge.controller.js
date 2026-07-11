/* Controlador para las recargas de insumos */

exports.saveSupplyRecharge = async (req, res) => {
  try {
    const { fecha, insumo, cantidad, unidad, costo, proveedor, notas } = req.body;

    /* Validación básica */
    if (!fecha || !insumo || !cantidad || !unidad || !proveedor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: fecha, insumo, cantidad, unidad, proveedor'
      });
    }

    /* Obtener pool de conexiones desde app */
    const pool = req.app.locals.pool;
    const connection = await pool.getConnection();

    try {
      /* Insertar en base de datos */
      const query = `
        INSERT INTO recargainsumos (fecha, insumo, cantidad, tipoDato, costo, proveedor, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?)
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

      console.log('[Recarga guardada] ID:', result.insertId, 'Insumo:', insumo);

      res.status(201).json({
        success: true,
        message: 'Recarga guardada correctamente',
        id: result.insertId
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al guardar recarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la recarga',
      error: error.message
    });
  }
};

exports.getSupplyRecharge = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM recargainsumos ORDER BY created_at DESC LIMIT 100'
      );

      res.json({
        success: true,
        data: rows,
        count: rows.length
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al obtener recargas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las recargas',
      error: error.message
    });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        'SELECT id, proveedor FROM proveedores WHERE estado = 1 ORDER BY proveedor ASC'
      );

      res.json({
        success: true,
        data: rows,
        count: rows.length
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los proveedores',
      error: error.message
    });
  }
};

exports.getFragrances = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, insumo FROM inventario WHERE estado = 1 ORDER BY insumo ASC'
      );
        res.json({
        success: true,
        data: rows,
        count: rows.length
        });
    } finally {
        connection.release();
    }
    } catch (error) {
    console.error('❌ Error al obtener fragancias:', error);
    res.status(500).json({
        success: false,
        message: 'Error al obtener las fragancias',
        error: error.message
    });
  }
}