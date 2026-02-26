const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authorize } = require('../../middleware/auth');

// Staff can view products
router.get('/', productsController.getAll);
router.get('/low-stock', productsController.getLowStock);
router.get('/expiring', productsController.getExpiring);
router.get('/:id', productsController.getById);

// Only owner can modify products
router.post('/', authorize('OWNER'), productsController.create);
router.put('/:id', authorize('OWNER'), productsController.update);
router.delete('/:id', authorize('OWNER'), productsController.delete);

module.exports = router;