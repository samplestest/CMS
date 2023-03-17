module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Socket: client connected');
        socket.on('joinNotifications', (params, cb) => {
            socket.join(params.sender)
            cb()
        })
        socket.on('sendNotifications', (request) => {
            io.to(request.reciever).emit('recieveNotifications', "ooooooooooooo")
        })
    })
}