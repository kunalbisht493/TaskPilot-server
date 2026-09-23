import { Server } from 'socket.io';
import { config } from '../config/env.js';

let ioInstance = null;

export function initializeSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`[Socket] Client ${socket.id} joined conversation room: ${conversationId}`);
      socket.emit('joined_room', { conversationId });
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`[Socket] Client ${socket.id} left conversation room: ${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function emitReasoningStep(conversationId, stepData) {
  if (!ioInstance) return;
  // Emit to specific conversation room and fallback to broadcast
  ioInstance.to(conversationId).emit('agent:step', stepData);
  ioInstance.emit('agent:global_step', { conversationId, ...stepData });
}
