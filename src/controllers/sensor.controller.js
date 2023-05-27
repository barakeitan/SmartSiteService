const Sensor = require('../models/sensor.model');

exports.getSensorsByRoomId = async (req, res) => {
    try {
        const sensors = await Sensor.find({ _id: req.params.roomId }).exec();
        res.status(200).json(sensors);
    } catch (error) {
        console.log(error);
    }
}
