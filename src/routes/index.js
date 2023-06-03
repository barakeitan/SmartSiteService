const express = require('express');
const router = express.Router();
const RoomRouter = require('./room.routes');
const sensorRouter = require('./sensor.routes');
const malfunctionRouter = require('./malfunction.routes');
const recordRouter = require('./record.routes');

router.use('/room',RoomRouter);
router.use('/sensor',sensorRouter);
router.use('/malfunction',malfunctionRouter);
router.use('/record',recordRouter);


module.exports = router;

