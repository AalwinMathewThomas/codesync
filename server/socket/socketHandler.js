const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const Room = require('../models/Room');
const User = require('../models/User');

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();

  } catch (error) {
    next(new Error('Invalid token'));
  }
};

const socketHandler = (io) => {

  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    socket.on('join-room', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode })
          .populate('members.user', 'name email');

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const member = room.members.find(
          m => m.user._id.toString() === socket.userId
        );

        if (!member) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userRole = member.role;

        const user = await User.findById(socket.userId).select('name email');

        const usersRaw = await redis.get(`room:${roomCode}:users`);
        let activeUsers = usersRaw ? JSON.parse(usersRaw) : [];

        const colorIndex = activeUsers.length % CURSOR_COLORS.length;
        const userColor = CURSOR_COLORS[colorIndex];

        const userEntry = {
          socketId: socket.id,
          userId: socket.userId,
          name: user.name,
          email: user.email,
          role: member.role,
          color: userColor
        };


        activeUsers = activeUsers.filter(u => u.userId !== socket.userId);
        activeUsers.push(userEntry);


        await redis.set(`room:${roomCode}:users`, JSON.stringify(activeUsers));


        let currentCode = await redis.get(`room:${roomCode}:code`);
        if (currentCode === null) {
          currentCode = room.codeSnapshot || '';
          await redis.set(`room:${roomCode}:code`, currentCode);
        }


        socket.emit('room-state', {
          code: currentCode,
          language: room.language,
          activeUsers,
          role: member.role,
          isLocked: room.isLocked
        });


        socket.to(roomCode).emit('user-joined', {
          user: userEntry,
          activeUsers
        });

        console.log(`User ${user.name} joined room ${roomCode}`);

      } catch (error) {
        console.error('join-room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });


    socket.on('code-change', async ({ roomCode, code }) => {
      try {

        if (socket.userRole === 'viewer') return;

        const room = await Room.findOne({ code: roomCode });
        if (!room || room.isLocked) return;


        await redis.set(`room:${roomCode}:code`, code);


        socket.to(roomCode).emit('code-update', { code });

      } catch (error) {
        console.error('code-change error:', error);
      }
    });


    socket.on('cursor-move', ({ roomCode, position }) => {

      socket.to(roomCode).emit('cursor-update', {
        socketId: socket.id,
        userId: socket.userId,
        position  
      });
    });


    socket.on('language-change', async ({ roomCode, language }) => {
      try {

        if (socket.userRole !== 'owner') return;

        await Room.findOneAndUpdate(
          { code: roomCode },
          { language }
        );


        io.to(roomCode).emit('language-update', { language });

      } catch (error) {
        console.error('language-change error:', error);
      }
    });


    socket.on('lock-room', async ({ roomCode }) => {
      try {
        if (socket.userRole !== 'owner') return;

        const room = await Room.findOneAndUpdate(
          { code: roomCode },
          { isLocked: true },
          { new: true }
        );


        io.to(roomCode).emit('room-locked', { isLocked: true });

      } catch (error) {
        console.error('lock-room error:', error);
      }
    });

    socket.on('unlock-room', async ({ roomCode }) => {
      try {
        if (socket.userRole !== 'owner') return;

        await Room.findOneAndUpdate(
          { code: roomCode },
          { isLocked: false }
        );

        io.to(roomCode).emit('room-locked', { isLocked: false });

      } catch (error) {
        console.error('unlock-room error:', error);
      }
    });


    socket.on('kick-user', async ({ roomCode, targetUserId }) => {
      try {
        if (socket.userRole !== 'owner') return;


        const usersRaw = await redis.get(`room:${roomCode}:users`);
        const activeUsers = usersRaw ? JSON.parse(usersRaw) : [];
        const target = activeUsers.find(u => u.userId === targetUserId);

        if (target) {

          io.to(target.socketId).emit('kicked', {
            message: 'You have been removed from this room'
          });


          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) targetSocket.leave(roomCode);
        }


        const updatedUsers = activeUsers.filter(u => u.userId !== targetUserId);
        await redis.set(`room:${roomCode}:users`, JSON.stringify(updatedUsers));
        io.to(roomCode).emit('user-left', { userId: targetUserId, activeUsers: updatedUsers });

      } catch (error) {
        console.error('kick-user error:', error);
      }
    });

    socket.on('chat-message', async ({ roomCode, message }) => {
      try {
        const user = await User.findById(socket.userId).select('name');

        io.to(roomCode).emit('chat-message', {
          userId: socket.userId,
          name: user.name,
          message,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('chat-message error:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const roomCode = socket.roomCode;
        if (!roomCode) return;


        const usersRaw = await redis.get(`room:${roomCode}:users`);
        let activeUsers = usersRaw ? JSON.parse(usersRaw) : [];
        activeUsers = activeUsers.filter(u => u.socketId !== socket.id);


        if (activeUsers.length === 0) {
          const finalCode = await redis.get(`room:${roomCode}:code`);

          await Room.findOneAndUpdate(
            { code: roomCode },
            {
              codeSnapshot: finalCode,
              lastActive: new Date()
            }
          );


          await redis.del(`room:${roomCode}:code`);
          await redis.del(`room:${roomCode}:users`);

          console.log(`Room ${roomCode} empty — snapshot saved, Redis cleared`);

        } else {

          await redis.set(`room:${roomCode}:users`, JSON.stringify(activeUsers));


          socket.to(roomCode).emit('user-left', {
            userId: socket.userId,
            activeUsers
          });
        }

        console.log(`Socket disconnected: ${socket.id}`);

      } catch (error) {
        console.error('disconnect error:', error);
      }
    });
  });
};

module.exports = socketHandler;