import express from 'express';
import { getActionLogs, getActionStats } from '../services/auditLogger.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { ActionLog } from '../models/ActionLog.js';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Retrieves paginated action logs with filtering support
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { conversationId, tool, page, limit } = req.query;
    const userId = req.user?._id;

    const data = await getActionLogs({
      conversationId,
      userId,
      tool,
      page,
      limit,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/audit-logs/stats
 * Aggregated analytics and breakdown across tool invocations
 */
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const stats = await getActionStats({ userId });

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/audit-logs/:id
 * Retrieves full details for a specific action log entry
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const log = await ActionLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Action log entry not found.',
      });
    }

    res.json({
      success: true,
      log,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
