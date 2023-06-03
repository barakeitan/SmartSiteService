const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const recordSchema = new Schema({
    sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
    date: new Date(),
    sensorData: String,
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
});

const Record = mongoose.model("Record", recordSchema);
module.exports = Record;