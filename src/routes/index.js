const accountRouter = require("./accounts.route")

function route(app) {
    app.use('/account', accountRouter);
}

module.exports = route;