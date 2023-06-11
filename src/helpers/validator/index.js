const jwt = require('jsonwebtoken');
 const { checkRefreshToken } = require('../../controllers/auth.controller');

exports.userSignupValidator = (req, res, next) => {
  req.check('name', 'Name is required').notEmpty();
  req
    .check('email', 'Email must be between 3 to 32 characters')
    .matches(/.+\@.+\..+/)
    .withMessage('Email must contain @')
    .isLength({
      min: 4,
      max: 32,
    });
  req.check('password', 'Password is required').notEmpty();
  req
    .check('password')
    .isLength({ min: 6 })
    .withMessage('Password must contain at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number');
  const errors = req.validationErrors();
  if (errors) {
    const firstError = errors.map((error) => error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  next();
};

// Define middleware function
exports.checkAccessToken = (req, res, next) => {
  const accessToken = req.headers.authorization;

  // If access token is missing
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    // Verify access token
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        // Access token is invalid or expired
        const refreshToken = req.body.refreshToken;

        if (!refreshToken) {
          return res.status(401).send('Access token is invalid or expired');
        }

        // Check if refresh token is valid
        const validRefreshToken = checkRefreshToken(refreshToken);

        if (!validRefreshToken) {
          return res.status(403).send('Invalid refresh token');
        }

        // if (decoded.exp - process.env.RENEW_TOKEN_BEFORE_EXPIRED < Date.now() / 1000) {
          if (decoded.exp && (Math.floor(Date.now() / 1000) - decoded.exp) > process.env.ACCESS_TOKEN_EXPIRED_IN) {
          // Generate new access token
          const accessToken = jwt.sign({ username: validRefreshToken.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRED_IN) });

          // Set new access token in response header
          res.set('Authorization', `Bearer ${accessToken}`);
        }
      }
      req.user = decoded.user;
      next(); // no error, proceed
    });
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid access token' });
  }
};

