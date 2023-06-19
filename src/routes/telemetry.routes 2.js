const express = require('express');
const router = express.Router();

const {getAllTelemetry, telemetryDataPost, getSensorsBycomputerId, getRecordsBycomputerId, getComputersByroomId} = require("../controllers/telemetry.controller");
const { checkAccessToken } = require('../helpers/validator');

// router.get("/telemetry", getAllTelemetry);
router.get("/tableUpdates/:telemetryEntityId", getRecordsBycomputerId);
router.get("/lastTelemetryData/:telemetryEntityId", getSensorsBycomputerId); 
router.get('/getComputersList/:roomId', getComputersByroomId);
router.post("/entityTelemetry", telemetryDataPost);

module.exports = router;