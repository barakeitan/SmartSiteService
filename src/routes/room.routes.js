const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');


/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - name
 *         - siteId
 *         - status 
 *         - imagePath
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the room
 *         siteId:
 *           type: string
 *           description: The siteId of the room
 *         status:
 *           type: string
 *           description: The status of the room
 *         imagePath:
 *           type: string
 *           description: The imagePath of the room
 *       example:
 *         name: college of management
 *         siteId: ed35jf875f
 *         status: 1
 *         imagePath: /images/picture
 */

 /**
  * @swagger
  * tags:
  *   name: Room
  *   description: The rooms managing API
  */

/**
 * @swagger
 * /api/room/{siteId}:
 *   get:
 *     summary: Get all rooms by siteId
 *     tags: [Room]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The site id
 *     responses:
 *       200:
 *         description: The rooms by siteId
 *         contents:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: The rooms was not found
 */
router.get('/:siteId',roomController.getAllRoomsBySiteId);


/**
 * @swagger
 * /api/room:
 *   get:
 *     summary: Returns the list of all the rooms
 *     tags: [Room]
 *     responses:
 *       200:
 *         description: The list of the rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/',roomController.getAllRooms);

module.exports = router;