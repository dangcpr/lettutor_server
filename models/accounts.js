const conn = require('../config/db')

module.exports = {
    getAccount : () => {
        return conn.any('SELECT * FROM "ACCOUNTS"');
    }
} 
