const User = require('../models/user.model');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for auth check
const { errorHandler } = require('../helpers/dbErrorHandler');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

exports.signup = (req, res) => {
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        error: "There was an error save your user in DB. Please try again later.",
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user,
    });
  });
};

exports.isAuthenticate = (req, res) => {
  const authHeader = req.headers.authorization;

  // If access token is missing
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Split the Authorization header value to extract the token
  const [bearer, token] = authHeader.split(' ');

  // Check if the Authorization header format is valid
  if (bearer !== 'Bearer' || token == 'null') {
    return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
  }
  // const accessToken = token.replace(/^'|'$/g, '"');
  const accessToken = token.slice(1, -1);

  try {
    // Verify access token
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
        if (decoded.exp && (Math.floor(Date.now() / 1000) - decoded.exp) > process.env.ACCESS_TOKEN_EXPIRED_IN) {
          res.json({isAuthenticate: false});
        }
        console.log('user is authenticated and allowed to pass to the desired route');
      res.json({isAuthenticate: true});
    });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid access token' });
  }
}

exports.GenerateNewAccessToken = (req, res) => {
  const refreshToken = req.body.refreshToken;
  // const username = req.body.username;
  const email = req.body.email;

  User.findOne({ email: email }, (err, user) => {
    if (!refreshToken) {
      return res.status(401).send('Refresh token not provided');
    }
  
    // Check if refresh token is valid
    const validRefreshToken = checkRefreshToken(refreshToken);
  
    if (!validRefreshToken) {
      return res.status(403).send('Invalid refresh token');
    }
  
    const { _id, name, email, role } = user;
    // Generate new access token
    const accessToken = jwt.sign(
      { 
        user: { _id, email, name, role }, 
        // expiration: Number(new Date() + parseInt(process.env.TOKEN_EXPIRED_IN))
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRED_IN)
      }
    );
      // Send new access token in response
      res.json({ accessToken });
  });
}

exports.checkRefreshToken = (refreshToken, email, callback) => {
  // Find the refresh token document for the given email
  User.findOne({ email: email }, (err, user) => {
    if (err) {
      console.log(err);
      callback(false);
    } else {
      if (user) {
        // Compare the given refresh token to the hashed token stored in the database
        bcrypt.compare(refreshToken, user.hashed_refreshToken, (err, result) => {
          if (err) {
            console.log(err);
            callback(false);
          } else {
            if (result) {
              callback(true);
            } else {
              callback(false);
            }
          }
        });
      } else {
        callback(false);
      }
    }
  });
}


exports.signin = (req, res) => {
  // find the user based on email
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email doesn't exist. Please signup.",
      });
    }
    // if user found make sure the email and password match
    if (!user.authenticate(password, user.email)) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }
    const { _id, name, email, role } = user;
    // generate a signed token with user id and secret
    const accessToken = jwt.sign(
      { 
        user: { _id, email, name, role },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRED_IN)
      }
    );
    const refreshToken = uuidv4();
    const encryptRefreshToken = user.encryptRefreshToken(refreshToken);
    user.hashed_refreshToken = encryptRefreshToken.token;

    // Store refresh token in database
    storeRefreshToken(res, user);

    // return response with user and token to frontend client
    
    return res.json({ accessToken, refreshToken, user: { _id, email, name, role } });
  });
};

function storeRefreshToken(res, user) {
  // Store refresh token in database
  User.findOneAndUpdate(
    { email: user.email },
    { $set: user },
    { new: true },
    (err, user) => {
      if (err) {
        return res.status(400).json({
          error: 'You are not authorized to perform this action',
        });
      }
    }
  );
}

exports.requireSignin = expressJwt({
  secret: process.env.ACCESS_TOKEN_SECRET,
  userProperty: 'auth',
});

exports.isAuth = (req, res, next) => {
  console.log("req.profile = ",req.profile);
  console.log("req.auth = ",req.auth);
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: 'Access denied',
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: 'Admin resource! Access denied',
    });
  }
  next();
};
