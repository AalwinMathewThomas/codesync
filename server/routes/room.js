const express = require('express');
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getMyRooms,
  kickMember,
  toggleLock
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

// All room routes are protected
router.post('/create', protect, createRoom);
router.post('/join/:code', protect, joinRoom);
router.get('/my-rooms', protect, getMyRooms);
router.patch('/:id/kick', protect, kickMember);
router.patch('/:id/lock', protect, toggleLock);

module.exports = router;