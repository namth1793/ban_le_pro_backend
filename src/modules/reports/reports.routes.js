const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');

router.get('/daily', reportsController.getDaily);
router.get('/monthly', reportsController.getMonthly);
router.get('/best-sellers', reportsController.getBestSellers);
router.get('/inventory', reportsController.getInventory);

module.exports = router;