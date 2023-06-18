const http = require("http");
const {handlePostUpdate} = require("../services/telemetryAnalytics");
const Record = require('../models/record.model');
const Sensor = require('../models/sensor.model');
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
        console.log("telemetryEntity in getRecordsBycomputerId: " + req.params.telemetryEntityId);
        const records = await Record.find({ telemetryEntityId: req.params.telemetryEntityId })
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
        console.log("records: ", records);
        res.status(200).json(records);
    } catch (error) {
        console.log(error);
    }
}
