const jwt = require('jsonwebtoken');

module.exports = {
    auth: (req, res, next) => {
        //using access và refresh token
        const access_token = req.cookies['access-token'];

        if (!access_token) {
            return res.status(401).json({
                message: 'Access token not found',
            });
        }
        else {
            const decoded = jwt.verify(access_token, process.env.JWT_SECRET, (err, decoded) => {;
            //check lỗi
                if(err) {
                    if (err.name === 'TokenExpiredError') {
                        return res.status(401).json({
                            message: 'Access token expired',
                        });
                    }

                    if(err.name === 'JsonWebTokenError') {
                        return res.status(401).json({
                            message: 'Invalid access token',
                        });
                    }
                }
                else {
                    req.email = decoded.email;
                    next();
                }
            })
        }
    },
}