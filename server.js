const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const expressValidator = require('express-validator');
require('dotenv').config();
// import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const telemetryReoutes = require("./src/routes/telemetry");
const routes = require('./src/routes');
const { broadcast } = require("./wsServer");
// const { getAllTelemetry } = require("./src/controllers/telemetry");

// Telemetry variables
let cpuAvg = 0;
let diskAvg = 0;
let memAvg = 0;

// app
const app = express();

// db connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      }
    );
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    // exit process with failure
    process.exit(1);
  }
};
connectDB();

// middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

// routes middleware

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api',telemetryReoutes);
app.use('/api',routes);

if (process.env.NODE_ENV == "development") {
    const swaggerUI = require("swagger-ui-express")
    const swaggerJsDoc = require("swagger-jsdoc")
    const options = {
    definition: {
    openapi: "3.0.0",
    info: {
    title: "Library API",
    version: "1.0.0",
    description: "A simple Express Library API",
    },
    servers: [{url: `http://localhost:${process.env.PORT}`,},],
    },
    apis: ["./routes/*.js"],
    };
    const specs = swaggerJsDoc(options);
    app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
 }

// Server static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

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

const sampleTelemetryInfo = async () =>
{
  try {
    //get the latest three lines   
    // const response = await axios.get('http://127.0.0.1:3007/api/telemetry');
    // const response = getAllTelemetry()
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

  setTimeout(sampleTelemetryInfo, 3000);
};
sampleTelemetryInfo();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
