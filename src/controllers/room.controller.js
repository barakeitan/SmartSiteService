const Room = require('../models/room.model');
const mongoose = require("mongoose");

exports.getAllRooms = async (req, res) => {
    try {
        console.log("the siteId requested is: " + req.params.siteId);
        const siteId = mongoose.Types.ObjectId(req.params.siteId);
        const rooms = await Room.find({ siteId }).exec();
        res.status(200).json(rooms);
    } catch (error) {
        console.log(error);
    }
}