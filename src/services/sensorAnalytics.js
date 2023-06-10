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

const malfunctionsTypes = [];

exports.start_intervals = async () => {
    malfunctionsTypes = await MalfunctionType.find({}).exec();
    setInterval(sampleTelemetryInfo, 3000)
    setInterval(updateStatusInGeneral, 3000);
    setInterval(main, 3000);
}

// This should be temporary
const default_room_id = "647b44a207ab16da82a6a0ca";

const default_sensors = [];

//this is the telemetry data, updates every 3 seconds 
const global_telemetry_data={}

const mappings = {
    "cpu_sensor": {
        warning: () => {
            check_cpu_warning();
        },
        danger: () => {
            check_cpu_danger();
        }
    },
    "temperature_sensor": {
        warning: () => {
            check_temperature_warning();
        },
        danger: () => {
            check_temperature_danger();
        }
    },
    "sound_sensor": {
        warning: () => {
            check_sound_warning();
        },
        danger: () => {
            check_sound_danger();
        }
    }
}


async function main() {
    try {
        const rooms = await Room.find({}).exec();
        rooms.forEach(async room => {
            const sensors = await Sensor.find({ roomId: room._id }).populate("sensorTypeId").exec();
            const telemetryData = await sampleTelemetryInfo();
            sensors.forEach(sensor => {
                checkAlerts(room, sensor, sensor.sensorTypeId, telemetryData);
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
function updateSensorStatus(sensor, status) {
    Sensor.findByIdAndUpdate({ _id: sensor.id })
        .then(sensor => {
            if (!sensor) {
                throw new Error("sensor doesn't exists");
            }
            sensor.status = status;
            sensor.save();
        })
        .catch(err => {
            console.log(err);
        });
}

/**
* @param {room object} room
* @param {sensor object} sensor
* @param {sensr_type object} sensor_type
* @description Checks the data of the sensors in each room and their integrity and alerts accordingly 
*/
function checkAlerts(room, sensor, sensor_type, telemetryData) {
    let message = '';
    switch (
    checkZone(
        sensor.sensorData,
        sensor_type["minValue"],
        sensor_type["maxValue"]
    )
    ) {
        case 1:
            updateSensorStatus(sensor, "1");
            break;
        case 2:
            message = "In warning zone";
            check_if_exists_last_hour(
                room,
                sensor,
                process.env.SENSOR_DATA_EXEPTION,
                message,
                mappings[sensor_type["name"]]["warning"]
            );
            updateSensorStatus(sensor, "2");
            break;
        case 3:
            message = "In Danger zone";
            check_if_exists_last_hour(
                room,
                sensor,
                process.env.SENSOR_DATA_ONGOING_EXEPTION,
                message,
                mappings[sensor_type["name"]]["danger"]
            );
            updateSensorStatus(sensor, "3");
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
function check_if_exists_last_hour(room, sensor, malfunctionTypeId, message, analyticsCallback) {
    const currentDate = new Date();
    currentDate.setTime(
        currentDate.getTime() - new Date().getTimezoneOffset() * 60 * 1000
    );
    const beforeAnHour = new Date(currentDate);
    beforeAnHour.setHours(beforeAnHour.getHours() - 1);
    Malfunction.find({
        sensorId: sensor._id,
        malfunctionTypeId: malfunctionTypeId,
        date: {
            $gte: beforeAnHour, //from
            $lt: currentDate //to
        }
    })
        .then(malfunctions => {
            if (!malfunctions[0]) {
                //if there is no malfunction within the last hour in sensor and
                //his mal_type then insert a new one
                insertMalfunction(room, sensor, malfunctionTypeId, message);
                sendMessage(room, sensor, malfunctionTypeId);
                analyticsCallback();
            }
        })
        .catch(err => {
            console.log(err);
        });
}
/**
 * 
 * @param {*} room 
 * @param {*} sensor 
 * @param {*} malfunctionTypeId 
 * @param {*} message 
 * insert new malfunction to the system
 */
function insertMalfunction(room, sensor, malfunctionTypeId, message) {
    let currentDate = new Date();
    currentDate.setTime(
        currentDate.getTime() - new Date().getTimezoneOffset() * 60 * 1000
    );
    Record.findOne({ sensorId: sensor._id })
        .sort({ date: -1 })
        .limit(1)
        .then(record => {
            let malfunction = new Malfunction({
                roomId: room._id,
                sensorId: sensor._id,
                date: currentDate,
                malfunctionTypeId: malfunctionTypeId,
                recent_data: record.sensorData,
                message: message,
            });
            malfunction.save();
        })
        .catch(err => {
            console.log(err);
        });
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

/**
 * 
 * @param {*} update the json object containing the update
 * @description handles the data from the telemetry by checking the possible zones and determines 
 * if there was an alert
 */
function handle_update(update) {

}

function check_cpu_warning() {

}

function check_cpu_danger() {

}

function check_temperature_warning() {

}

function check_temperature_danger() {

}

function check_sound_warning() {

}

function check_sound_danger() {

}