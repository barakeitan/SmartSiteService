const Record = require('../models/record.model');
const Sensor = require('../models/sensor.model');

exports.getRecordBySensorId = async (req, res) => {
    try {
        const records = await Record.find({ _id: req.params.sensorId }).exec();
        res.status(200).json(records);
    } catch (error) {
        console.log(error);
    }
}

exports.createRecord = async (req, res) => {
    try {
        const record = await new Record({ ...req.body }).save();
        const updatedSensor = await Sensor.findOneAndUpdate({ _id: req.body.sensorId, }, { sensorData: req.body.sensorData }, { new: true })
        res.status(200).json({ record, updatedSensor });
    } catch (error) {
        console.log(error);
    }
}