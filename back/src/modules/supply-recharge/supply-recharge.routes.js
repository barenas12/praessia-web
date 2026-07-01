
const express = require('express');
const supplyRechargeController = require('./supply-recharge.controller');

const router = express.Router();

/* POST /supply-recharge - Guardar una recarga */
router.post('/', supplyRechargeController.saveSupplyRecharge);

/* GET /supply-recharge - Obtener todas las recargas */
router.get('/', supplyRechargeController.getSupplyRecharge);

/* GET /supply-recharge/suppliers - Obtener proveedores */
router.get('/suppliers', supplyRechargeController.getSuppliers);

// GET /supply-recharge/fragances - Obtener fragancias/insumos disponibles
router.get('/fragances', supplyRechargeController.getFragrances);

module.exports = router;

