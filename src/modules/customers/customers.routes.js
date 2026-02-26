const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');

router.post('/', customersController.create);
router.get('/', customersController.getAll);
router.get('/:id', customersController.getById);
router.put('/:id', customersController.update);
router.post('/:id/points', customersController.addPoints);

module.exports = router;