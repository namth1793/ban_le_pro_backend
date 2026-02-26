const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth'); // THÊM DÒNG NÀY

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', authenticate, authController.changePassword); // Sửa dòng này

module.exports = router;