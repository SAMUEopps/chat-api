
const app = require('express')()
const http = require('http').createServer(app)


app.get('/', (req, res) => {
    res.send("Node Server is running. Yay!!")
})

//Socket Logic
const socketio = require('socket.io')(http)

socketio.on("connection", (userSocket) => {
    userSocket.on("send_message", (data) => {
        userSocket.broadcast.emit("receive_message", data)
    })
})

//http.listen(process.env.PORT)

// Specify and log the port directly
const PORT = 3000; // You can replace 3000 with any port number you prefer
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
