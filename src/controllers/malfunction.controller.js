const Malfunction = require('../models/malfunction.model');

exports.getMalfunctionsByRoomId = async (req, res) => {
    try {
        const malfunctions = await Malfunction.find({ roomId: req.params.roomId }).populate("sensorId", "malfunctionTypeId").exec();
        res.status(200).json(malfunctions);
    } catch (error) {
        console.log(error);
    }
}

exports.createMalfunction = async (req, res) => {
    try {
        const malfunction = await new Malfunction({ ...req.body }).save();
        res.status(200).json(malfunction);
    } catch (error) {
        console.log(error);
    }
}