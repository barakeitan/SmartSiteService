const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const roomSchema = new Schema({
    name: String,
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
    status: String
});
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;