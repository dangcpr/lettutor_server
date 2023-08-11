const accountModel = require('../models/accounts');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
var validator = require("email-validator");
const { sendMail } = require('../helpers');
require('dotenv').config();
//Dùng cookies

module.exports = {
    getAllAccount: async (req, res, next) => {
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
    },

    signUp: async(req, res) => {
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
            sendMail(req.body.email, `${process.env.SERVER}/account/verified/token/${token}`)
            
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
    },

    resendToken: async (req, res) => {
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
            sendMail(req.body.email, `${process.env.SERVER}/account/verified/token/${token}`)
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
    },

    verifiedTokenSignup: async (req, res) => {
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
    },

    login: async(req, res) => {
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
                    'error': 111,
                    'message': 'Email hoặc mật khẩu không đúng'
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
                const access_token = jwt.sign({ id: result[0].uuid }, process.env.JWT_SECRET, {expiresIn: "10m"});
                const refresh_token = jwt.sign({ id: result[0].uuid }, process.env.JWT_SECRET_REFRESH, {expiresIn: "1y"});

                res.clearCookie('access-token');
                res.clearCookie('refresh-token');

                if(result[0].verified === true) {
                    if(result[0].last_login === null) {
                        message = 'Vui lòng đăng ký thông tin chính chủ'
                    }
                    else {
                        await accountModel.updateLoginTime(result[0].uuid);
                        res.cookie('access-token', access_token, { maxAge: 10 * 60 * 1000, httpOnly: true });
                        res.cookie('refresh-token', refresh_token, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
                        message = 'Đăng nhập thành công'
                    }
                }
                else {
                    message = 'Vui lòng xác thực tài khoản'
                }
                const infoAccount = await accountModel.getAccountById(result[0].uuid);
                
                return res.status(200).json({
                    'result': {
                        ...infoAccount,
                    },
                    'message': message
                });
            }
            
        } catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    autoLogin: (req, res) => {
        try {
            const refreshToken = req.cookies['refresh-token'];
            if(refreshToken === null || refreshToken === '') {
                return res.status(401).json({
                    'error': 601,
                    'message': 'Không có token'
                })
            }
            else {
                jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, (err, result) => {
                    if(err) {
                        if(err.name === 'TokenExpiredError') {
                            return res.status(401).json({
                                'error': 602,
                                'message': 'Phiên đăng nhập đã hết hạn'
                            })
                        }
                        
                        if(err.name === 'JsonWebTokenError') {
                            return res.status(401).json({
                                'error': 603,
                                'message': 'Token không tồn tại'
                            })
                        }
                    }
                    else {
                        return res.status(200).json({
                            'message': 'Đăng nhập thành công'
                        })
                    }
                })
            }
        } catch (e) {
            return res.status(500).json({
                message: e.message
            })
        }
    },

    refreshToken: async (req, res) => {
        try {
            const refreshToken = req.cookies['refresh-token'];
            if (refreshToken === null || refreshToken === '') {
                return res.status(401).json({
                    'error': 501,
                    'message': 'Không có token'
                })
            }
            else {
                jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, (err, result) => {
                    if(err) {
                        if (err.name === 'TokenExpiredError') {
                            return res.status(401).json({
                                'error': 502,
                                'message': 'Token hết hạn'
                            })
                        }

                        if(err.name === 'JsonWebTokenError') {
                            return res.status(401).json({
                                'error': 503,
                                'message': 'Token không hợp lệ'
                            })
                        }
                    }
                    else {
                        const newAccessToken = jwt.sign({ id: result.id }, process.env.JWT_SECRET, { expiresIn: "30s" });
                        res.cookie('access-token', newAccessToken, { maxAge: 10 * 60 * 1000, httpOnly: true });
                        return res.status(200).json({
                            'status': 'success',
                            'access_token': newAccessToken
                        })
                    }
                })
            }
        }
        catch (e) {
            res.status(500).json({
                'error': 500,
                'message': e.message
            })
        }
    },

    logout: (req, res) => {
        try {
            res.clearCookie('access-token');
            res.clearCookie('refresh-token');
            return res.status(200).json({
                'message': 'Đăng xuất thành công'
            })
        } catch (e) {
            return res.status(500).json({
                message: e.message
            })
        }
    },
}