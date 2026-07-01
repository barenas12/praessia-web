const express = require('express');
const loginController = require('./login.controller');
const authMiddleware = require('./auth.middleware');

const router = express.Router();

router.post('/', loginController.login);
router.post('/change-password', loginController.changePassword);
router.post('/logout', loginController.logout);
router.get('/check', authMiddleware.authenticate, loginController.check);

module.exports = router;
