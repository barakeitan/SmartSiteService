const axios = require('axios');

// Telemetry variables
let cpuAvg = 0;
let diskAvg = 0;
let memAvg = 0;

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

      console.log('cpu: avg = '+cpuAvg+', val = '+cpu_rec+", std = "+cpu_std);
      console.log('disk: avg = '+diskAvg+', val = '+disk_rec+", std = "+disk_std);
      console.log('mem: avg = '+memAvg+', val = '+mem_rec+", std = "+mem_std+'\n');

      // Add the number to the avg
      cpuSum  += cpu_rec;
      diskSum += disk_rec;
      memSum  += mem_rec;
    }
    cpuAvg = (cpuAvg + cpuSum) / (records.data.length + 1);
    diskAvg = (diskAvg + diskSum) / (records.data.length + 1);
    memAvg = (memAvg + memSum) / (records.data.length + 1)

    console.log('cpu avg  : ' + cpuAvg);
    console.log('disk avg : ' + diskAvg);
    console.log('mem avg  : ' + memAvg);
  } catch (err) {
    console.error(err);
  }

//   setTimeout(sampleTelemetryInfo, 3000);
};


// sampleTelemetryInfo();

