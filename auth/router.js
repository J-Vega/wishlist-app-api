'use strict';
//const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const config = require('../config');

const {Router} = require('express');
const router = new Router();

const {localStrategy, jwtStrategy} = require('./strategies.js');

const createAuthToken = function(user) {
  console.log("Creating authentication token")
  console.log("User - ", user);
    return jwt.sign({user}, config.JWT_SECRET, {
      subject: user.userName,
      expiresIn: config.JWT_EXPIRY,
      algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('localAuth', {session: false});

router.use(bodyParser.json());



const jwtAuth = passport.authenticate('jwt', {session: false});
// The user provides a username and password to login


router.post('/login', localAuth, (req, res) => {
  console.log("Conducting post request at login endpoint");
    const authToken = createAuthToken(req.user.serialize());
    res.json({authToken});
});

router.get("/profile", localAuth, (req, res) => {
  //res.sendFile(__dirname + "../public/profile.html");
  window.location.replace("/profile.html");
});

// The user exchanges a valid JWT for a new one with a later expiration
router.post('/refresh', jwtAuth, (req, res) => {
  console.log("User from router.js : ", req.user);
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

module.exports = router;
