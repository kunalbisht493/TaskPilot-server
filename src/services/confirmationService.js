import mongoose from 'mongoose';
import { PendingConfirmation } from '../models/PendingConfirmation.js';
import { Conversation } from '../models/Conversation.js';
import { toolRegistry } from '../tools/index.js';
import { logAction } from './auditLogger.js';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { emitConfirmationRequired, emitAgentComplete, emitReasoningStep } from '../sockets/socketGateway.js';

export const confirmationService = {
  /**
   * Persists a pending confirmation and notifies the user via Socket.io
   */
  async createPendingConfirmation({
    conversationId,
    userId,
    tool,
    args,
    description,
    step,
    messages = [],
    goal = '',
  }) {
    const confirmationId = `conf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let pendingRecord = null;
    if (mongoose.connection.readyState === 1) {
      pendingRecord = await PendingConfirmation.create({
        confirmationId,
        conversationId,
        userId: userId || null,
        tool,
        args,
        description: description || `Approval requested for action "${tool}".`,
        status: 'pending',
      });

      // Update or create conversation record
      await Conversation.findOneAndUpdate(
        { conversationId },
        {
          $set: {
            conversationId,
            userId: userId || null,
            goal: goal || 'Task execution',
            status: 'awaiting_confirmation',
            stepsCount: step,
            messages,
          },
        },
        { upsert: true, new: true }
      );
    }

    const payload = {
      confirmationId,
      conversationId,
      tool,
      args,
      description: description || `Approval requested for action "${tool}".`,
      step,
    };

    // Emit live confirmation prompt to frontend via WebSockets
    emitConfirmationRequired(conversationId, payload);

    return pendingRecord || payload;
  },

  /**
   * Resolves a pending confirmation (Approve or Reject), executes write action if approved,
   * logs the action, and resumes the ReAct reasoning loop.
   */
  async resolveConfirmation({
    confirmationId,
    approved,
    user,
    onStepUpdate = () => {},
  }) {
    let pending;
    if (mongoose.connection.readyState === 1) {
      pending = await PendingConfirmation.findOne({ confirmationId });
    }

    if (!pending) {
      throw new Error(`Pending confirmation with ID "${confirmationId}" was not found.`);
    }

    if (pending.status !== 'pending') {
      throw new Error(
        `Confirmation "${confirmationId}" has already been processed with status "${pending.status}".`
      );
    }

    // Retrieve conversation history to resume ReAct loop
    let conversation;
    if (mongoose.connection.readyState === 1) {
      conversation = await Conversation.findOne({ conversationId: pending.conversationId });
    }

    const history = conversation ? [...conversation.messages] : [];

    // -------------------------------------------------------------------------
    // Branch A: User REJECTED the action
    // -------------------------------------------------------------------------
    if (!approved) {
      pending.status = 'rejected';
      pending.resolvedAt = new Date();
      await pending.save();

      // Log the rejected action in the audit log
      await logAction({
        conversationId: pending.conversationId,
        userId: user?._id || pending.userId,
        tool: pending.tool,
        args: pending.args,
        result: {
          cancelled: true,
          message: `User rejected authorization for tool: ${pending.tool}`,
        },
        success: false,
        confirmedByUser: false,
      });

      // Feed rejection observation back to the LLM
      history.push({
        role: 'tool',
        name: pending.tool,
        content: `Action Cancelled: The user denied permission to execute "${pending.tool}". Do not perform this action. Acknowledge the cancellation to the user and ask how they would like to proceed.`,
      });

      // Resume ReAct loop
      const resumeResult = await orchestrator.run({
        goal: conversation?.goal || '',
        conversationId: pending.conversationId,
        history,
        context: { user, isConfirmed: false },
        onStepUpdate: (event) => {
          emitReasoningStep(pending.conversationId, event);
          onStepUpdate(event);
        },
      });

      // Persist final conversation state
      if (conversation) {
        conversation.status = resumeResult.status;
        conversation.messages = resumeResult.messages || history;
        conversation.stepsCount += resumeResult.stepsTaken || 1;
        await conversation.save();
      }

      emitAgentComplete(pending.conversationId, resumeResult);

      return {
        success: true,
        approved: false,
        status: 'rejected',
        confirmationId,
        conversationId: pending.conversationId,
        result: resumeResult,
      };
    }

    // -------------------------------------------------------------------------
    // Branch B: User APPROVED the action
    // -------------------------------------------------------------------------
    pending.status = 'approved';
    pending.resolvedAt = new Date();
    await pending.save();

    // Execute the approved tool action (bypass guardrail with isConfirmed: true)
    const startTime = Date.now();
    const toolExecution = await toolRegistry.validateAndExecute(pending.tool, pending.args, {
      user,
      isConfirmed: true,
    });
    const executionDuration = Date.now() - startTime;

    // Persist immutable audit log
    await logAction({
      conversationId: pending.conversationId,
      userId: user?._id || pending.userId,
      tool: pending.tool,
      args: pending.args,
      result: toolExecution.result || toolExecution.error,
      success: toolExecution.success,
      confirmedByUser: true,
      executionTimeMs: executionDuration,
    });

    // Feed execution outcome back into conversation as tool observation
    const observationContent = toolExecution.success
      ? typeof toolExecution.result === 'object'
        ? JSON.stringify(toolExecution.result)
        : String(toolExecution.result)
      : `Error executing ${pending.tool}: ${toolExecution.error}`;

    history.push({
      role: 'tool',
      name: pending.tool,
      content: observationContent,
    });

    // Resume ReAct loop so LLM observes the action result and concludes
    const resumeResult = await orchestrator.run({
      goal: conversation?.goal || '',
      conversationId: pending.conversationId,
      history,
      context: { user, isConfirmed: false },
      onStepUpdate: (event) => {
        emitReasoningStep(pending.conversationId, event);
        onStepUpdate(event);
      },
    });

    // Update conversation record
    if (conversation) {
      conversation.status = resumeResult.status;
      conversation.messages = resumeResult.messages || history;
      conversation.stepsCount += resumeResult.stepsTaken || 1;
      await conversation.save();
    }

    emitAgentComplete(pending.conversationId, resumeResult);

    return {
      success: true,
      approved: true,
      status: 'approved',
      confirmationId,
      conversationId: pending.conversationId,
      toolResult: toolExecution.result,
      result: resumeResult,
    };
  },

  /**
   * Retrieves pending confirmations for a given conversation or user
   */
  async getPending({ conversationId, userId }) {
    if (mongoose.connection.readyState !== 1) return [];
    const query = { status: 'pending' };
    if (conversationId) query.conversationId = conversationId;
    if (userId) query.userId = userId;
    return await PendingConfirmation.find(query).sort({ createdAt: -1 });
  },
};
