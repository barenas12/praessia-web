const express = require('express');
const recordSaleController = require('./record-sale.controller');

const router = express.Router();

router.get('/persona/:documento', recordSaleController.getPersonaByDocumento);
router.get('/products', recordSaleController.getActiveProducts);
router.post('/register', recordSaleController.registerSale);

module.exports = router;
