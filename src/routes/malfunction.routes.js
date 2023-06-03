const express = require('express');
const router = express.Router();
const malfunctionController = require('../controllers/malfunction.controller');

router.get('/:roomId',malfunctionController.getMalfunctionsByRoomId);

router.post('/',malfunctionController.createMalfunction);

module.exports = router;