const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const expressValidator = require('express-validator');
require('dotenv').config();
// import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const telemetryReoutes = require("./routes/telemetry");
const { clients, broadcast } = require("./wsServer");

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

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
