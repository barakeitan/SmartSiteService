const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sensor_typeSchema = new Schema({
    name: String,
    minValue: Number,
    maxValue: Number
});
const sensorType = mongoose.model("SensorType", sensor_typeSchema, "SensorType");
module.exports = sensorType;