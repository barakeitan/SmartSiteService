const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sensorSchema = new Schema({
    sensorTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorType' },
    telemetryEntityId : { type: mongoose.Schema.Types.ObjectId, ref: 'TelemetryEntity' },
    date: { type: Date, default: new Date() },
    sensorData: { type: String },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    status: { type: String } // 1 is ok 2 is warning and 3 is dangerous
});
const Sensor = mongoose.model("Sensor", sensorSchema, "Sensor");
module.exports = Sensor;