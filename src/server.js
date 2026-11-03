import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initializeSocket } from './sockets/socketGateway.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const app = express();
const server = http.createServer(app);

// CORS configuration: dynamically allow localhost, 127.0.0.1, clientUrl, and local LAN IPs
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

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize WebSockets
initializeSocket(server);

// Standalone lightweight keep-alive endpoints for external cron pingers (Cron-job.org, UptimeRobot)
app.all(['/health', '/cron', '/healthz'], (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  res.status(200).json({
    status: 'ok',
    service: 'taskpilot-server',
    purpose: 'cron-keep-alive',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit-logs', auditRoutes);

// Welcome Root Route
app.get('/', (req, res) => {
  res.json({
    name: 'TaskPilot API',
    description: 'Autonomous MERN-based AI Agent with ReAct Loop',
    endpoints: {
      health: {
        status: '/api/health',
        cron: '/api/health/cron',
      },
      auth: {
        google: '/api/auth/google',
        callback: '/api/auth/google/callback',
        me: '/api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      tasks: '/api/tasks',
      auditLogs: {
        list: '/api/audit-logs',
        stats: '/api/audit-logs/stats',
      },
      tools: '/api/tools',
      agent: {
        task: 'POST /api/agent/task',
        confirm: 'POST /api/agent/confirm',
        pendingConfirmations: 'GET /api/agent/confirmations/pending',
      },
    },
    version: '1.0.0',
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  await connectDB();

  server.listen(config.port, () => {
    const isProd = process.env.NODE_ENV === 'production';
    const serverUrl = config.serverUrl || (process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL : null);

    console.log(`\n=================================================`);
    if (isProd && serverUrl) {
      console.log(`TaskPilot Server running on: ${serverUrl}`);
    } else if (isProd) {
      console.log(`TaskPilot Server running on: Port ${config.port} (Production)`);
    } else {
      console.log(`TaskPilot Server running on http://localhost:${config.port}`);
    }
    console.log(`WebSocket Gateway ready for live reasoning stream`);
    console.log(`Active LLM Provider: ${config.defaultProvider}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================================\n`);
  });
}

startServer();

export { app, server };
