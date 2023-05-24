const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const recordSchema = new Schema({
    sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
    date: Date,
    sensorData: String,
    roomId: String,
});
const Record = mongoose.model("Record", recordSchema);
module.exports = Record;