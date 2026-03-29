import { io } from 'socket.io-client';

// Always use production URL (no localhost fallback)
const socket = io(process.env.REACT_APP_SOCKET_URL, {
  autoConnect: false,
});

export default socket;