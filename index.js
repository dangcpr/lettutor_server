const express = require('express');
const app = express();
const accountRouter = require('./controllers/accounts');
require('dotenv').config();
const cors = require("cors");

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(accountRouter);


app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
});


/*
app.get('/', async (req, res) =>  {
    try {
        let queryResult = await db.any('SELECT * FROM "ACCOUNTS"');
        // let queryResult = await db.any('INSERT INTO "TEACHERS" ("uuid", "categories") VALUES (${uuid}, ${categories})', {
            // uuid: '53cdca2c-3633-4d93-9b03-55ffdb8e5b1b',
            // categories: ['PET', 'KET', 'FCE'],
        // });

        for (let i = 0; i < queryResult.length; i++) {
            await db.none('UPDATE "ACCOUNTS" SET "password" = ${password} WHERE "uuid" = ${uuid}', {
                password: await bcryptjs.hash(queryResult[i].password, 10),
                uuid: queryResult[i].uuid,
            });
        }
     
        queryResult = await db.any('SELECT * FROM "ACCOUNTS"')
        //queryResult = helpers.deleteNullList(queryResult);

        res.status(200).json({
            result: queryResult,
        });
    } catch (e) {
        res.status(500).json({
            message: e.message,
        });
    }
});
*/
