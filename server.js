const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send("Node Server is running. Yay!!");
});

io.on('connection', socket => {
    // Get the chatID of the user and join in a room of the same chatID
    const chatID = socket.handshake.query.chatID;
    socket.join(chatID);

    // Leave the room if the user closes the socket
    socket.on('disconnect', () => {
        socket.leave(chatID);
    });

    // Send message to only a particular user
    socket.on('send_message', message => {
        const receiverChatID = message.receiverChatID;
        const senderChatID = message.senderChatID;
        const content = message.content;

        // Send message to only that particular room
        socket.in(receiverChatID).emit('receive_message', {
            'content': content,
            'senderChatID': senderChatID,
            'receiverChatID': receiverChatID,
        });
    });
});

// Specify and log the port directly
const PORT = 3000; // You can replace 3000 with any port number you prefer
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
