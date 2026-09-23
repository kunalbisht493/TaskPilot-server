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

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize WebSockets
initializeSocket(server);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/agent', agentRoutes);

// Welcome Root Route
app.get('/', (req, res) => {
  res.json({
    name: 'TaskPilot API',
    description: 'Autonomous MERN-based AI Agent with Hand-Built ReAct Loop',
    endpoints: {
      health: '/api/health',
      tools: '/api/tools',
      task: 'POST /api/agent/task',
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
    console.log(`\n=================================================`);
    console.log(`🚀 TaskPilot Server running on http://localhost:${config.port}`);
    console.log(`📡 WebSocket Gateway ready for live reasoning stream`);
    console.log(`🧠 Active LLM Provider: ${config.defaultProvider}`);
    console.log(`=================================================\n`);
  });
}

startServer();

export { app, server };
