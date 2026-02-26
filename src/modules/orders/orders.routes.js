const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');

router.post('/', ordersController.create);
router.get('/', ordersController.getAll);
router.get('/today', ordersController.getTodayStats);
router.get('/:id', ordersController.getById);
router.put('/:id/status', ordersController.updateStatus);

module.exports = router;