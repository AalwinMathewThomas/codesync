require('dotenv').config();   

const express = require('express');
const http = require('http');   
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true               // allows cookies to be sent
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());            // parses incoming JSON bodies
app.use(cookieParser());            // parses cookies from requests

// Test route — just to confirm server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'CodeSync server is running' });
});

// Socket.IO placeholder — we'll fill this in Layer 5
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Start everything
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});