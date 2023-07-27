const initOptions = {};
const pgp = require("pg-promise")(initOptions);
require("dotenv").config();


const db = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: process.env.DB_SSL,
    max: process.env.DB_MAX,
}

module.exports = pgp(db);