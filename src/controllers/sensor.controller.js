const Sensor = require('../models/sensor.model');

exports.getSensorsByRoomId = async (req, res) => {
    try {
        const sensors = await Sensor.find({ roomId: req.params.roomId }).populate("sensorTypeId").exec();
        res.status(200).json(sensors);
    } catch (error) {
        console.log(error);
    }
}
