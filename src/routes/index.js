const express = require('express');
const router = express.Router();
const RoomRouter = require('./room.routes');
const SiteRouter = require('./site.routes');
const sensorRouter = require('./sensor.routes');
const malfunctionRouter = require('./malfunction.routes');
const recordRouter = require('./record.routes');
const telemetryRouter = require('./telemetry.routes');

/**
* @swagger
* components:
*   securitySchemes:
*       bearerAuth:
*           type: http
*           scheme: bearer
*           bearerFormat: JWT
*/

router.use('/room',RoomRouter);

router.use('/site',SiteRouter);

router.use('/sensor',sensorRouter);

router.use('/malfunction',malfunctionRouter);

router.use('/record',recordRouter);

router.use('/telemetry',telemetryRouter);


module.exports = router;

