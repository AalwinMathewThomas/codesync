import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useRoomStore from '../store/roomStore';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';
import './Room.css';

// Language display config
const LANG_CONFIG = {
  javascript: { label: 'JavaScript', monaco: 'javascript', color: '#f59e0b' },
  python:     { label: 'Python',     monaco: 'python',     color: '#3b82f6' },
  cpp:        { label: 'C++',        monaco: 'cpp',        color: '#06b6d4' },
  java:       { label: 'Java',       monaco: 'java',       color: '#ef4444' },
};

const CURSOR_COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4',
  '#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F'
];

const Room = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const {
    setRoom, setActiveUsers, setCode, setLanguage,
    setLocked, setOutput, setRunning, addChatMessage,
    clearRoom, currentCode, language, isLocked,
    activeUsers, output, isRunning, chatMessages
  } = useRoomStore();

  // Refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isRemoteChange = useRef(false);
  const chatBottomRef = useRef(null);

  // Local state
  const [roomData, setRoomData] = useState(null);
  const [myRole, setMyRole] = useState('editor');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState('output');
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [remoteCursors, setRemoteCursors] = useState({});

  // ── SOCKET SETUP ──────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);

    socket.emit('join-room', { roomCode: code });

    // Room state on join
    socket.on('room-state', (data) => {
      setCode(data.code || '');
      setLanguage(data.language || 'javascript');
      setLocked(data.isLocked || false);
      setActiveUsers(data.activeUsers || []);
      setMyRole(data.role);
      setLoading(false);
      setConnected(true);
    });

    // Someone else changed the code
    socket.on('code-update', ({ code: newCode }) => {
      isRemoteChange.current = true;
      setCode(newCode);
    });

    // Cursor updates from others
    socket.on('cursor-update', ({ socketId, userId, position }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [socketId]: { userId, position }
      }));
    });

    // User joined
    socket.on('user-joined', ({ activeUsers }) => {
      setActiveUsers(activeUsers);
    });

    // User left
    socket.on('user-left', ({ activeUsers }) => {
      setActiveUsers(activeUsers);
    });

    // Language changed
    socket.on('language-update', ({ language }) => {
      setLanguage(language);
    });

    // Room locked/unlocked
    socket.on('room-locked', ({ isLocked }) => {
      setLocked(isLocked);
    });

    // Kicked
    socket.on('kicked', ({ message }) => {
      alert(message);
      navigate('/dashboard');
    });

    // Chat
    socket.on('chat-message', (msg) => {
      addChatMessage(msg);
    });

    // Error
    socket.on('error', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    return () => {
      socket.off('room-state');
      socket.off('code-update');
      socket.off('cursor-update');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('language-update');
      socket.off('room-locked');
      socket.off('kicked');
      socket.off('chat-message');
      socket.off('error');
      disconnectSocket();
      clearRoom();
    };
  }, [code, accessToken]);

  // ── FETCH ROOM INFO ───────────────────────────────────────
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.post(`/rooms/join/${code}`);
        setRoomData(res.data.room);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load room');
        setLoading(false);
      }
    };
    fetchRoom();
  }, [code]);

  // ── AUTO SCROLL CHAT ──────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── UPDATE MONACO WHEN REMOTE CODE CHANGES ────────────────
  useEffect(() => {
    if (!editorRef.current || !isRemoteChange.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const currentValue = model.getValue();
    if (currentValue !== currentCode) {
      const position = editorRef.current.getPosition();
      model.setValue(currentCode);
      if (position) editorRef.current.setPosition(position);
    }
    isRemoteChange.current = false;
  }, [currentCode]);

  // ── UPDATE REMOTE CURSOR DECORATIONS ─────────────────────
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const newDecorations = Object.entries(remoteCursors).map(
      ([socketId, { userId, position }]) => {
        const userInfo = activeUsers.find(u => u.socketId === socketId);
        const color = userInfo?.color || '#ffffff';
        const name = userInfo?.name || 'User';

        return {
          range: new monacoRef.current.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            className: 'remote-cursor',
            beforeContentClassName: `remote-cursor-line`,
            hoverMessage: { value: name },
            stickiness: 1,
            zIndex: 100,
            before: {
              content: ' ',
              inlineClassName: `cursor-${socketId.slice(0, 6)}`
            }
          }
        };
      }
    );

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [remoteCursors, activeUsers]);

  // ── EDITOR HANDLERS ───────────────────────────────────────
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track cursor position for status bar
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column
      });

      // Emit cursor to others
      const socket = getSocket();
      if (socket) {
        socket.emit('cursor-move', {
          roomCode: code,
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column
          }
        });
      }
    });
  };

  // Debounce ref for code changes
  const debounceRef = useRef(null);

  const handleCodeChange = useCallback((value) => {
    if (isRemoteChange.current) return;
    if (myRole === 'viewer' || isLocked) return;

    setCode(value || '');

    // Debounce emit at 150ms
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const socket = getSocket();
      if (socket) {
        socket.emit('code-change', {
          roomCode: code,
          code: value || ''
        });
      }
    }, 150);
  }, [code, myRole, isLocked]);

  // ── LANGUAGE CHANGE ───────────────────────────────────────
  const handleLanguageChange = (newLang) => {
    if (myRole !== 'owner') return;
    setLanguage(newLang);
    const socket = getSocket();
    if (socket) {
      socket.emit('language-change', {
        roomCode: code,
        language: newLang
      });
    }
  };

  // ── RUN CODE ──────────────────────────────────────────────
  const handleRun = async () => {
    setRunning(true);
    setOutput('');
    setActiveTab('output');

    try {
      const res = await api.post('/execute', {
        language,
        code: currentCode,
        stdin
      });

      const result = res.data;
      let displayOutput = '';

      if (result.output) displayOutput += result.output;
      if (result.error) displayOutput += '\n' + result.error;

      setOutput(
        displayOutput.trim() ||
        '(no output)'
      );

    } catch (err) {
      setOutput(
        err.response?.data?.error ||
        'Execution service unavailable.\nRun locally with docker-compose up.'
      );
    } finally {
      setRunning(false);
    }
  };

  // ── LOCK TOGGLE ───────────────────────────────────────────
  const handleLockToggle = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(isLocked ? 'unlock-room' : 'lock-room', {
      roomCode: code
    });
  };

  // ── CHAT SEND ─────────────────────────────────────────────
  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('chat-message', {
        roomCode: code,
        message: chatInput.trim()
      });
    }
    setChatInput('');
  };

  // ── COPY ROOM CODE ────────────────────────────────────────
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── LOADING / ERROR STATES ────────────────────────────────
  if (loading) {
    return (
      <div className="room-loading">
        <span className="btn-spinner large-spinner" />
        <p>Connecting to room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-error">
        <h2>Failed to join room</h2>
        <p>{error}</p>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isReadOnly = myRole === 'viewer' || isLocked;
  const langCfg = LANG_CONFIG[language] || LANG_CONFIG.javascript;

  return (
    <div className="room">

      {/* ── TOP TOOLBAR ── */}
      <div className="room-toolbar">

        {/* Left — Logo + Room code */}
        <div className="toolbar-left">
          <span className="toolbar-logo">{'</>'}</span>

          <button
            className="room-code-btn"
            onClick={handleCopyCode}
            title="Click to copy"
          >
            <span className="room-code-label">Room:</span>
            <span className="room-code-value">#{code}</span>
            <span className="copy-hint">
              {copied ? '✓ Copied' : 'Copy'}
            </span>
          </button>
        </div>

        {/* Center — Language selector */}
        <div className="toolbar-center">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="lang-select"
            disabled={myRole !== 'owner'}
            style={{ borderColor: langCfg.color + '60' }}
          >
            {Object.entries(LANG_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        {/* Right — Users, Lock, Run */}
        <div className="toolbar-right">

          {/* Active users */}
          <div className="toolbar-users">
            {activeUsers.slice(0, 4).map((u) => (
              <div
                key={u.socketId}
                className="toolbar-avatar"
                style={{ background: u.color }}
                title={u.name}
              >
                {u.name?.charAt(0).toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 4 && (
              <div className="toolbar-avatar-more">
                +{activeUsers.length - 4}
              </div>
            )}
          </div>

          {/* Lock button (owner only) */}
          {myRole === 'owner' && (
            <button
              className={`lock-btn ${isLocked ? 'locked' : ''}`}
              onClick={handleLockToggle}
              title={isLocked ? 'Unlock room' : 'Lock room'}
            >
              {isLocked ? '🔒' : '🔓'}
            </button>
          )}

          {/* Run button */}
          <button
            className="run-btn"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <span className="btn-spinner small-spinner" />
                Running...
              </>
            ) : (
              <>▶ Run</>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="room-body">

        {/* ── LEFT SIDEBAR ── */}
        <div className="room-sidebar">

          {/* Files */}
          <div className="sidebar-section">
            <span className="sidebar-label">FILES</span>
            <div className="file-item active">
              <span className="file-icon">📄</span>
              <span className="file-name">
                solution.{
                  language === 'javascript' ? 'js' :
                  language === 'python' ? 'py' :
                  language === 'cpp' ? 'cpp' : 'java'
                }
              </span>
            </div>
          </div>

          {/* Users */}
          <div className="sidebar-section">
            <span className="sidebar-label">
              USERS ONLINE ({activeUsers.length})
            </span>
            <div className="users-list">
              {activeUsers.map((u) => (
                <div key={u.socketId} className="user-item">
                  <span
                    className="user-status-dot"
                    style={{ background: u.color }}
                  />
                  <span className="user-name">
                    {u.userId === user?.id ? 'You' : u.name}
                  </span>
                  <span className="user-role-badge">
                    {u.role}
                  </span>
                  {/* Kick button for owner */}
                  {myRole === 'owner' &&
                   u.userId !== user?.id && (
                    <button
                      className="kick-btn"
                      onClick={() => {
                        const socket = getSocket();
                        if (socket) {
                          socket.emit('kick-user', {
                            roomCode: code,
                            targetUserId: u.userId
                          });
                        }
                      }}
                      title="Kick user"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Room info */}
          <div className="sidebar-section sidebar-bottom">
            <div className="room-info-item">
              <span className="info-label">Your role</span>
              <span
                className={`role-badge role-${myRole}`}
              >
                {myRole}
              </span>
            </div>
            {isLocked && (
              <div className="locked-notice">
                🔒 Room is locked
              </div>
            )}
            <button
              className="leave-btn"
              onClick={() => navigate('/dashboard')}
            >
              ← Leave Room
            </button>
          </div>
        </div>

        {/* ── EDITOR CENTER ── */}
        <div className="room-editor">
          {/* Read-only banner */}
          {isReadOnly && (
            <div className="readonly-banner">
              {isLocked
                ? '🔒 Room is locked — read only'
                : '👁 You are a viewer — read only'
              }
            </div>
          )}

          <Editor
            height="100%"
            language={langCfg.monaco}
            value={currentCode}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              readOnly: isReadOnly,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              wordWrap: 'off',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="room-right">

          {/* Tabs */}
          <div className="right-tabs">
            <button
              className={`right-tab ${activeTab === 'output' ? 'active' : ''}`}
              onClick={() => setActiveTab('output')}
            >
              Output
            </button>
            <button
              className={`right-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
              {chatMessages.length > 0 && activeTab !== 'chat' && (
                <span className="chat-badge">
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>

          {/* Output panel */}
          {activeTab === 'output' && (
            <div className="output-panel">
              <div className="output-header">
                <span className={`output-dot ${isRunning ? 'running' : output ? 'done' : ''}`} />
                <span className="output-title">
                  {isRunning ? 'Running...' : 'Output'}
                </span>
              </div>

              <pre className="output-content">
                {output || 'Click ▶ Run to execute your code'}
              </pre>

              {/* Stdin input */}
              <div className="stdin-section">
                <label className="stdin-label">
                  Standard Input (stdin)
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="stdin-input"
                  placeholder="Enter input for your program..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Chat panel */}
          {activeTab === 'chat' && (
            <div className="chat-panel">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`chat-message ${
                        msg.userId === user?.id ? 'own' : ''
                      }`}
                    >
                      <div className="chat-meta">
                        <span className="chat-name">
                          {msg.userId === user?.id
                            ? 'You'
                            : msg.name
                          }
                        </span>
                        <span className="chat-time">
                          {new Date(msg.timestamp)
                            .toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                        </span>
                      </div>
                      <div className="chat-text">
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              <form
                onSubmit={handleChatSend}
                className="chat-form"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="chat-input"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="chat-send"
                  disabled={!chatInput.trim()}
                >
                  ↑
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="room-statusbar">
        <div className="status-left">
          <span
            className={`status-dot ${connected ? 'connected' : 'disconnected'}`}
          />
          <span className="status-text">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="status-sep">·</span>
          <span className="status-text">
            {activeUsers.length} user
            {activeUsers.length !== 1 ? 's' : ''}
          </span>
          <span className="status-sep">·</span>
          <span className="status-text">Room #{code}</span>
        </div>

        <div className="status-right">
          <span className="status-text">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="status-sep">·</span>
          <span className="status-text">{langCfg.label}</span>
          <span className="status-sep">·</span>
          <span className="status-text">UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default Room;