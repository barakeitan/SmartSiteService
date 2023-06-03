const express = require('express');
const router = express.Router();

const {getAllTelemetry, get_updates_table, get_last} = require("../controllers/telemetry");
const { checkAccessToken } = require('../helpers/validator');

router.get("/telemetry", getAllTelemetry);
router.get("/updates_table", get_updates_table);
router.get("/last", get_last);

module.exports = router;