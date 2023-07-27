const express = require('express');
const accountModel = require('../models/accounts');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
var validator = require("email-validator");
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


        await accountModel.addAccount(req.body.email, await bcryptjs.hash(req.body.password, 10))
        console.log(1)
        return res.status(200).json({
            'result': {
                'message': 'Đăng ký thành công',
            },
        });
        
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
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

        const compare = await bcryptjs.compare(req.body.password, result[0].password)
        if (compare === false) {
            return res.status(401).json ({
                'error': 111,
                'message': 'Email hoặc mật khẩu không đúng'
            })
        } else {
            const token = jwt.sign({ id: result[0].uuid }, process.env.JWT_SECRET, {expiresIn: "7d"});
            const infoAccount = await accountModel.getAccountById(result[0].uuid);
            return res.status(200).json({
                'result': {
                    ...infoAccount,
                    'token': token,
                },
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
                'error': 200,
                'message': e.message,
            });
        }
    }
})

module.exports = accountRouter;