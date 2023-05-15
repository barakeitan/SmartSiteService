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
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const telemetryReoutes = require("./routes/telemetry");

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

const sampleTelemetryInfo = async () =>
{
  try {
    //get the latest three lines   
    const response = await axios.get('http://127.0.0.1:3007/api/telemetry');
    let records = response.data;
    
    for (let i = 0; i < records.data.length; i++) {
      const record = JSON.parse(records.data[i].replace(/'/g, `"`));

      cpuAvg  += Number(record.cpu);
      diskAvg += Number(record.disk);
      memAvg  += Number(record.memory);
    }
    cpuAvg = cpuAvg / (records.data.length + 1);
    diskAvg = diskAvg / (records.data.length + 1);
    memAvg = memAvg / (records.data.length + 1)

    console.log('cpu avg  : ' + cpuAvg);
    console.log('disk avg : ' + diskAvg);
    console.log('mem avg  : ' + memAvg);
  } catch (err) {
    console.error(err);
  }

  setTimeout(sampleTelemetryInfo, 10000);
};
sampleTelemetryInfo();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
