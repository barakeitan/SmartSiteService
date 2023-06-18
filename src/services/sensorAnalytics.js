require("dotenv").config();
const Site = require("../models/site.model");
const Sensor = require("../models/sensor.model");
const Sensor_type = require("../models/sensorType.model");
const Record = require("../models/record.model");
const Room = require("../models/room.model");
const Malfunction = require("../models/malfunction.model");
const { sendMessage } = require("../helpers/messages/telegram");
const { sampleTelemetryInfo } = require("./telemetryAnalytics");
const { DataType } = require("../helpers/enums/dataType.enum");
const sensorType = require("../models/sensorType.model");
const MalfunctionType = require("../models/malfunctionType.model");
const {broadcast} = require("../../wsServer");

let malfunctionsTypes = [];


// This should be temporary
const default_room_id = "647b44a207ab16da82a6a0ca";

let default_sensors = [];

//this is the telemetry data, updates every 3 seconds 
let global_telemetry_data={}

const mappings = {
    "Cpu Sensor": {
        "warning": () => {
            check_cpu_warning();
        },
        "danger": () => {
            check_cpu_danger();
        }
    },
    "Temperature Sensor": {
        "warning": () => {
            check_temperature_warning();
        },
        "danger": () => {
            check_temperature_danger();
        }
    },
    "Sound Sensor": {
        "warning": () => {
            check_sound_warning();
        },
        "danger": () => {
            check_sound_danger();
        }
    },
    "Ram Sensor": {
        "warning": () => {
            check_ram_warning();
        },
        "danger": () => {
            check_ram_danger();
        }
    },
    "Disk Sensor": {
        "warning": () => {
            check_disk_warning();
        },
        "danger": () => {
            check_disk_danger();
        }
    },
    "Water Level Sensor": {
        "warning": () => {
            check_water_warning();
        },
        "danger": () => {
            check_water_danger();
        }
    }
}

exports.start_intervals = async () => {
    try {
        malfunctionsTypes = await MalfunctionType.find({}).exec();
       // setInterval(sampleTelemetryInfo, 3000)
       // setInterval(updateStatusInGeneral, 3000);
       // setInterval(main, 3000);
       setInterval(async()=>{
           // TODO: save the telemetry data to the db
        //    const telemetryData = await sampleTelemetryInfo();
           // Download said telemetry data back from the db
        //    await main(telemetryData);
           await updateStatusInGeneral()
       }, 3000);
    } catch (err) {
        console.log(err);
    }
}

async function main(telemetry_data) {
    try {
        global_telemetry_data = telemetry_data;
        //temporaryyyyyy - only for trials
        broadcast(global_telemetry_data);
        const rooms = await Room.find({}).exec();
        rooms.forEach(async room => {
            const sensors = await Sensor.find({ roomId: room._id }).populate("sensorTypeId").exec();
            // console.log("sensors : "+sensors);
            if(room._id == default_room_id)
            {
                default_sensors = Array.from(sensors);
                //console.log("default sensors are : " + default_sensors)
            }
            sensors.forEach(sensor => {
                checkAlerts(room, sensor, sensor.sensorTypeId, DataType.SENSOR);
            });
            //checkAlerts(room, null, null, DataType.TELEMETRY);
        })
    } catch (error) {
        console.log(error);
    }
}

function howMuch_to_multiple(minVal, maxVal) {
    return 100 / (maxVal - minVal);
}

/**
 * @param {string} currentValue the current value of the sensor
 * @param {*} minVal minimum value of sensor
 * @param {*} maxVal maximum value of sensor
 * @description Converts sensor data into percentages according to a possible range that a sensor can output
 * @returns percentage
 */
function value_to_percentage(currentValue, minVal, maxVal) {
    return (currentValue - minVal) * howMuch_to_multiple(minVal, maxVal);
}

/**
 * 
 * @param {string} currentValue 
 * @param {int} minVal 
 * @param {int} maxVal 
 * @description Checking the information range of the sensor
 * @returns return the status of the sensor according it
 */
function checkZone(currentValue, minVal, maxVal) {
    var value = value_to_percentage(currentValue, minVal, maxVal);
    /**
     * check if value is between 0% to 75% (safe zone)
     */
    if (value >= 0 && value <= 75) {
        return 1;
    }
    /**
     * check if value is between 10% to 25% or 75% to 90% (warning zone)
     */
    if (value > 75 && value < 90) {
        return 2;
    }
    /**
     *check if value is lower than 10% or higher than 90% (danger zone) 
     */
    if (value >= 90) {
        return 3;
    }
}

/**
 * 
 * @param {*} sensor 
 * @param {string} status 
 * update status sensor 
 */
async function updateSensorStatus(sensor, status) {
    const sensor_find = await Sensor.findByIdAndUpdate({ _id: sensor.id });
        // .then(sensor => {

        // })
        // .catch(err => {
        //     console.log(err);
        // });
    if (!sensor_find) {
        throw new Error("sensor doesn't exists");
    }
    sensor_find.status = status;
    await sensor_find.save();
}

