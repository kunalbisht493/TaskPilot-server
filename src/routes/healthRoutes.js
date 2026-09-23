import express from 'express';
import { toolRegistry } from '../tools/index.js';
import { config } from '../config/env.js';
import { llmAdapter } from '../services/llmAdapter.js';

const router = express.Router();

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
