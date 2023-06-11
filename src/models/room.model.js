const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const roomSchema = new Schema({
    name: { type: String },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
    status: { type: String }
});
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;