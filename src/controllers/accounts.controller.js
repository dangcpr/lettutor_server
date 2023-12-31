const accountModel = require('../models/accounts');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
var validator = require("email-validator");
const { sendMail } = require('../helpers');
const cloudinary = require('../config/cloud');
const uploader = require('../middlewares/uploader.js');
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
            if (req.body.email == null || req.body.password == null || req.body.rePassword == null || req.body.email === '' || req.body.password === '' || req.body.rePassword === '') {
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
            if(req.body.email == null || req.body.email === '') {
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

    registerInfomation: async (req, res) => {
        try {
            if (req.body.email == null || req.body.email === '' || req.body.password == null || req.body.password === '') {
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

            const result = await accountModel.getAccountByEmail(req.body.email);
            if (result.length == 0) {
                return res.status(401).json ({
                    'error': 212,
                    'message': 'Email hoặc mật khẩu không đúng'
                })
            }
            const checkPassword = await bcryptjs.compare(req.body.password, result[0].password);
            if (checkPassword === false) {
                return res.status(401).json ({
                    'error': 212,
                    'message': 'Email hoặc mật khẩu không đúng'
                })
            }
            if (result[0].verified === false) {
                return res.status(401).json ({
                    'error': 213,
                    'message': 'Email chưa được xác thực, vui lòng xác thực email trước khi đăng kí thông tin'
                })
            }
            if(result[0].last_login != null) {
                return res.status(401).json ({
                    'error': 214,
                    'message': 'Tài khoản đã được đăng kí thông tin'
                })
            }

            //Check Valid form
            if (req.body.name == null || req.body.name === '') {
                return res.status(400).json ({
                    'error': 221,
                    'message': 'Không được để trống tên'
                })
            }
            if (req.body.phone == null || req.body.phone === '') {
                return res.status(400).json ({
                    'error': 222,
                    'message': 'Không được để trống số điện thoại'
                })
            }
            if(req.body.country == null || req.body.country === '') {
                return res.status(400).json ({
                    'error': 224,
                    'message': 'Không được để trống địa chỉ'
                })
            }
            if(req.body.level == null || req.body.level === '') {
                return res.status(400).json ({
                    'error': 225,
                    'message': 'Không được để trống cấp độ'
                })
            }        
            if(req.body.learn == null || req.body.learn === []) {
                return res.status(400).json ({
                    'error': 226,
                    'message': 'Không được để trống ngành học'
                })
            } 
            if(req.body.DOB == null || req.body.DOB === '') {
                return res.status(400).json ({
                    'error': 227,
                    'message': 'Không được để trống ngày sinh'
                })
            }

            //upload avatar (nếu null thì xóa ảnh, nếu không thì upload ảnh mới)
            let uuid, link_avatar = null;
            uuid = await accountModel.getIDbyEmail(req.body.email);
            if(req.file != undefined) {
                console.log(uuid.uuid);
                const upload = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'lettutor/avatar', public_id: uuid.uuid}); 
                link_avatar = upload.secure_url;
                await accountModel.updateInfomation(req.body.email, upload.secure_url, req.body.name, req.body.country, req.body.phone, req.body.DOB, req.body.level, req.body.learn);     
            } else {
                await accountModel.updateInfomation(req.body.email, null, req.body.name, req.body.country, req.body.phone, req.body.DOB, req.body.level, req.body.learn);
                cloudinary.v2.api.delete_resources([`avatar/${uuid.uuid}`], { type: 'upload', resource_type: 'image' }).then((error, result) => {
                    if(error) {
                        return res.status(404).json({
                            message: error.message
                        })
                    }
                });
            }

            //update last_login
            await accountModel.updateLoginTime(result[0].uuid);

            res.status(200).json({
                'result': {
                    'message': 'Đăng ký thông tin thành công',
                    'link': link_avatar,
                },
            });
        } catch (e) {
            return res.status(500).json({
                message: e.message
            })
       } 
    },

    updateInfomation: async (req, res) => {
        try {
            const result = await accountModel.getAccountById(req.id)
            console.log(result);

            //check have result or not
            if (result.length == 0) {
                return res.status(401).json ({
                    'error': 212,
                    'message': 'Email không tồn tại'
                })
            }
            if (result.verified === false) {
                return res.status(401).json ({
                    'error': 213,
                    'message': 'Email chưa được xác thực, vui lòng xác thực email trước khi đăng kí thông tin'
                })
            }

            //Check Valid form
            if (req.body.name == null || req.body.name === '') {
                return res.status(400).json ({
                    'error': 221,
                    'message': 'Không được để trống tên'
                })
            }
            if (req.body.phone == null || req.body.phone === '') {
                return res.status(400).json ({
                    'error': 222,
                    'message': 'Không được để trống số điện thoại'
                })
            }
            if(req.body.country == null || req.body.country === '') {
                return res.status(400).json ({
                    'error': 224,
                    'message': 'Không được để trống địa chỉ'
                })
            }
            if(req.body.level == null || req.body.level === '') {
                return res.status(400).json ({
                    'error': 225,
                    'message': 'Không được để trống cấp độ'
                })
            }        
            if(req.body.learn == null || req.body.learn === []) {
                return res.status(400).json ({
                    'error': 226,
                    'message': 'Không được để trống ngành học'
                })
            } 
            if(req.body.DOB == null || req.body.DOB === '') {
                return res.status(400).json ({
                    'error': 227,
                    'message': 'Không được để trống ngày sinh'
                })
            }

            //upload avatar (nếu null thì xóa ảnh, nếu không thì upload ảnh mới)
            let link_avatar = null;

            if(req.file != undefined) {

                const upload = await cloudinary.v2.uploader.upload(req.file.path, {folder: 'lettutor/avatar', public_id: req.id}); 
                link_avatar = upload.secure_url;
                await accountModel.updateInfomation(result.email, upload.secure_url, req.body.name, req.body.country, req.body.phone, req.body.DOB, req.body.level, req.body.learn);     
            } else {
                await accountModel.updateInfomation(result.email, null, req.body.name, req.body.country, req.body.phone, req.body.DOB, req.body.level, req.body.learn);
                cloudinary.v2.api.delete_resources([`avatar/${req.id}`], { type: 'upload', resource_type: 'image' }).then((error, result) => {
                    if(error) {
                        return res.status(404).json({
                            message: error.message
                        })
                    }
                });
            }

            res.status(200).json({
                'result': {
                    'message': 'Cập nhật thông tin thành công',
                    'link': link_avatar,
                },
            });
        } catch (e) {
            return res.status(500).json({
                message: e.message
            })
       } 
    },

    deleteAvatar: async (req, res) => {
        try {
            cloudinary.v2.api.delete_resources([`lettutor/avatar/${req.id}`], { type: 'upload', resource_type: 'image' }).then((error, result) => {
                if(error) {
                    return res.status(404).json({
                        message: error.message
                    })
                }
            });
            await accountModel.updateAvatarById(req.id, null);
            res.status(200).json({
                'result': 'Xóa thành công',
            });
        } catch (e) {
            return res.status(500).json({
                message: e.message
            })
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
            if(refreshToken == null || refreshToken === '') {
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
            if (refreshToken == null || refreshToken === '') {
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

    temp : async (req, res) => {
        try {
            return res.status(200).json({
                'result': req.body.email,
            });
        } catch (e) {
            return res.status(500).json({
                message: e.message
            })
        }
    }
}