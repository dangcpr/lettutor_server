const express = require('express');
const accountModel = require('../models/accounts');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
var validator = require("email-validator");
const { sendMail } = require('../helpers');
require('dotenv').config();

const accountRouter = express.Router();

accountRouter.get('/allaccounts', async (req, res) => {
    try {
        const queryResult = await accountModel.getAccount()
        console.log(queryResult.length);
        res.status(200).json({
            'accounts': queryResult,
        });
    } catch (e) {
        res.status(500).json({
            message: e.message,
        });
    }
})

accountRouter.post('/signup', async(req, res) => {
    try {
        if (req.body.email === null || req.body.password === null || req.body.rePassword === null || req.body.email === '' || req.body.password === '' || req.body.rePassword === '') {
            return res.status(400).json ({
                'error': 201,
                'message': 'Không được để trống email, mật khẩu và nhập lại mật khẩu'
            })
        }

        if(validator.validate(req.body.email) === false) {
            return res.status(400).json ({
                'error': 202,
                'message': 'Email không hợp lệ'
            })
        }

        if(req.body.password.length < 8) {
            return res.status(400).json ({
                'error': 203,
                'message': 'Mật khẩu phải có ít nhất 8 kí tự'
            })
        }

        if (req.body.password != req.body.rePassword) {
            return res.status(400).json ({
                'error': 203,
                'message': 'Password và Re-Password phải giống nhau'
            })
        }

        const result = await accountModel.getAccountByEmail(req.body.email)

        if (result.length != 0) {
            return res.status(401).json ({
                'error': 210,
                'message': 'Email đã tồn tại'
            })
        }

        await accountModel.addAccount(req.body.email, await bcryptjs.hash(req.body.password, 10));
        const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET_SIGNUP, { expiresIn: '5m' });
        sendMail(req.body.email, `${process.env.SERVER}/verified/token/${token}`)
        
        res.status(200).json({
            'result': {
                'message': 'Đăng ký thành công',
            },
        });
        
    } catch (e) {
        return res.status(500).json({
            message: e.message
        })
    }
})

accountRouter.post('/verified/resendtoken', async (req, res) => {
    try {
        if(req.body.email === null || req.body.email === '') {
            return res.status(400).json ({
                'error': 401,
                'message': 'Không được để trống email'
            })
        }

        if(validator.validate(req.body.email) === false) {
            return res.status(400).json ({
                'error': 402,
                'message': 'Email không hợp lệ'
            })
        }

        const result = await accountModel.getAccountByEmail(req.body.email);
        if(result.length === 0) {
            return res.status(401).json ({
                'error': 410,
                'message': 'Email không tồn tại'
            })
        }

        if(result[0].verified === true) {
            return res.status(401).json ({
                'error': 411,
                'message': 'Email đã được xác thực'
            })
        }

        const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET_SIGNUP, { expiresIn: '5m' });
        sendMail(req.body.email, `${process.env.SERVER}/verified/token/${token}`)
        res.status(200).json({
            'result': {
                'message': 'Gửi lại email xác thực thành công',
            },
        });

    } catch (e) {
        return res.status(500).json({
            message: e.message
        })
    }
})

accountRouter.get('/verified/token/:token', async (req, res) => {
    try {
        const result = jwt.verify(req.params.token, process.env.JWT_SECRET_SIGNUP);
        const getAccount = await accountModel.getAccountByEmail(result.email);

        if(getAccount.length === 0) {
            return res.status(401).send('<p>Tài khoản không tồn tại</p>');
        }

        if(getAccount[0].verified === true) {
            return res.status(401).send('<p>Tài khoản đã được xác thực</p>');
        }

        await accountModel.updateVerified(result.email);
        res.status(200).send('<p>Xác thực tài khoản thành công</p>');
        
    } catch (e) {
        if(e.name == 'TokenExpiredError') {
            return res.status(401).send('<p>Link xác thực đã hết hạn</p>');
        }

        if (e.name == 'JsonWebTokenError') {
            return res.status(401).send('<p>Link xác thực không hợp lệ</p>');
        }
        else {
            return res.status(500).json({
                'error': 300,
                'message': e.message,
            });
        }
    }
})

accountRouter.post('/login', async(req, res) => {
    try {
        if (req.body.email === null || req.body.password === null || req.body.email === '' || req.body.password === '') {
            return res.status(400).json ({
                'error': 101,
                'message': 'Không được để trống email và mật khẩu'
            })
        }

        if(validator.validate(req.body.email) === false) {
            return res.status(400).json ({
                'error': 102,
                'message': 'Email không hợp lệ'
            })
        }

        const result = await accountModel.getAccountByEmail(req.body.email)

        if (result.length === 0) {
            return res.status(401).json ({
                'error': 110,
                'message': 'Email không tồn tại'
            })
        }
        console.log(result[0]);

        let message = '';
        const compare = await bcryptjs.compare(req.body.password, result[0].password)
        if (compare === false) {
            return res.status(401).json ({
                'error': 111,
                'message': 'Email hoặc mật khẩu không đúng'
            })
        } else {
            const token = jwt.sign({ id: result[0].uuid }, process.env.JWT_SECRET, {expiresIn: "7d"});
            if(result[0].verified === true) {
                await accountModel.updateLoginTime(result[0].uuid);
                message = 'Đăng nhập thành công'
            }
            else {
                message = 'Vui lòng xác thực tài khoản'
            }
            const infoAccount = await accountModel.getAccountById(result[0].uuid);
            return res.status(200).json({
                'result': {
                    ...infoAccount,
                    'token': token,
                },
                'message': message
            });
        }
        
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
})

accountRouter.post('/createjwt', async (req, res) => {
    try {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, {expiresIn: "45s"});
        res.status(200).json({
            'result': token,
        });
    } catch (e) {
        res.status(500).json({
            message: e.message,
        });
    }
})



accountRouter.post('/verified', async (req, res) => {
    try {
        const result = jwt.verify(req.body.token, process.env.JWT_SECRET);

        res.status(200).json({
            'result': result,
        });

    } catch (e) {
        if(e.name == 'TokenExpiredError') {
            return res.status(401).json({
                'error': 101,
                'message': 'Phiên đăng nhập đã hết hạn',
            });
        }

        if (e.name == 'JsonWebTokenError') {
            return res.status(401).json({
                'error': 102,
                'message': 'Tài khoản không tồn tại',
            });
        }
        else {
            res.status(500).json({
                'error': 100,
                'message': e.message,
            });
        }
    }
})

module.exports = accountRouter;