const express = require('express');
const router = express.Router();
const recordController = require('../controllers/record.controller');

router.get('/:sensorId', recordController.getRecordBySensorId);

router.post('/', recordController.createRecord);

module.exports = router;