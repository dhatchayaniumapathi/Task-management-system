import { io } from 'socket.io-client';

// Always use production URL (no localhost fallback)
const socket = io("https://task-management-system-ztgu.onrender.com", {
  autoConnect: false,
});

export default socket;