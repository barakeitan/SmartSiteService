const User = require('../models/user');
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
        err: errorHandler(err),
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user,
    });
  });
};

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
    // generate a signed token with user id and secret
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
    // create authenticate method in user model
    if (!user.authenticate(password, user.email)) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }
    const { _id, name, email, role } = user;
    // generate a signed token with user id and secret
    // const tokenExpiration =
    //         Number((new Date().getTime() / 1000).toFixed()) +
    //         parseInt(process.env.ACCESS_TOKEN_EXPIRED_IN || '300', 10) * 1000;
    const accessToken = jwt.sign(
      { 
        user: { _id, email, name, role },        
        // expiration: tokenExpiration || Number(new Date() + process.env.TOKEN_EXPIRED_IN)
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
  // const user = new User(user);

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


exports.signout = (req, res) => {
  res.clearCookie('t');
  res.json({ message: 'Signout success' });
};

exports.requireSignin = expressJwt({
  secret: process.env.ACCESS_TOKEN_SECRET,
  // algorithms: ['RS256'],
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
