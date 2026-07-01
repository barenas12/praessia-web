const recordSaleService = require('./record-sale.service');

const mapPersonaRow = (persona) => ({
  documento: persona.documento,
  tipoDocumento: persona.tipoDocumento,
  nombres: persona.nombre || '',
  apellidos: persona.apellido || '',
  telefono: persona.telefono || '',
  email: persona.correo || '',
  direccion: persona.direccion || '',
  departamento: persona.departamento || '',
  ciudad: persona.municipio || '',
  barrio: persona.barrio || '',
  informacionAdicional: persona.informacionAdicional || ''
});

exports.getPersonaByDocumento = async (req, res) => {
  try {
    const documento = req.params.documento?.trim();
    if (!documento) {
      return res.status(400).json({
        success: false,
        message: 'Documento es obligatorio.'
      });
    }

    const pool = req.app.locals.pool;
    const persona = await recordSaleService.findPersonaByDocumento(pool, documento);

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una persona con ese documento.'
      });
    }

    return res.status(200).json({
      success: true,
      data: mapPersonaRow(persona)
    });
  } catch (error) {
    console.error('Error al consultar persona:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar la persona.'
    });
  }
};

exports.getActiveProducts = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const products = await recordSaleService.findActiveProducts(pool);
    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error al cargar productos activos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al cargar los productos.'
    });
  }
};

exports.registerSale = async (req, res) => {
  try {
    const {
      persona,
      detalles,
      canalVenta,
      medioPago,
      referencia,
      fecha
    } = req.body;

    const asesorId = req.user?.userId;
    if (!persona || !persona.documento) {
      return res.status(400).json({
        success: false,
        message: 'Los datos de la persona con documento son obligatorios.'
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto en la venta.'
      });
    }

    if (!canalVenta || !medioPago) {
      return res.status(400).json({
        success: false,
        message: 'Canal de venta y medio de pago son obligatorios.'
      });
    }

    if (!asesorId) {
      return res.status(401).json({
        success: false,
        message: 'No se pudo identificar al asesor. Inicia sesión nuevamente.'
      });
    }

    const pool = req.app.locals.pool;
    const result = await recordSaleService.createSaleWithDetails(pool, {
      persona,
      detalles,
      canalVenta,
      medioPago,
      referencia,
      fecha,
      asesorId
    });

    return res.status(201).json({
      success: true,
      message: 'Venta registrada correctamente.',
      data: result
    });
  } catch (error) {
    console.error('Error al registrar venta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar la venta.'
    });
  }
};
