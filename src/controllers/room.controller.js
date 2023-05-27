const Room = require('../models/room.model');

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ siteId: req.params.siteId }).exec();
        res.status(200).json(rooms);
    } catch (error) {
        console.log(error);
    }
}