exports.findPersonaByDocumento = async (pool, documento) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM praessia.persona WHERE documento = ? LIMIT 1',
      [documento]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

const buildPersonaFields = (persona) => ({
  tipoDocumento: persona.tipoDocumento || persona.tipo_doc || '',
  nombre: persona.nombres || persona.nombre || '',
  apellido: persona.apellidos || persona.apellido || '',
  telefono: persona.telefono || '',
  correo: persona.email || persona.correo || '',
  departamento: persona.departamento || '',
  municipio: persona.ciudad || persona.municipio || '',
  direccion: persona.direccion || '',
  barrio: persona.barrio || persona.neighborhood || '',
  informacionAdicional: persona.informacionAdicional || persona.notes || ''
});

const saveOrUpdatePersonaWithConnection = async (connection, persona) => {
  const [existingRows] = await connection.execute(
    'SELECT documento FROM praessia.persona WHERE documento = ? LIMIT 1',
    [persona.documento]
  );

  const personaFields = buildPersonaFields(persona);

  if (existingRows.length > 0) {
    await connection.execute(
      `UPDATE praessia.persona
         SET tipoDocumento = ?, nombre = ?, apellido = ?, telefono = ?, correo = ?, departamento = ?, municipio = ?, direccion = ?, barrio = ?, informacionAdicional = ?
         WHERE documento = ?`,
      [
        personaFields.tipoDocumento,
        personaFields.nombre,
        personaFields.apellido,
        personaFields.telefono,
        personaFields.correo,
        personaFields.departamento,
        personaFields.municipio,
        personaFields.direccion,
        personaFields.barrio,
        personaFields.informacionAdicional,
        persona.documento
      ]
    );
    return persona.documento;
  }

  await connection.execute(
    `INSERT INTO praessia.persona
       (documento, tipoDocumento, nombre, apellido, telefono, correo, departamento, municipio, direccion, barrio, informacionAdicional)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      persona.documento,
      personaFields.tipoDocumento,
      personaFields.nombre,
      personaFields.apellido,
      personaFields.telefono,
      personaFields.correo,
      personaFields.departamento,
      personaFields.municipio,
      personaFields.direccion,
      personaFields.barrio,
      personaFields.informacionAdicional
    ]
  );
  return persona.documento;
};

exports.saveOrUpdatePersona = async (pool, persona) => {
  const connection = await pool.getConnection();
  try {
    return await saveOrUpdatePersonaWithConnection(connection, persona);
  } finally {
    connection.release();
  }
};

exports.findActiveProducts = async (pool) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, producto AS fragancia, costoVenta AS valor_unitario FROM praessia.producto WHERE estado = 1 ORDER BY producto ASC'
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.createSaleWithDetails = async (pool, { persona, detalles, canalVenta, medioPago, referencia, fecha, asesorId }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const personaDocumento = await saveOrUpdatePersonaWithConnection(connection, persona);

    const totalValue = detalles.reduce((sum, item) => {
      const cantidad = Number(item.cantidad) || 0;
      const valorUnitario = Number(item.valorUnitario) || 0;
      return sum + cantidad * valorUnitario;
    }, 0);

    const [logResult] = await connection.execute(
      `INSERT INTO praessia.logventa
       (fecha, valor, asesor)
       VALUES (?, ?, ?)`,
      [fecha || new Date(), totalValue, asesorId]
    );

    const idVenta = logResult.insertId;
    const detailValues = detalles.map((item) => [
      idVenta,
      fecha || new Date(),
      Number(item.referencia) || 0,
      item.cantidad,
      canalVenta || '',
      medioPago || '',
      item.valorUnitario || 0,
      asesorId
    ]);

    if (detailValues.length > 0) {
      await connection.query(
        `INSERT INTO praessia.ventas
         (idVenta, fecha, referencia, cantidad, canalVenta, medioPago, valor, asesor)
         VALUES ?`,
        [detailValues]
      );
    }

    await connection.commit();
    return { personaDocumento, idVenta, totalValue };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
