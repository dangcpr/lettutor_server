const chat = require('./chat.listeners');

module.exports = function(io) {
    io.on('connection', (socket) => chat(socket, io));
    //io.of('/chat').on('connection', (socket) => chat(socket, io));
}