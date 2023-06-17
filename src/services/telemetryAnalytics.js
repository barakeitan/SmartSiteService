const axios = require('axios');
const { handle_telemetry_update , createSensor} = require('./sensorAnalytics');
const TelemetryEntity = require("../models/telemetryEntity.model")
const SensorTypes = require("../models/sensorType.model")
const Sensor = require("../models/sensor.model")

// Telemetry variables
let cpuAvg = 0;
let diskAvg = 0;
let memAvg = 0;

const CPU_SENSOR_TYPE = "6480b46ca40f681bc7585e80";
const DISK_SENSOR_TYPE = "648449a15d13c587f96910ac";
const MEM_SENSOR_TYPE = "6484467d5d13c587f96910ab";

const calc_std = (avg, val) =>
{
  let sigma = 100; // 100 - 0 for the maximum usage value - the minimum usage value 
  dist = Math.pow(val-avg, 2) / sigma;
  return Math.sqrt(dist);
}

const handleStd = (std) => 
{
  // TODO: implement this function in another section of the code 
  // console.log("std : " + std);
}

exports.sampleTelemetryInfo = async () =>
{
  try {
    //get the latest three lines   
    const response = await axios.get('http://127.0.0.1:3007/api/telemetry');
    let records = response.data;
    let cpu_rec = disk_rec = mem_rec = 0;
    let cpu_std = disk_std = mem_std = 0;
    let cpuSum = diskSum = memSum = 0;

   // const object_to_send = JSON.parse(records.data);
    for (let i = 0; i < records.data.length; i++) {

      // Parse the string to json and because the data comes corrupted, we replace the ' in "
      const record = JSON.parse(records.data[i].replace(/'/g, `"`));

      // Extract the data
      cpu_rec  = Number(record.cpu);
      disk_rec = Number(record.disk);
      mem_rec  = Number(record.memory);

      // Calculate the std for each parameter
      cpu_std  = calc_std(cpuAvg, cpu_rec);
      disk_std = calc_std(diskAvg, disk_rec);
      mem_std  = calc_std(memAvg, mem_rec);
     
      handleStd(cpu_std);
      handleStd(disk_std);
      handleStd(mem_std);

    //   console.log('cpu: avg = '+cpuAvg+', val = '+cpu_rec+", std = "+cpu_std);
    //   console.log('disk: avg = '+diskAvg+', val = '+disk_rec+", std = "+disk_std);
    //   console.log('mem: avg = '+memAvg+', val = '+mem_rec+", std = "+mem_std+'\n');

      // Add the number to the avg
      cpuSum  += cpu_rec;
      diskSum += disk_rec;
      memSum  += mem_rec;

      //handle_telemetry_update(record)
    //   update_func(record)
    }
    cpuAvg = (cpuAvg + cpuSum) / (records.data.length + 1);
    diskAvg = (diskAvg + diskSum) / (records.data.length + 1);
    memAvg = (memAvg + memSum) / (records.data.length + 1)

    // console.log('cpu avg  : ' + cpuAvg);
    // console.log('disk avg : ' + diskAvg);
    // console.log('mem avg  : ' + memAvg);

    return response;
  } catch (err) {
    console.error(err);
  }
};

exports.handlePostUpdate = async (payload) => {
  // TODO : implement
  console.log(payload)

  //check if i have the telemetryEntity
  //if not then create a new entity and 3 sensors with said entity
  //if telemetryEntity exist then find all sensors with the related telemetry entity and call updateSensorStatus

  try {
    const entity = await TelemetryEntity.find({telemetryEntityName : payload["telemetryEntitiy"]}).exec();
    
    //if the entity exist 
    if(entity[0]){
      console.log("found entity " + payload["telemetryEntity"]);
      const sensors = await Sensor.find({ telemetryEntityId: entity._id }).populate("sensorTypeId").exec();
      // console.log("sensors : "+sensors);
      sensors.forEach(async sensor => {
          switch(sensor.sensorTypeId){
            case CPU_SENSOR_TYPE:
              sensor.sensorData = payload["cpu"];
              await sensor.save();
              break;
            case DISK_SENSOR_TYPE:
              sensor.sensorData = payload["disk"];
              await sensor.save();
              break;
            case MEM_SENSOR_TYPE:
              sensor.sensorData = payload["memory"];
              await sensor.save();
              break; 

          }
      });
    }
    else{ //this is a new entity
      console.log("Creating new Entity " + payload["telemetryEntity"]);
      //save the entity
      const newEntity = await new TelemetryEntity(
      {
        roomId: payload["roomId"],
        telemetryEntityName: payload["telemetryEntitiy"], 
      }).save();

      //create cpu sensor
      createSensor(payload["roomId"], payload["siteId"], newEntity._id, CPU_SENSOR_TYPE, payload["cpu"], "1");

      //create disk sensor
      createSensor(payload["roomId"], payload["siteId"], newEntity._id, DISK_SENSOR_TYPE, payload["disk"], "1");

      //create ram sensor
      createSensor(payload["roomId"], payload["siteId"], newEntity._id, MEM_SENSOR_TYPE, payload["memory"], "1");
    }
  } catch (error) {
      console.log(error);
  }
}