const express = require('express');
const router = express.Router();

const {getAllTelemetry, get_updates_table} = require("../controllers/telemetry");
const { checkAccessToken } = require('../helpers/validator');

router.get("/telemetry", getAllTelemetry);
router.get("/updates_table", checkAccessToken, get_updates_table);

module.exports = router;