const express = require('express');
const router = express.Router();

const {get_all_telemetry, get_updates_table} = require("../controllers/telemetry");

router.get("/telemetry", get_all_telemetry);
router.get("/updates_table", get_updates_table);

module.exports = router;