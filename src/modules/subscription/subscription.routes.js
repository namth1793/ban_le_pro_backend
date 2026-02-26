const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');

router.get('/', subscriptionController.getCurrent);
router.get('/invoices', subscriptionController.getInvoices);
router.post('/upgrade', subscriptionController.upgrade);
router.post('/renew', subscriptionController.renew);
router.put('/auto-renew', subscriptionController.setAutoRenew);

module.exports = router;
