require("dotenv").config();
const Site = require("../models/site.model");
const Sensor = require("../models/sensor.model");
const Sensor_type = require("../models/sensorType.model");
const Record = require("../models/record.model");
const Room = require("../models/room.model");
const Malfunction = require("../models/malfunction.model");
const { sendMessage } = require("../helpers/messages/telegram");
const { sampleTelemetryInfo, getTelemetryEntityProcess } = require("./telemetryAnalytics");
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
const processMap = new Map(); // <telemetryEntityId, processName>
processMap.set("", "Python");

const mappings = {
    "Cpu Sensor": {
        "warning": (sensor) => {
            check_cpu_warning(sensor);
        },
        "danger": (sensor) => {
            check_cpu_danger(sensor);
        }
    },
    "Temperature Sensor": {
        "warning": (sensor) => {
            check_temperature_warning(sensor);
        },
        "danger": (sensor) => {
            check_temperature_danger(sensor);
        }
    },
    "Sound Sensor": {
        "warning": (sensor) => {
            check_sound_warning(sensor);
        },
        "danger": (sensor) => {
            check_sound_danger(sensor);
        }
    },
    "Ram Sensor": {
        "warning": (sensor) => {
            check_ram_warning(sensor);
        },
        "danger": (sensor) => {
            check_ram_danger(sensor);
        }
    },
    "Disk Sensor": {
        "warning": (sensor) => {
            check_disk_warning(sensor);
        },
        "danger": (sensor) => {
            check_disk_danger(sensor);
        }
    },
    "Water Level Sensor": {
        "warning": (sensor) => {
            check_water_warning(sensor);
        },
        "danger": (sensor) => {
            check_water_danger(sensor);
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
           await main();
           await updateStatusInGeneral()
       }, 5000);
    } catch (err) {
        console.log(err);
    }
}

async function main(telemetry_data=null) {
    try {
        global_telemetry_data = telemetry_data;

        const rooms = await Room.find({}).exec();
        rooms.forEach(async room => {
            const sensors = await Sensor.find({ roomId: room._id }).populate("sensorTypeId").exec();
            
            if(room._id == default_room_id)
            {
                default_sensors = Array.from(sensors);
            }
            sensors.forEach(sensor => {
                checkAlerts(room, sensor, sensor.sensorTypeId, DataType.SENSOR);
            });
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
            await mappings[sensor_type["name"]]["warning"](sensor);
            await updateSensorStatus(sensor, "2");
            break;
        case 3:
            message = "In Danger zone";
            await mappings[sensor_type["name"]]["danger"](sensor);
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
    console.log("in the last hour with sensor " + sensor._id)
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
        await sendMessage(room, sensor, malfunctionTypeId,severity);
        // analyticsCallback();
    }
    //console.log(malfunctions)
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
    console.log("inserting malfunction")
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
            // roomId: room._id,
            roomId: default_room_id,
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
        // console.log("in update status in general");
        
      const sites = await Site.find({}).exec();
      for (const site of sites) {
        let rooms_maxStatus = "0";
        const rooms = await Room.find({ siteId: site._id }).exec();

        for (const room of rooms) {
          const sensors = await Sensor.find({ roomId: room._id }).exec();
          let sensors_maxStatus = "0";
          for (const sensor of sensors) {
            if (sensor.status > sensors_maxStatus) {
              sensors_maxStatus = sensor.status;
            }
          }

          if (sensors_maxStatus !== "0") {
            room.status = sensors_maxStatus;
            if(room.status>rooms_maxStatus){
                rooms_maxStatus=room.status;
            }
            await room.save();
          }
        }
        if (rooms_maxStatus !== "0") {
          site.status = rooms_maxStatus;
          await site.save();
        }
        rooms_maxStatus = "0";
        
      }
    } catch (error) {
      console.error(error);
    }
  };

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

exports.updateEntityProcess = (entity_id, process) => {
    console.log("Add " + process + " to entity " + entity_id);
    processMap.set(entity_id, process);
    console.log(processMap.get(entity_id));
    return processMap.get(entity_id);
}

async function check_cpu_warning(sensor) {
    // check memory - if up send warning heavy process if not bad process
    const mem_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Ram Sensor");
    // let zone = checkZone(global_telemetry_data["memory"], 0, 100);
    let zone = checkZone(mem_sensor["sensorData"], mem_sensor["sensorTypeId"]["minValue"], mem_sensor["sensorTypeId"]["maxValue"]);
    let heavy_malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU warning heavy process")
    let bad_malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU warning bad process");
    const cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    if(zone > 1)
    {
        await check_if_exists_last_hour(default_room_id, cpu_sensor, heavy_malf._id, "WARNING ", "");
    }
    else
    {
        await check_if_exists_last_hour(default_room_id, cpu_sensor, bad_malf._id, "WARNING ", "");
    }
}

async function check_cpu_danger(sensor) {
    console.log("checking cpu dangers with value " + sensor.sensorData)
    const cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    //check mem - if up display busy task if not malf program error
    const mem_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Ram Sensor");
    let mem_zone = checkZone(mem_sensor["sensorData"], mem_sensor.sensorTypeId["minValue"], mem_sensor.sensorTypeId["maxValue"]);
    //check temp - if up then alert to close the task if not so it is less dangerous
    let temp_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");
    let temp_zone = checkZone(temp_sensor.sensorData, temp_sensor.sensorTypeId["minValue"], temp_sensor.sensorTypeId["maxValue"]);
    //check sound - if up then vintelator is on if not so you still haves time to fix it 
    let sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let sound_zone = checkZone(sound_sensor.sensorData, sound_sensor.sensorTypeId["minValue"], sound_sensor.sensorTypeId["maxValue"]);

    if(sound_zone > 1)
    {
        console.log("sensor " + sensor['telemetryEntityId']  + " " + processMap.get(sensor['telemetryEntityId']??""));
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU danger fans");
        await check_if_exists_last_hour(default_room_id, sensor,
        malf._id, "DANGER ", "consider turning off process "+ processMap.get(sensor['telemetryEntityId']??""));//global_telemetry_data?.data?.proces);
    }
    else
    {
        console.log("sensor " + sensor['telemetryEntityId'] + " " + processMap.get(sensor['telemetryEntityId']??""));
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "CPU danger hot");
        await check_if_exists_last_hour(default_room_id, sensor,
        malf._id, "DANGER ", "consider turning off process "+ processMap.get(sensor['telemetryEntityId']??""));
    } 
}

