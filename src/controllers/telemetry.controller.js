const http = require("http");
const {handlePostUpdate} = require("../services/telemetryAnalytics");
const Record = require('../models/record.model');
const Sensor = require('../models/sensor.model');
const SensorType = require('../models/sensorType.model');
const TelemetryEntity = require('../models/telemetryEntity.model');

exports.getAllTelemetry = (req, res) => {
    const options = {
        hostname: "127.0.0.1",
        port: 8001,
        method: "GET"
    };

    let res_data="";

    const request = http.request(options, api_res =>{
        let data = '';
        api_res.on("data", d => {
            // console.log(d);
            data = d;
        });

        api_res.on("error", error =>{
            console.log({"error":error});
        });
    
        api_res.on("end", () =>{
            try {
                res_data = JSON.parse(data);
                process.stdout.write(data);
                res.status(200).json(res_data);
            } catch (error) {
                // res.status(401).write(error);
            }
        });
    });

    request.end();

    request.on('finish', () => {
        // console.log("on finish");
        // console.log(res_data);
    });
};

exports.get_updates_table = (req, res) => {
    const options = {
        hostname: "127.0.0.1",
        path: "/table",
        port: 8001,
        method: "GET"
    };

    let res_data="";

    const request = http.request(options, api_res =>{
        let data = '';
        api_res.on("data", d => {
            // console.log(d);
            data = d;
        });

        api_res.on("error", error =>{
            console.log({"error":error});
        });
    
        api_res.on("end", () =>{
            try {
                res_data = JSON.parse(data);
                // process.stdout.write(data);
                res.status(200).json(res_data);
            } catch (error) {
                res.status(401).write(error);
            }
        });
    });

    request.end();

    request.on('finish', () => {
        // console.log("on finish");
        // console.log(res_data);
    });
};

exports.get_last = (req, res) => {
    const options = {
        hostname: "127.0.0.1",
        path: "/last",
        port: 8001,
        method: "GET"
    };

    let res_data="";

    const request = http.request(options, api_res =>{
        let data = '';
        api_res.on("data", d => {
            // console.log(d);
            // data = d;
        });

        api_res.on("error", error =>{
            console.log({"error":error});
        });
    
        api_res.on("end", () =>{
            try {
                res_data = JSON.parse(data);
                process.stdout.write(data);
                res.status(200).json(res_data);
            } catch (error) {
                res.status(401).write(error);
            }
        });
    });

    request.end();

    request.on('finish', () => {
        // console.log("on finish");
        // console.log(res_data);
    });
};

exports.telemetryDataPost = (req, res) => 
{
    console.log("handling data from the post")
    const payload = req.body;
    //also send in web socket if working and save each update here or in the telemetryAnalytics
    handlePostUpdate(payload);
    res.status(200).json({ message: 'POST request received' });
}

exports.getComputersByroomId = async (req, res) => {
    try {
        console.log("roomId: " + req.params.roomId);
        const telemetryEntity = await TelemetryEntity.find({ roomId: req.params.roomId }).exec();
        console.log("telemetryEntity in getComputersByroomId: " + telemetryEntity);
        res.status(200).json(telemetryEntity);
    } catch (error) {
        console.log(error);
    }
}

exports.getSensorsBycomputerId = async (req, res) => {
    try {
        console.log("telemetryEntity in getSensorsBycomputerId: " + req.params.telemetryEntityId);
        const sensors = await Sensor.find({ telemetryEntityId: req.params.telemetryEntityId })
        .populate("sensorTypeId")
        .exec();
        console.log("sensors: ", sensors);
        res.status(200).json(sensors);
    } catch (error) {
        console.log(error);
    }
}


exports.getRecordsBycomputerId = async (req, res) => {
    try {
        // Gather CPU Sensor records
        const cpuSensorTypeId = await SensorType.findOne({ name: 'Cpu Sensor' }).select('_id').exec();
        const cpuSensors = await Sensor.find({ sensorTypeId: cpuSensorTypeId }).exec();
        const cpuSensorIds = cpuSensors.map(sensor => sensor._id);
        const cpuSensorRecords = await Record.find({ sensorId: { $in: cpuSensorIds }, telemetryEntityId: req.params.telemetryEntityId })
        .limit(100)
        .sort([['date', -1]])
        .exec();

        console.log('CPU Sensor Records:', cpuSensorRecords);

        // Gather Disk Sensor records
        const diskSensorTypeId = await SensorType.findOne({ name: 'Disk Sensor' }).select('_id').exec();
        const diskSensors = await Sensor.find({ sensorTypeId: diskSensorTypeId }).exec();
        const diskSensorIds = diskSensors.map(sensor => sensor._id);
        const diskSensorRecords = await Record.find({ sensorId: { $in: diskSensorIds }, telemetryEntityId: req.params.telemetryEntityId })
        .limit(100)
        .sort([['date', -1]])
        .exec();

        console.log('Disk Sensor Records:', diskSensorRecords);

        // Gather Memory Sensor records
        const memorySensorTypeId = await SensorType.findOne({ name: 'Ram Sensor' }).select('_id').exec();
        const memorySensors = await Sensor.find({ sensorTypeId: memorySensorTypeId }).exec();
        const memorySensorIds = memorySensors.map(sensor => sensor._id);
        const memorySensorRecords = await Record.find({ sensorId: { $in: memorySensorIds }, telemetryEntityId: req.params.telemetryEntityId })
        .limit(100)
        .sort([['date', -1]])
        .exec();

        console.log('Memory Sensor Records:', memorySensorRecords);

        const result = {"cpu": cpuSensorRecords, "disk": diskSensorRecords, "memory": memorySensorRecords};

        res.status(200).json(result);

    } catch (error) {
        console.log(error);
    }
}
