const express = require('express');
const router = express.Router();

const {
  signup,
  signin,
  requireSignin,
  isAuthenticate,
  GenerateNewAccessToken
} = require('../controllers/auth.controller');
const { userSignupValidator, checkAccessToken } = require('../helpers/validator');

router.post('/signup', userSignupValidator, signup);
router.post('/signin', signin);
router.post('/refreshToken', GenerateNewAccessToken)
router.get('/isAuthenticate', isAuthenticate)

module.exports = router;
