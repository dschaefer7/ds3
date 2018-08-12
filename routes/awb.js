const express = require('express');
const controller = require('../controllers/awb');
const router = express.Router();

//router.get('/', controller.awb);
router.post('/', controller.awb);

module.exports = router;