/**
* @param {room object} room
* @param {sensor object} sensor
* @param {sensr_type object} sensor_type
* @description Checks the data of the sensors in each room and their integrity and alerts accordingly 
*/
async function checkAlerts(room, sensor, sensor_type) {
    let message = '';
    //console.log("checking zone for " + sensor_type.name + " with value of " + sensor.sensorData)
    switch (
    checkZone(
        sensor.sensorData,
        sensor_type["minValue"],
        sensor_type["maxValue"]
    )
    ) {
        case 1:
            await updateSensorStatus(sensor, "1");
            break;
        case 2:
            message = "In warning zone";
            await mappings[sensor_type["name"]]["warning"]();
            await updateSensorStatus(sensor, "2");
            break;
        case 3:
            message = "In Danger zone";
            await mappings[sensor_type["name"]]["danger"]();
            await updateSensorStatus(sensor, "3");
            break;
    }
}


/**
 * 
 * @param {*} room 
 * @param {*} sensor 
 * @param {*} malfunctionTypeId 
 * @param {*} message 
 * @description Before the system wants to enter a malfunction, 
 *              it checks whether a malfunction of the same type and the same sensor has already been entered
 *              in the last hour
 *              If not entered, then it enters a new malfunction
 *              and sends a Telegram message to the customer about the malfunction
 */
async function check_if_exists_last_hour(room, sensor, malfunctionTypeId, severity, message) {
    const currentDate = new Date();
    currentDate.setTime(
        currentDate.getTime() - new Date().getTimezoneOffset() * 60 * 1000
    );
    const beforeAnHour = new Date(currentDate);
    beforeAnHour.setHours(beforeAnHour.getHours() - 1);
    let malfunctions = await Malfunction.find({
        sensorId: sensor._id,
        malfunctionTypeId: malfunctionTypeId,
        date: {
            $gte: beforeAnHour, //from
            $lt: currentDate //to
        }
    });
    if (!malfunctions[0]) {
        //if there is no malfunction within the last hour in sensor and
        //his mal_type then insert a new one
        await insertMalfunction(room, sensor, malfunctionTypeId, message, severity);
        await sendMessage(room, sensor, malfunctionTypeId);
        // analyticsCallback();
    }
        // .then(malfunctions => {
            
        // })
        // .catch(err => {
        //     console.log(err);
        // });
}
/**
 * 
 * @param {*} room 
 * @param {*} sensor 
 * @param {*} malfunctionTypeId 
 * @param {*} message 
 * insert new malfunction to the system
 */
async function insertMalfunction(room, sensor, malfunctionTypeId, message, severity) {
    let currentDate = new Date();
    currentDate.setTime(
        currentDate.getTime() - new Date().getTimezoneOffset() * 60 * 1000
    );
    // await Record.findOne({ sensorId: sensor._id })
    //     .sort({ date: -1 })
    //     .limit(1)
        // .then(record => {
            
        // })
        // .catch(err => {
        //     console.log(err);
        // });
        await new Malfunction({
            roomId: room._id,
            sensorId: sensor._id,
            date: currentDate,
            malfunctionTypeId: malfunctionTypeId,
            recent_data: sensor.sensorData,
            severity: severity,
            message: message,
        }).save();
}
/**
 * Updating the status of the site / room according to priority of criticality, 
 * that is, 3 is the most critical, so if it exists, it will be updated to that status and so on
 */
const updateStatusInGeneral = async () => {
    try {
        const sites = await Site.find({}).exec();
        sites.forEach(async site => {
            const rooms = await Room.find({ siteId: site._id }).exec();
            let site_maxStatus = "0";
            rooms.forEach(async room => {
                const sensors = await Sensor.find({ roomId: room._id }).exec();
                let sensors_maxStatus = "0";
                sensors.forEach(async sensor => {
                    if (sensor.status > sensors_maxStatus) {
                        sensors_maxStatus = sensor.status;
                    }
                });

                if (sensors_maxStatus !== "0") {
                    room.status = sensors_maxStatus;
                    if (room.status > site_maxStatus) {
                        site_maxStatus = room.status;
                    }
                    await room.save();
                }

            });
            if (site_maxStatus !== "0") {
                site.status = site_maxStatus;
                await site.save();
            }
        })

    } catch (error) {
        console.log(error);
    }
}

exports.createSensor = async (roomId, siteId, telemetry_entity, sensor_type, value, sensorStatus) => {
    try {
        await new Sensor({  sensorTypeId: sensor_type,
                            telemetryEntityId: telemetry_entity, 
                            date: Date.now(), 
                            sensorData: value,
                            roomId: roomId,
                            status: sensorStatus}).save();
    } catch (error) {
        console.log(error)
    }
}

