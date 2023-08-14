const Malfunction = require('../models/malfunction.model');
const Sensor = require('../models/sensor.model');
const {sendMessage} = require("../helpers/messages/telegram");

exports.getMalfunctionsByRoomId = async (req, res) => {
    try {
        const malfunctions = await Malfunction.find({ roomId: req.params.roomId,  
            malfunctionTypeId: { $ne: null }, severity: {$ne: null},
            sensorId : {$ne : null} })
        .populate({
            path: 'sensorId',
            populate: {
              path: 'sensorTypeId',
              model: 'SensorType'
            }
          })
        .populate('malfunctionTypeId')
        .sort([['date', -1]])
        .limit(100)
        .exec();
        res.status(200).json(malfunctions);
    } catch (error) {
        console.log(error);
    }
}

exports.createMalfunction = async (req, res) => {
    try {
        const WARNING_SEVERITY = "WARNING";
        const malfunction = await new Malfunction({ recent_data:"None",severity:WARNING_SEVERITY,...req.body }).save();
        const sensor = await Sensor.findOne({ _id: req.body?.sensorId }).exec();
        await sendMessage(req.body.roomId,sensor,req.body.malfunctionTypeId,WARNING_SEVERITY);
        res.status(200).json(malfunction);
    } catch (error) {
        console.log(error);
    }
}