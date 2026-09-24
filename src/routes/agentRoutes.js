import express from 'express';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { emitReasoningStep } from '../sockets/socketGateway.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * POST /api/agent/task
 * Triggers the ReAct loop for a natural-language goal and streams reasoning steps
 */
router.post('/task', optionalAuth, async (req, res, next) => {
  try {
    const { goal, conversationId = `conv_${Date.now()}`, providerPreference, userId } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A non-empty string "goal" parameter is required.',
      });
    }

    // Resolve user either from session cookie or direct userId parameter
    let user = req.user;
    if (!user && userId) {
      user = await User.findById(userId);
    }

    const result = await orchestrator.run({
      goal,
      conversationId,
      providerPreference,
      context: {
        user,
        userId: user?._id || userId || null,
      },
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
