import express from 'express';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { emitReasoningStep } from '../sockets/socketGateway.js';

const router = express.Router();

/**
 * POST /api/agent/task
 * Triggers the ReAct loop for a natural-language goal and streams reasoning steps
 */
router.post('/task', async (req, res, next) => {
  try {
    const { goal, conversationId = `conv_${Date.now()}`, providerPreference } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A non-empty string "goal" parameter is required.',
      });
    }

    const result = await orchestrator.run({
      goal,
      conversationId,
      providerPreference,
      onStepUpdate: (stepData) => {
        emitReasoningStep(conversationId, stepData);
      },
    });

    res.json({
      success: true,
      conversationId,
      result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
