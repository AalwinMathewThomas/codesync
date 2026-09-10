import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import useAuthStore from '../store/authStore';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms/my-rooms');
      setRooms(res.data.rooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/rooms/create', {
        name: roomName,
        language
      });
      navigate(`/room/${res.data.room.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/rooms/join/${joinCode.trim()}`);
      navigate(`/room/${joinCode.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    }
  };

  const LANGUAGES = [
    'javascript', 'python', 'cpp', 'java'
  ];

  const langLabel = {
    javascript: 'JavaScript',
    python: 'Python',
    cpp: 'C++',
    java: 'Java'
  };

  const langColor = {
    javascript: '#f59e0b',
    python: '#3b82f6',
    cpp: '#06b6d4',
    java: '#ef4444'
  };

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-content">

        {/* Header */}
        <div className="dashboard-header animate-fadeIn">
          <div>
            <h1 className="dashboard-title">
              Welcome back, {user?.name?.split(' ')[0] || 'Coder'} 👋
            </h1>
            <p className="dashboard-sub">
              Your collaborative coding rooms
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              className="btn-ghost"
              onClick={() => {
                setShowJoin(true);
                setShowCreate(false);
                setError('');
              }}
            >
              Join Room
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setShowCreate(true);
                setShowJoin(false);
                setError('');
              }}
            >
              + New Room
            </button>
          </div>
        </div>

        {/* Create Room Form */}
        {showCreate && (
          <div className="modal-card animate-fadeIn">
            <h2 className="modal-title">Create a new room</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="form-input"
                  placeholder="My coding session"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="form-input form-select"
                >
                  {LANGUAGES.map(l => (
                    <option key={l} value={l}>
                      {langLabel[l]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join Room Form */}
        {showJoin && (
          <div className="modal-card animate-fadeIn">
            <h2 className="modal-title">Join a room</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleJoin} className="modal-form">
              <div className="form-group">
                <label className="form-label">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase())
                  }
                  className="form-input form-code"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowJoin(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Join Room
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms Grid */}
        {loading ? (
          <div className="rooms-loading">
            <span className="btn-spinner" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rooms-empty animate-fadeIn">
            <span className="empty-icon">{'{ }'}</span>
            <h3>No rooms yet</h3>
            <p>Create your first room to start collaborating</p>
          </div>
        ) : (
          <div className="rooms-grid animate-fadeIn">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="room-card"
                onClick={() => navigate(`/room/${room.code}`)}
              >
                <div className="room-card-header">
                  <span
                    className="room-lang-badge"
                    style={{
                      background: `${langColor[room.language]}20`,
                      color: langColor[room.language],
                      borderColor: `${langColor[room.language]}40`
                    }}
                  >
                    {langLabel[room.language] || room.language}
                  </span>

                  {room.isLocked && (
                    <span className="room-locked-badge">🔒 Locked</span>
                  )}
                </div>

                <h3 className="room-name">{room.name}</h3>

                <div className="room-meta">
                  <span className="room-code">#{room.code}</span>
                  <span className="room-members">
                    {room.members?.length || 0} member
                    {room.members?.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="room-owner">
                  by {room.owner?.name || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;