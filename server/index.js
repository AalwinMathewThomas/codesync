require('dotenv').config();   

const express = require('express');
const http = require('http');   
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const startSnapshotJob = require('./jobs/snapshotJob');
const socketHandler = require('./socket/socketHandler');
const executeRoutes = require('./routes/execute');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true             
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());          
app.use(cookieParser());          
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execute', executeRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'CodeSync server is running' });
});


socketHandler(io);


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  startSnapshotJob();
});