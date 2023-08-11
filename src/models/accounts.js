const conn = require('../config/db')
const bcryptjs = require('bcryptjs');

module.exports = {
    getAccount : () => {
        try {
            return conn.any('SELECT * FROM "ACCOUNTS"');
        } catch (error) {
            throw error;
        }
    },

    getAccountById: (uuid) => {
        try {
            return conn.one('SELECT * FROM "ACCOUNTS" WHERE "uuid" = ${uuid}', {
                uuid: uuid
            })
        } catch (error) {
            throw error;
        }
    },

    getAccountByEmail: (email) => {
        try {
            return conn.any('SELECT * FROM "ACCOUNTS" WHERE "email" = ${email}', {
                email: email,
            })
        } catch (error) {
            throw error;
        }
    },

    addAccount : (email, password) => {
        try {
            return conn.any('INSERT INTO "ACCOUNTS" ("email", "password") VALUES (${email}, ${password})', {
                email: email,
                password: password,
            });
        } catch (error) {
            throw error;
        }
    },

    updateLoginTime: (uuid) => {
        try {
            return conn.any('UPDATE "ACCOUNTS" SET "last_login" = NOW() WHERE "uuid" = ${uuid}', {
                uuid: uuid,
            })
        } catch (error) {
            throw error;
        }
    },

    updateVerified: (email) => {
        try {
            return conn.any('UPDATE "ACCOUNTS" SET "verified" = TRUE WHERE "email" = ${email}', {
                email: email,
            })
        } catch (error) {
            throw error;
        }
    }
} 
