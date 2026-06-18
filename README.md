# Connectify — Frontend (React/Vite)

> React + Vite frontend for the Connectify real-time chat application. Deployed on Vercel.

---

## 🌐 Live Demo

**Frontend:** https://chatroom-fortend.vercel.app  
**Backend API:** https://chatroom-backend-1-zbsi.onrender.com

---

## ✨ Features

- 🔐 JWT authentication (login/register)
- 💬 Private and group chat
- ⚡ Real-time WebSocket messaging (STOMP over SockJS)
- ⌨️ Typing indicator
- ✅ Read receipts
- 🟢 Online/offline presence
- 📷 Image sharing with preview
- 📄 File sharing with download card
- 🗑️ Delete messages (with Cloudinary cleanup)
- 👤 Profile photo upload/replace/delete
- 📝 Bio update
- ↩️ Reply to any message
- 😊 Emoji picker (built-in, no heavy package)
- 📱 Fully responsive (mobile + desktop)
- 🔒 All API calls secured with Bearer JWT

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool
- **Vanilla CSS** — Custom dark-theme design system
- **Axios** — HTTP client (auto JWT attach via interceptor)
- **@stomp/stompjs + sockjs-client** — WebSocket/STOMP
- **React Router v6** — Client-side routing

---

## 🔑 Environment Variables

Create a `.env.local` file for local development:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

For production (Vercel Settings → Environment Variables):
```env
VITE_API_URL=https://chatroom-backend-1-zbsi.onrender.com
VITE_WS_URL=https://chatroom-backend-1-zbsi.onrender.com/ws
```

---

## 🚀 Local Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure

```
src/
├── api/
│   └── axiosConfig.js       # Axios instance with VITE_API_URL + JWT interceptor
├── components/
│   ├── ChatWindow.jsx        # Message list with reply quotes + delete actions
│   ├── MessageInput.jsx      # Text input with emoji picker + reply bar + attach
│   ├── ProfileModal.jsx      # Avatar upload/remove + bio editing
│   ├── RoomList.jsx          # Sidebar chat list
│   ├── UserList.jsx          # Users tab
│   ├── ConfirmModal.jsx      # Confirmation dialogs
│   └── NicknameModal.jsx     # Nickname editing
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ChatPage.jsx          # Main chat orchestrator
├── services/
│   ├── AuthService.js
│   ├── ChatService.js        # REST API calls
│   ├── uploadService.js      # Upload + profile + avatar API
│   └── websocketService.js   # STOMP WebSocket client
├── styles/                   # Per-component CSS files
└── utils/                    # Helper functions
```

---

## ☁️ Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. The `vercel.json` handles SPA routing (all routes → `index.html`)
4. Auto-deploys on every `git push main`

---

## 💼 Resume Highlights

**Connectify – Real-Time Chat Application**  
*Tech Stack: Java, Spring Boot, React.js, MongoDB, WebSocket/STOMP, JWT, Cloudinary, Render, Vercel*

- Built and deployed a full-stack real-time chat application with JWT authentication, private chat, group chat, typing indicators, read receipts, and online/offline presence
- Implemented WebSocket-based real-time messaging using Spring Boot STOMP broker and React STOMP client
- Integrated Cloudinary for image/file sharing with permanent media deletion on message delete to optimize free-tier storage usage
- Added user profile features including avatar upload/replace/delete, bio update, message reply threads, and emoji picker
- Deployed backend as Docker container on Render, frontend on Vercel, database on MongoDB Atlas with secure environment-based configuration

---

## 📅 Project Status

**Status:** ✅ Complete & Production-Ready  
**Last Updated:** June 18, 2026
