const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensor.controller');

router.get('/:roomId', sensorController.getSensorsByRoomId);

module.exports = router;