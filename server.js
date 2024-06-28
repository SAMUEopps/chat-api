// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Dummy users data
const users = [
    { id: '1', name: 'User 1' },
    { id: '2', name: 'User 2' },
    { id: '3', name: 'User 3' },
    { id: '4', name: 'User 4' },
    { id: '5', name: 'User 5' }
];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Emit list of users when a client connects
    socket.emit('users', users);

    // Handle incoming messages
    socket.on('message', (data) => {
        console.log('Message received:', data);
        io.emit('message', data); // Broadcast message to all clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
