const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');

router.put('/:id', usersController.updateProfile);

module.exports = router;
