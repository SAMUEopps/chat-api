const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Message = require('./models/Message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const mongoURI = process.env.MONGO_URI;

// CORS configuration
const corsOptions = {
  origin: 'https://chat-api-7nm5.onrender.com', // Replace with your frontend URL if different
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', async ({ username, tag }) => {
    let user = await User.findOne({ username, tag });
    if (!user) {
      user = new User({ username, tag });
      await user.save();
    }
    socket.user = user; // Attach user to the socket instance
    userSockets.set(user._id.toString(), socket.id);
    io.emit('userJoined', { username, tag });
  });

  socket.on('message', async ({ senderUsername, senderTag, recipientUsername, recipientTag, content }) => {
    const sender = await User.findOne({ username: senderUsername, tag: senderTag });
    const recipient = await User.findOne({ username: recipientUsername, tag: recipientTag });

    if (sender && recipient) {
      const message = new Message({ sender: sender._id, recipient: recipient._id, content });
      await message.save();

      // Emit message to sender and recipient
      io.to(userSockets.get(sender._id.toString())).emit('message', {
        senderUsername,
        recipientUsername,
        content,
        timestamp: message.timestamp,
      });
      io.to(userSockets.get(recipient._id.toString())).emit('message', {
        senderUsername,
        recipientUsername,
        content,
        timestamp: message.timestamp,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (socket.user) {
      userSockets.delete(socket.user._id.toString());
    }
  });
});

app.post('/register', async (req, res) => {
  const { username, tag } = req.body;
  try {
    let user = await User.findOne({ username, tag });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = new User({ username, tag });
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, tag } = req.body;
  const user = await User.findOne({ username, tag });
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

server.listen(4000, () => console.log('Server running on port 4000'));
