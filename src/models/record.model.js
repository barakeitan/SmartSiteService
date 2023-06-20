const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const recordSchema = new Schema({
    sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
    telemetryEntityId : { type: mongoose.Schema.Types.ObjectId, ref: 'TelemetryEntity' },
    date: { type: Date, default: new Date(new Date().setMinutes(new Date().getMinutes() - new Date().getTimezoneOffset()))},
    sensorData:{ type: String },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
});

const Record = mongoose.model("Record", recordSchema, "Record");
module.exports = Record;