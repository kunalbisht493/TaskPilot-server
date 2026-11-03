import express from 'express';
import { toolRegistry } from '../tools/index.js';
import { config } from '../config/env.js';
import { llmAdapter } from '../services/llmAdapter.js';

const router = express.Router();

/**
 * GET & HEAD /api/health/cron and /api/cron
 * Ultra-lightweight keep-alive endpoint designed for external cron services
 * (e.g. Cron-job.org, UptimeRobot, BetterUptime) to keep free-tier instances warm.
 */
router.all(['/health/cron', '/cron'], (req, res) => {
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

router.get('/health', (req, res) => {
  const activeProvider = llmAdapter.getActiveProvider();
  res.json({
    status: 'ok',
    service: 'taskpilot-server',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    activeLLMProvider: activeProvider,
    geminiConfigured: Boolean(config.gemini.apiKey),
    groqConfigured: Boolean(config.groq.apiKey),
    registeredTools: toolRegistry.getAllTools().map((t) => t.name),
  });
});

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