async function check_temperature_warning(sensor) {
    //check sound, if up then maybe fans work too much, if down then problem AC, if not changed then other problem
    //alert the result as warning
    const temp_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");
    let sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let sound_zone = checkZone(sound_sensor.sensorData, sound_sensor.sensorTypeId["minValue"], sound_sensor.sensorTypeId["maxValue"]);

    if(sound_zone > 1)
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperture warning");
        await check_if_exists_last_hour(default_room_id, temp_sensor, malf._id, "WARNING ", "or the fans started working too hard");
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperture warning");
        await check_if_exists_last_hour(default_room_id, temp_sensor, malf._id, "WARNING ", "");
    }
}

async function check_temperature_danger(sensor) {
    // same as the warning just in result
    const temperature_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Temperature Sensor");

    let sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    let sound_zone = checkZone(sound_sensor.sensorData, sound_sensor.sensorTypeId["minValue"], sound_sensor.sensorTypeId["maxValue"]);
    
    let cpu_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Cpu Sensor");
    let cpu_zone = checkZone(cpu_sensor.sensorData, cpu_sensor.sensorTypeId["minValue"], cpu_sensor.sensorTypeId["maxValue"]);

    if(sound_zone > 1 || cpu_zone > 1)
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperature fans danger");
        await check_if_exists_last_hour(default_room_id, temperature_sensor, malf._id, "DANGER ", "");
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Temperture danger");
        await check_if_exists_last_hour(default_room_id, temperature_sensor, malf._id, "DANGER ", "");
    }
}

async function check_sound_warning(sensor) {
    // alert that one of the computers are working hard
    let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Sound warning");
    const sound_sensor = default_sensors.find((obj)=> obj["sensorTypeId"]["name"] == "Sound Sensor");
    await check_if_exists_last_hour(default_room_id, sound_sensor, malf._id, "WARNING ", "");
}

async function check_sound_danger(sensor) {
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
        await check_if_exists_last_hour(default_room_id, sound_sensor, malf._id, "DANGER ", "");
    }
    else
    {
        let malf = malfunctionsTypes.find((obj) => obj.malfunctionTypeName == "Sound warning");
        await check_if_exists_last_hour(default_room_id, sound_sensor, malf._id, "DANGER ", "");
    }
}

function check_ram_warning(sensor){
    console.log("WARNING : RAM");
}

function check_ram_danger(sensor){
    console.log("DANGER : RAM");
}

function check_disk_warning(sensor){
    // console.log("WARNING : DISK");
}

function check_disk_danger(sensor){
    console.log("DANGER : DISK");
}

function check_water_warning(sensor){
    console.log("WARNING : WATER");
}

function check_water_danger(sensor){
    console.log("DANGER : WATER");
}
