import { ActionLog } from '../models/ActionLog.js';
import mongoose from 'mongoose';

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
    // If MongoDB is connected, persist to collection
    if (mongoose.connection.readyState === 1) {
      const log = await ActionLog.create({
        conversationId,
        userId,
        tool,
        args,
        result,
        success,
        confirmedByUser,
        executionTimeMs,
        timestamp: new Date(),
      });
      return log;
    } else {
      console.log(`[AuditLog - Local Console] Tool: "${tool}", Success: ${success}, Confirmed: ${confirmedByUser}`);
      return null;
    }
  } catch (error) {
    console.error('[AuditLogger] Failed to persist action log:', error.message);
    return null;
  }
}
