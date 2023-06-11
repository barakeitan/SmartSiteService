const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sensorSchema = new Schema({
    sensorTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorType' },
    date: Date,
    sensorData: String,
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    status: String // 1 is ok 2 is warning and 3 is dangerous
});
const Sensor = mongoose.model("Sensor", sensorSchema, "Sensor");
module.exports = Sensor;