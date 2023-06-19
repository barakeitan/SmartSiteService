const Malfunction = require('../models/malfunction.model');

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
        console.log("malfunctions:"+malfunctions)
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