async function check_cpu_warning() {
    // check memory - if up send warning heavy process if not bad process
    const mem_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Ram Sensor");
    // let zone = checkZone(global_telemetry_data["memory"], 0, 100);
    let zone = checkZone(mem_sensor["sensorData"], mem_sensor["sensorTypeId"]["minValue"], mem_sensor["sensorTypeId"]["maxValue"]);
    let heavy_malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU warning heavy process")
    let bad_malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU warning bad process");
    const cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    if(zone > 1)
    {
        await check_if_exists_last_hour(default_room_id, cpu_sensor, heavy_malf._id, "WARNING : ", "");
    }
    else
    {
        await check_if_exists_last_hour(default_room_id, cpu_sensor, bad_malf._id, "WARNING : ", "");
    }
}

async function check_cpu_danger() {
    const cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    //check mem - if up display busy task if not malf program error
    const mem_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Ram Sensor");
    let mem_zone = checkZone(mem_sensor["sensorData"], mem_sensor.sensorTypeId["minValue"], mem_sensor.sensorTypeId["maxValue"]);
    //check temp - if up then alert to close the task if not so it is less dangerous
    let temp_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");
    let temp_zone = checkZone(temp_sensor.sensorData, temp_sensor.sensorTypeId["minValue"], temp_sensor.sensorTypeId["maxValue"]);
    //check sound - if up then vintelator is on if not so you still have time to fix it 
    let sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let sound_zone = checkZone(sound_sensor.sensorData, sound_sensor.sensorTypeId["minValue"], sound_sensor.sensorTypeId["maxValue"]);

    if(sound_zone > 1)
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU danger fans");
        await check_if_exists_last_hour(default_room_id, cpu_sensor,
        malf._id, "DANGER : ", "consider turning off process "+global_telemetry_data.data.proces);
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU danger hot");
        await check_if_exists_last_hour(default_room_id, cpu_sensor,
        malf._id, "DANGER : ", "consider turning off process "+global_telemetry_data?.data?.process);
    }
}

async function check_temperature_warning() {
    //check sound, if up then maybe fans work too much, if down then problem AC, if not changed then other problem
    //alert the result as warning
    const temp_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");
    let sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let sound_zone = checkZone(sound_sensor.sensorData, sound_sensor.sensorTypeId["minValue"], sound_sensor.sensorTypeId["maxValue"]);

    if(sound_zone > 1)
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperture warning");
        await check_if_exists_last_hour(default_room_id, temp_sensor, malf._id, "WARNING : ", "or the fans started working too hard");
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperture warning");
        await check_if_exists_last_hour(default_room_id, temp_sensor, malf._id, "WARNING : ", "");
    }
}

async function check_temperature_danger() {
    // same as the warning just in result
    const temperature_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");

    let sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let sound_zone = checkZone(sound_sensor.sensorData, sound_sensor.sensorTypeId["minValue"], sound_sensor.sensorTypeId["maxValue"]);
    
    let cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    let cpu_zone = checkZone(cpu_sensor.sensorData, cpu_sensor.sensorTypeId["minValue"], cpu_sensor.sensorTypeId["maxValue"]);

    if(sound_zone > 1 || cpu_zone > 1)
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperature fans danger");
        await check_if_exists_last_hour(default_room_id, temperature_sensor, malf._id, "DANGER : ", "");
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperture danger");
        await check_if_exists_last_hour(default_room_id, temperature_sensor, malf._id, "DANGER : ", "");
    }
}

async function check_sound_warning() {
    // alert that one of the computers are working hard
    let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Sound warning");
    const sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    await check_if_exists_last_hour(default_room_id, sound_sensor, malf._id, "WARNING : ", "");
}

async function check_sound_danger() {
    //alert that many computers are working hard
    const sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    let cpu_zone = checkZone(cpu_sensor.sensorData, cpu_sensor.sensorTypeId["minValue"], cpu_sensor.sensorTypeId["maxValue"]);
    
    //check temperature, if up so malf room is heating up...
    let temp_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");
    let temp_zone = checkZone(temp_sensor.sensorData, temp_sensor.sensorTypeId["minValue"], temp_sensor.sensorTypeId["maxValue"]);

    if(cpu_zone > 1)
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Sound danger");
        await check_if_exists_last_hour(default_room_id, sound_sensor, malf._id, "DANGER : ", "");
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Sound warning");
        await check_if_exists_last_hour(default_room_id, sound_sensor, malf._id, "DANGER : ", "");
    }
}

function check_ram_warning(){   
    console.log("WARNING : RAM");
}

function check_ram_danger(){
    console.log("DANGER : RAM");
}

function check_disk_warning(){
    console.log("WARNING : DISK");
}

function check_disk_danger(){
    console.log("DANGER : DISK");
}

function check_water_warning(){
    console.log("WARNING : WATER");
}

function check_water_danger(){
    console.log("DANGER : WATER");
}
