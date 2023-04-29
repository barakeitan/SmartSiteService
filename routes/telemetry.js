const express = require('express');
const router = express.Router();

const {get_all_telemetry} = require("../controllers/telemetry");

router.get("/telemetry", get_all_telemetry);

module.exports = router;