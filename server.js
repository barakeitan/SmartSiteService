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
const {sensorTypeSeeders,sensorsSeeders} = require("./src/seeders");
const { broadcast } = require("./wsServer");
const {start_intervals} = require('./src/services/sensorAnalytics')


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
    // await sensorTypeSeeders()
    // await sensorsSeeders();
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

start_intervals();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
