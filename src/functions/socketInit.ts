import { Server, Socket } from 'socket.io';
import cartSocketListeners from './socketListeners';

let io: Server;

// Initialize the Socket.IO server
export function initSocket(server: any): void {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  console.log('Socket.IO initialized');

  io.on('connection', (socket: Socket) => {
    console.log('A user connected', socket.id);

    // Attach custom listeners
    cartSocketListeners(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
}

// General error handler
export const generalErrorHandler = (error: Error): void => {
  if (io) {
    io.emit('error', error.message || 'An unknown error occurred');
  }
};

// Notification sender
export const notifyer = (message: string): void => {
  if (io) {
    io.emit('notification', message);
  }
};
