const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sensor_typeSchema = new Schema({
    name: { type: String },
    minValue: { type: Number },
    maxValue: { type: Number }
});
const sensorType = mongoose.model("SensorType", sensor_typeSchema);
module.exports = sensorType;