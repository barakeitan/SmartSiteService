const Malfunction = require('../models/malfunction.model');

exports.getMalfunctionsByRoomId = async (req, res) => {
    try {
        const malfunctions = await Malfunction.find({ _id: req.params.roomId }).populate("sensorId", "malfunctionTypeId").exec();
        res.status(200).json(malfunctions);
    } catch (error) {
        console.log(error);
    }
}

exports.createMalfunction = async (req, res) => {
    try {
        const malfunction = await Malfunction.create({ ...req.body }).exec();
        res.status(200).json(malfunction);
    } catch (error) {
        console.log(error);
    }
}