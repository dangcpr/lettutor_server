const express = require('express');
const AccountController = require('../controllers/accounts.controller.js');
const { auth } = require('../middlewares/auth.js');
const uploader = require('../middlewares/uploader.js');
const multParse = require('../middlewares/multipart.js');
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
accountRouter.post('/updateInfo', uploader.single("avatar"), AccountController.updateInfomation);
accountRouter.delete('/deleteAvatar', auth, AccountController.deleteAvatar);

module.exports = accountRouter;