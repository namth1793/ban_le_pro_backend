const express = require('express');
const router = express.Router();
const shopsController = require('./shops.controller');

router.get('/:id', shopsController.getById);
router.put('/:id', shopsController.update);

module.exports = router;
