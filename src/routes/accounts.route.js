const express = require('express');
const AccountController = require('../controllers/accounts.controller.js');
require('dotenv').config();

const accountRouter = express.Router();

accountRouter.get('/allaccounts', AccountController.getAllAccount);
accountRouter.post('/signup', AccountController.signUp);
accountRouter.post('/verified/resendtoken', AccountController.resendToken);
accountRouter.get('/verified/token/:token', AccountController.verifiedTokenSignup);
accountRouter.post('/login', AccountController.login);

module.exports = accountRouter;