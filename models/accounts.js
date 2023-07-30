const conn = require('../config/db')
const bcryptjs = require('bcryptjs');

module.exports = {
    getAccount : () => {
        return conn.any('SELECT * FROM "ACCOUNTS"');
    },

    getAccountById: (uuid) => {
        return conn.one('SELECT * FROM "ACCOUNTS" WHERE "uuid" = ${uuid}', {
            uuid: uuid
        })
    },

    getAccountByEmail: (email) => {
        return conn.any('SELECT "uuid", "email", "password", "verified", "verified_phone" FROM "ACCOUNTS" WHERE "email" = ${email}', {
            email: email,
        })
    },

    addAccount : (email, password) => {
        return conn.any('INSERT INTO "ACCOUNTS" ("email", "password") VALUES (${email}, ${password})', {
            email: email,
            password: password,
        });
    },

    updateLoginTime: (uuid) => {
        return conn.any('UPDATE "ACCOUNTS" SET "last_login" = NOW() WHERE "uuid" = ${uuid}', {
            uuid: uuid,
        })
    },

    updateVerified: (email) => {
        return conn.any('UPDATE "ACCOUNTS" SET "verified" = TRUE WHERE "email" = ${email}', {
            email: email,
        })
    }
} 
