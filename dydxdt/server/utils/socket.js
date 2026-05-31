/**
 * Socket.IO setup for Dy/Dx/Dt Trading Club
 * Real-time: comments, likes, new posts
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`📢 Club socket: ${socket.user?.name} connected`);

    // Join a post's comment room
    socket.on('joinPost', (postId) => {
      socket.join(`post:${postId}`);
    });

    // Leave a post's comment room
    socket.on('leavePost', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Join global club feed room
    socket.join('club:feed');

    // Broadcast new post to all feed subscribers
    socket.on('broadcastPost', (post) => {
      socket.to('club:feed').emit('newPost', post);
    });

    socket.on('disconnect', () => {
      console.log(`📢 Club socket: ${socket.user?.name} disconnected`);
    });
  });

  return io;
};

module.exports = setupSocket;
