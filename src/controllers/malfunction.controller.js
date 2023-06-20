const Malfunction = require('../models/malfunction.model');

exports.getMalfunctionsByRoomId = async (req, res) => {
    try {
        const malfunctions = await Malfunction.find({ roomId: req.params.roomId })
        .populate({
            path: 'sensorId',
            select: 'sensorTypeId',
            populate: {
            path: 'sensorTypeId',
            model: 'SensorType',
            },
        })
        .limit(100)
        .sort([['date', -1]])
        .exec();
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