import express from 'express';
import mongoose from 'mongoose';
import { toolRegistry } from '../tools/index.js';
import { config } from '../config/env.js';
import { llmAdapter } from '../services/llmAdapter.js';

const router = express.Router();

/**
 * Unified Health & Keep-Alive Handler
 * - Supports GET and HEAD methods for external cron pingers (Cron-job.org, UptimeRobot).
 * - Actively pings MongoDB admin to keep connection pool and MongoDB Atlas cluster awake.
 * - Keeps Node.js server awake on free-tier hosting (Render, Railway).
 * - Returns comprehensive runtime status, database latency, and LLM provider configuration.
 */
  export async function healthHandler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    let database = {
      status: 'disconnected',
      latencyMs: null,
    };

    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        database = {
          status: 'connected',
          latencyMs: Date.now() - start,
        };
      } catch (err) {
        database = {
          status: 'error',
          message: err.message,
        };
      }
    } else {
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      database = {
        status: states[mongoose.connection.readyState] || 'disconnected',
        latencyMs: null,
      };
    }

    const activeProvider = llmAdapter.getActiveProvider();

      return res.status(200).json({
        status: 'ok',
        service: 'taskpilot-server',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database,
        activeLLMProvider: activeProvider,
        geminiConfigured: Boolean(config.gemini.apiKey),
        groqConfigured: Boolean(config.groq.apiKey),
        registeredTools: toolRegistry.getAllTools().map((t) => t.name),
      });
  }

  // Single unified health endpoint (accessible via /api/health)
  router.all('/health', healthHandler);

  router.get('/tools', (req, res) => {
    const tools = toolRegistry.getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      isWriteAction: t.isWriteAction,
      parameters: t.parameters,
    }));
    res.json({
      count: tools.length,
      tools,
    });
  });

  export default router;
