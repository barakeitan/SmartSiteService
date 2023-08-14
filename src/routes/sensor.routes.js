const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensor.controller');

/**
  * @swagger
  * tags:
  *   name: Sensor
  *   description: The sensors managing API
  */

/**
 * @swagger
 * /api/sensor/{roomId}:
 *   get:
 *     summary: Get all sensors by roomId
 *     tags: [Sensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room id
 *     responses:
 *       200:
 *         description: The sensors by roomId
 *         contents:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: The sensors was not found
 */
router.get('/:roomId', sensorController.getSensorsByRoomId);

module.exports = router;