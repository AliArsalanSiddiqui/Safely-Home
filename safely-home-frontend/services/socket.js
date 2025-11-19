import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      if (userId) this.socket.emit('authenticate', userId);
    });

    this.socket.on('disconnect', () => console.log('❌ Socket disconnected'));
    this.socket.on('connect_error', (error) => console.error('Socket error:', error));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      const callback = this.listeners.get(event);
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  updateLocation(userId, latitude, longitude) {
    this.emit('updateLocation', { userId, latitude, longitude });
  }
}

const socketService = new SocketService();
export default socketService;