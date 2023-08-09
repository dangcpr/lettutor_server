const express = require('express');
const app = express();
const route = require('./routes/index.js');
var cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require("cors");

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

route(app);

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
});

