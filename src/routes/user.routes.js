const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth.controller');

const {
  userById,
  read,
  update
} = require('../controllers/user.controller');

router.get('/secret/:userId', requireSignin, isAuth, isAdmin, (req, res) => {
  res.json({
    user: req.profile,
  });
});

router.get('/user/:userId', requireSignin, isAuth, read);
router.put('/user/:userId', requireSignin, isAuth, update);

router.param('userId', userById);

module.exports = router;
