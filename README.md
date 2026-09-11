# </> CodeSync

A real-time collaborative code editor built for pair programming and technical interviews. Multiple users can join a shared room, write and edit code together live, and communicate via built-in chat.

**Live Demo → [codesync-ruby.vercel.app](https://codesync-ruby.vercel.app)**  
**Demo Video → [[add your video link here](https://jumpshare.com/s/FW1g712XXpMdfP4PXH8b)]**

![CodeSync Editor](add-your-screenshot-here.png)
<img width="950" height="409" alt="Screenshot 2026-09-12 012012" src="https://github.com/user-attachments/assets/27ff84a0-187e-48cf-87a9-ca2e24fc69c7" />
<img width="945" height="410" alt="Screenshot 2026-09-12 012034" src="https://github.com/user-attachments/assets/71f8f88e-62b1-451c-a129-78d9a1e92fa9" />
<img width="950" height="410" alt="Screenshot 2026-09-12 012111" src="https://github.com/user-attachments/assets/8e746075-7509-427d-8eff-0f1f9c4252a0" />

---

## Features

- 🔴 **Real-time collaboration** — every keystroke synced instantly via Socket.IO
- 🔐 **JWT Authentication** — access tokens + refresh tokens via httpOnly cookies
- 🚪 **Room system** — 6-character room codes, Owner/Editor/Viewer roles
- 💬 **Live chat** — built-in messaging inside every room
- ▶ **Code execution** — sandboxed Docker containers per language (local only)
- 🌐 **4 languages** — JavaScript, Python, C++, Java
- 🔒 **Room controls** — lock rooms, kick members, role management
- 📊 **Dashboard** — manage all your rooms in one place

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Monaco Editor, Zustand |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Auth | JWT, bcrypt, httpOnly cookies |
| Execution | Docker (sandboxed containers) |
| DevOps | Docker, docker-compose, Nginx |
| Deployment | Vercel (frontend), Render (backend) |

---


---

## Code Execution — Important Note

The executor service runs **locally only** due to Docker-in-Docker restrictions on free cloud hosting. It spins up an isolated container per execution with:

- 128MB memory limit
- 50% CPU cap  
- Zero network access
- 10 second timeout
- Auto-cleanup after execution

To run with full execution support:

```bash
# Clone the repo
git clone https://github.com/AalwinMathewThomas/codesync
cd codesync

# Pull language images
docker pull node:20-alpine
docker pull python:3.11-alpine
docker pull gcc:latest
docker pull eclipse-temurin:17-alpine

# Start everything
docker-compose up --build
```

The deployed version at [codesync-ruby.vercel.app](https://codesync-ruby.vercel.app) supports full collaboration, rooms, chat, and auth — execution is demonstrated in the video above.

---

## Local Development

**Prerequisites:** Node.js, Docker Desktop

```bash
# Start databases
docker-compose up mongo redis -d

# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Executor
cd executor && npm run dev

# Terminal 3 — Frontend
cd client && npm run dev
```

Visit `http://localhost:5173`

---

## Environment Variables

**server/.env**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/codesync
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
```

**client/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Project Structure
