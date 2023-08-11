const express = require('express');
const AccountController = require('../controllers/accounts.controller.js');
const { auth } = require('../middlewares/auth.js');
require('dotenv').config();

const accountRouter = express.Router();

accountRouter.get('/allaccounts', auth, AccountController.getAllAccount);
accountRouter.post('/signup', AccountController.signUp);
accountRouter.post('/verified/resendtoken', AccountController.resendToken);
accountRouter.get('/verified/token/:token', AccountController.verifiedTokenSignup);
accountRouter.post('/login', AccountController.login);
accountRouter.post('/refresh', AccountController.refreshToken);
accountRouter.post('/autoLogin', AccountController.autoLogin);
accountRouter.post('/logout', AccountController.logout);

module.exports = accountRouter;