import { ActionLog } from '../models/ActionLog.js';
import mongoose from 'mongoose';
import { emitAuditLog } from '../sockets/socketGateway.js';

// In-memory fallback buffer for test runs without active database connection
const localMemoryLogs = [];

/**
 * Persists an immutable action log entry to MongoDB and emits real-time event
 */
export async function logAction({
  conversationId,
  userId,
  tool,
  args,
  result,
  success = true,
  confirmedByUser = false,
  executionTimeMs = 0,
}) {
  try {
    const payload = {
      conversationId,
      userId: userId || null,
      tool,
      args,
      result,
      success,
      confirmedByUser,
      executionTimeMs,
      timestamp: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const log = await ActionLog.create(payload);
      emitAuditLog(log.toObject());
      return log;
    } else {
      localMemoryLogs.unshift(payload);
      emitAuditLog(payload);
      return payload;
    }
  } catch (error) {
    console.error('[AuditLogger] Failed to persist action log:', error.message);
    return null;
  }
}

/**
 * Retrieves paginated audit logs with optional filtering by tool, conversation, or user
 */
export async function getActionLogs({
  conversationId,
  userId,
  tool,
  page = 1,
  limit = 50,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  if (mongoose.connection.readyState === 1) {
    const query = {};
    if (conversationId) query.conversationId = conversationId;
    if (userId) query.userId = userId;
    if (tool) query.tool = tool;

    const [logs, total] = await Promise.all([
      ActionLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      ActionLog.countDocuments(query),
    ]);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      logs,
    };
  }

  // Memory fallback
  let filtered = [...localMemoryLogs];
  if (conversationId) filtered = filtered.filter((l) => l.conversationId === conversationId);
  if (tool) filtered = filtered.filter((l) => l.tool === tool);

  const paginated = filtered.slice(skip, skip + limitNum);
  return {
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum) || 1,
    logs: paginated,
  };
}

/**
 * Aggregates high-level metrics for dashboard tables and analytics
 */
export async function getActionStats({ userId } = {}) {
  if (mongoose.connection.readyState === 1) {
    const match = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    const totalLogs = await ActionLog.countDocuments(match);
    const successLogs = await ActionLog.countDocuments({ ...match, success: true });
    const confirmedLogs = await ActionLog.countDocuments({ ...match, confirmedByUser: true });

    const toolBreakdown = await ActionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$tool',
          count: { $sum: 1 },
          avgExecutionMs: { $avg: '$executionTimeMs' },
          successCount: { $sum: { $cond: ['$success', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalActions: totalLogs,
      successfulActions: successLogs,
      failedActions: totalLogs - successLogs,
      confirmedActions: confirmedLogs,
      successRatePercent: totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100,
      toolBreakdown: toolBreakdown.map((t) => ({
        tool: t._id,
        count: t.count,
        avgExecutionMs: Math.round(t.avgExecutionMs || 0),
        successRatePercent: t.count > 0 ? Math.round((t.successCount / t.count) * 100) : 100,
      })),
    };
  }

  const total = localMemoryLogs.length;
  const successful = localMemoryLogs.filter((l) => l.success).length;
  const confirmed = localMemoryLogs.filter((l) => l.confirmedByUser).length;

  return {
    totalActions: total,
    successfulActions: successful,
    failedActions: total - successful,
    confirmedActions: confirmed,
    successRatePercent: total > 0 ? Math.round((successful / total) * 100) : 100,
    toolBreakdown: [],
  };
}
