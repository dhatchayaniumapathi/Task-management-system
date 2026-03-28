import { io } from 'socket.io-client';

// Create a single shared socket instance for the entire app
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false, // We manually connect after login
});

export default socket;
