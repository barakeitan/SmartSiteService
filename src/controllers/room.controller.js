const Room = require('../models/room.model');
const mongoose = require("mongoose");

exports.getAllRoomsBySiteId = async (req, res) => {
    try {
        const rooms = await Room.find({ siteId: req.params.siteId }).exec();
        res.status(200).json(rooms);
    } catch (error) {
        console.log(error);
    }
}

exports.getAllRooms = async (req, res) => {
    try {
        const allRooms = await Room.find().exec();
        res.status(200).json(allRooms);
    } catch (error) {
        console.log(error);
    }
}