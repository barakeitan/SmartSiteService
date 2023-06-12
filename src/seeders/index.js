const SensorType = require("../models/sensorType.model");
const Sensor = require("../models/sensor.model");

exports.sensorsSeeders = async () => {
    console.log("create sensor seeders");
    await new Sensor({
        //temperature sensor
        sensorTypeId: "6482fa30f43f3884b4074a45",
        sensorData: "25",
        roomId: "647b44a207ab16da82a6a0ca",
        status: "1"
    }).save();
    await new Sensor({
        //sound detection
        sensorTypeId: "6482fa30f43f3884b4074a47",
        sensorData: "400",
        roomId: "647b44a207ab16da82a6a0ca",
        status: "2"
    }).save();
}

exports.sensorTypeSeeders = async () => {
    console.log("create sensorType seeders");
    await new SensorType({
        name: "temperature",
        minValue: 25,
        maxValue: 30
    }).save();
    await new SensorType({
        name: "sound detection",
        minValue: 0,
        maxValue: 700
    }).save();
    // await new SensorType({
    //     name:"temperature_sensor",
    //     minValue:25,
    //     maxValue:30
    //  }).save();
}
