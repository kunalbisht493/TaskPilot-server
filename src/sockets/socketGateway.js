import { Server } from 'socket.io';
import { config } from '../config/env.js';

let ioInstance = null;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, '');
  const cleanClientUrl = (config.clientUrl || '').replace(/\/$/, '');
  if (cleanOrigin === cleanClientUrl) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|\[::1\])(:\d+)?$/.test(origin)) {
    return true;
  }
  try {
    const originHost = new URL(origin).host;
    const clientHost = new URL(config.clientUrl).host;
    if (originHost === clientHost) return true;
    if (clientHost.includes('vercel.app') && originHost.endsWith('.vercel.app')) return true;
  } catch (_) {}
  return false;
};

export function initializeSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Auto-join conversation room if valid conversationId provided in handshake auth or query
    const handshakeConvId = socket.handshake?.auth?.conversationId || socket.handshake?.query?.conversationId;
    if (handshakeConvId && typeof handshakeConvId === 'string' && handshakeConvId.trim()) {
      const initialRoom = handshakeConvId.trim();
      socket.join(initialRoom);
      console.log(`[Socket] Client ${socket.id} joined conversation room: ${initialRoom}`);
      socket.emit('joined_room', { conversationId: initialRoom });
    }

    socket.on('join_conversation', (conversationId) => {
      if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) return;
      const room = conversationId.trim();
      const isAlreadyInRoom = socket.rooms.has(room);
      socket.join(room);
      if (!isAlreadyInRoom) {
        console.log(`[Socket] Client ${socket.id} joined conversation room: ${room}`);
      }
      socket.emit('joined_room', { conversationId: room });



    });

    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) return;
      const room = conversationId.trim();
      socket.leave(room);
      console.log(`[Socket] Client ${socket.id} left conversation room: ${room}`);


    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason || 'unknown'})`);
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

export function emitConfirmationRequired(conversationId, confirmationData) {
  if (!ioInstance) return;
  ioInstance.to(conversationId).emit('agent:confirm_request', confirmationData);
  ioInstance.emit('agent:global_confirm_request', { conversationId, ...confirmationData });
}

export function emitAgentComplete(conversationId, completionData) {
  if (!ioInstance) return;
  ioInstance.to(conversationId).emit('agent:complete', completionData);
}

export function emitAgentError(conversationId, errorData) {
  if (!ioInstance) return;
  ioInstance.to(conversationId).emit('agent:error', errorData);
}

export function emitAuditLog(logData) {
  if (!ioInstance) return;
  ioInstance.emit('audit:new_log', logData);
  if (logData.conversationId) {
    ioInstance.to(logData.conversationId).emit('audit:conversation_log', logData);
  }
}
