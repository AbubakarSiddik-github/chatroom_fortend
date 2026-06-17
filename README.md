# Connectify Frontend

Connectify is a modern, real-time chat application UI built with React and Vite.

## Features
- Dynamic mobile-first responsive layout (Sidebar slides out on mobile).
- Real-time chat via WebSocket + STOMP.
- Read receipts, online presence, and typing indicators.
- In-chat image and document uploads (via Cloudinary integration on backend).
- Customizable contact nicknames stored locally.

## Tech Stack
- **Framework**: React + Vite
- **Networking**: Axios (REST), STOMPJS + SockJS (WebSocket)
- **Styling**: Vanilla CSS with modern custom properties.

## Environment Configuration
Create a `.env` file in the root of the `frontend` folder to configure your backend URLs:
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## Screenshots
*(Add screenshots of the mobile and desktop views here)*
