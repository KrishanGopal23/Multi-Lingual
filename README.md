# Molta Multilingual Chat

Real-time chat application that translates messages and supports text and audio delivery based on each user's preferences.

## Features

- User authentication with access and refresh tokens
- One-to-one chats with translated messages
- Text and audio delivery modes per user
- Speech-to-text for voice input and text-to-speech playback
- Voice and video calls with WebRTC + Socket.io signaling
- Online presence and typing indicators
- Media attachments (image, video, audio, files)
- Message actions: reply, edit, delete, forward, react
- Multilingual toggle for faster original-language chats
- Settings page for language/mode preferences that apply to new messages only
- About page and refreshed branded UI with updated theme

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT access and refresh tokens
- Speech and translation: external APIs

## Project Structure

- multi-lingual--chatting-frontend
- multi-lingual--chatting-backend

## Getting Started (Local)

### Backend

1. Install dependencies:
   - `npm install`
2. Create a `.env` file in `multi-lingual--chatting-backend` with the following keys:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRES`
   - `JWT_REFRESH_EXPIRES_DAYS`
   - `FRONTEND_URL`
   - `STT_API_URL`
   - `TRANSLATE_API_URL`
   - `TTS_API_URL`
   - `PORT`
3. Start the server:
   - `npm run dev`

### Frontend

1. Install dependencies:
   - `npm install`
2. Create a `.env` file in `multi-lingual--chatting-frontend`:
   - `VITE_API_URL` (example: `http://localhost:5000/mlc`)
3. Start the dev server:
   - `npm run dev`

## Deployment Notes (Render)

- Backend: create a Render Web Service with root `multi-lingual--chatting-backend` and `npm start`.
- Frontend: create a Render Static Site with root `multi-lingual--chatting-frontend` and `npm run build`.
- Set `VITE_API_URL` to `https://<backend-host>/mlc` in the frontend service.
- Set `FRONTEND_URL` to the frontend origin in the backend service (no trailing slash).

## License

MIT
