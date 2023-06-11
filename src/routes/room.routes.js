const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

router.get('/:siteId',roomController.getAllRoomsBySiteId);

router.get('/',roomController.getAllRooms);

module.exports = router;