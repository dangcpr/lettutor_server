const express = require('express');
const accountModel = require('../models/accounts');
const jwt = require('jsonwebtoken');
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