const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const malfunctionSchema = new Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
    malfunctionTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'MalfunctionType' },
    date: { type: Date, default: Date.now() },
    recent_data: { type: String },
    message: { type: String }//a message from the server or from the raspberry pie
});
const Malfunction = mongoose.model("Malfunction", malfunctionSchema, "Malfunction");
module.exports = Malfunction;