const express = require('express');
const router = express.Router();
const staffController = require('./staff.controller');
const { authenticate, authorize } = require('../../middleware/auth');

// Tất cả routes đều yêu cầu xác thực và chỉ OWNER mới được truy cập
router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', staffController.getAll);
router.get('/available-users', staffController.getAvailableUsers);
router.post('/', staffController.create);
router.put('/:id', staffController.update);
router.delete('/:id', staffController.delete);

module.exports = router;