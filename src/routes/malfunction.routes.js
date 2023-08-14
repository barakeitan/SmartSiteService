const express = require('express');
const router = express.Router();
const malfunctionController = require('../controllers/malfunction.controller');

/**
  * @swagger
  * tags:
  *   name: Malfunction
  *   description: The malfunctions managing API
  */

/**
 * @swagger
 * /api/malfunction/{roomId}:
 *   get:
 *     summary: Get all malfunctions by roomId
 *     tags: [Malfunction]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room id
 *     responses:
 *       200:
 *         description: The malfunctions by roomId
 *         contents:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Malfunction'
 *       404:
 *         description: The malfunctions was not found
 */
router.get('/:roomId',malfunctionController.getMalfunctionsByRoomId);

/**
 * @swagger
 * /api/malfunction:
 *   post:
 *     summary: Create a new malfunction
 *     tags: [Malfunction]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Malfunction'
 *     responses:
 *       200:
 *         description: The malfunction was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Malfunction'
 *       500:
 *         description: Some server error
 */
router.post('/',malfunctionController.createMalfunction);

module.exports = router;