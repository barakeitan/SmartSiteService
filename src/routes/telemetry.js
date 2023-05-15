const express = require('express');
const router = express.Router();

const {getAllTelemetry} = require("../controllers/telemetry");
const { checkAccessToken } = require('../helpers/validator');

router.get("/telemetry", checkAccessToken, getAllTelemetry);

module.exports = router;