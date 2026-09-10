const Room = require('../models/Room');
const redis = require('../config/redis');


const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createRoom = async (req, res) => {
  try {
    const { name, language } = req.body;
    const userId = req.user.userId;

    let code;
    let exists = true;
    while (exists) {
      code = generateRoomCode();
      exists = await Room.findOne({ code });
    }

    const room = await Room.create({
      name,
      language: language || 'javascript',
      code,
      owner: userId,
      members: [{ user: userId, role: 'owner' }]
    });


    await redis.set(`room:${code}:code`, '');
    await redis.set(`room:${code}:users`, JSON.stringify([]));

    res.status(201).json({
      message: 'Room created',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        language: room.language,
        isLocked: room.isLocked
      }
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const joinRoom = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const userId = req.user.userId;

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isLocked) {
      return res.status(403).json({ message: 'Room is locked' });
    }


    const isMember = room.members.some(
      m => m.user.toString() === userId
    );

    if (!isMember) {
      room.members.push({ user: userId, role: 'editor' });
      await room.save();
    }


    const currentCode = await redis.get(`room:${code}:code`) || '';

    res.json({
      message: 'Joined room',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        language: room.language,
        isLocked: room.isLocked,
        currentCode
      }
    });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await Room.find({
      'members.user': userId
    })
    .populate('owner', 'name email')
    .sort({ lastActive: -1 });

    res.json({ rooms });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const kickMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.body;
    const requesterId = req.user.userId;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }


    if (room.owner.toString() !== requesterId) {
      return res.status(403).json({ message: 'Only owner can kick members' });
    }


    if (targetUserId === requesterId) {
      return res.status(400).json({ message: 'Cannot kick yourself' });
    }

    room.members = room.members.filter(
      m => m.user.toString() !== targetUserId
    );

    await room.save();

    res.json({ message: 'Member kicked' });

  } catch (error) {
    console.error('Kick error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.userId;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.owner.toString() !== requesterId) {
      return res.status(403).json({ message: 'Only owner can lock room' });
    }

    room.isLocked = !room.isLocked;
    await room.save();

    res.json({
      message: room.isLocked ? 'Room locked' : 'Room unlocked',
      isLocked: room.isLocked
    });

  } catch (error) {
    console.error('Lock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getMyRooms,
  kickMember,
  toggleLock
};