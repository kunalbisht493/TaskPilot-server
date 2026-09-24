import express from 'express';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { emitReasoningStep } from '../sockets/socketGateway.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { confirmationService } from '../services/confirmationService.js';

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

    // If ReAct loop paused for human confirmation, persist pending record
    if (result.status === 'awaiting_confirmation') {
      const pendingRecord = await confirmationService.createPendingConfirmation({
        conversationId,
        userId: user?._id || null,
        tool: result.pendingAction.tool,
        args: result.pendingAction.args,
        description: result.pendingAction.description,
        step: result.step,
        messages: result.messages,
        goal,
      });

      return res.json({
        success: true,
        status: 'awaiting_confirmation',
        conversationId,
        pendingConfirmation: pendingRecord,
        result,
      });
    }

    res.json({
      success: true,
      status: result.status,
      conversationId,
      result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/confirm
 * Human-in-the-Loop approval/rejection endpoint
 */
router.post('/confirm', optionalAuth, async (req, res, next) => {
  try {
    const { confirmationId, approved } = req.body;

    if (!confirmationId || typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Parameters "confirmationId" (string) and "approved" (boolean) are required.',
      });
    }

    const resolution = await confirmationService.resolveConfirmation({
      confirmationId,
      approved,
      user: req.user,
    });

    res.json({
      success: true,
      ...resolution,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agent/confirmations/pending
 * Returns pending confirmations for the current conversation or user
 */
router.get('/confirmations/pending', optionalAuth, async (req, res, next) => {
  try {
    const { conversationId } = req.query;
    const pendingList = await confirmationService.getPending({
      conversationId,
      userId: req.user?._id,
    });

    res.json({
      success: true,
      count: pendingList.length,
      confirmations: pendingList,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
