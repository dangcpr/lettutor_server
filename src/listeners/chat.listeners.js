module.exports = function(socket, io)  {
    console.log(socket.id);
    socket.on('disconnect', () => {
        socket.broadcast.emit('message', 'Disconnected: ' + socket.id);
        console.log('user disconnected');
    });
    socket.on('message', (msg) => {
        io.emit('message', msg);
        //io.of('/chat').emit('message', msg);
        console.log(socket.id + ': ' + msg);
    });
}