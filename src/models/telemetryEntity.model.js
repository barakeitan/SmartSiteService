const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const telemetryEntitySchema = new Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    telemetryEntityName: { type: String }
});

const telemetryEntity = mongoose.model("TelemetryEntity", telemetryEntitySchema, "TelemetryEntity");
module.exports = telemetryEntity;