import { config } from '../config/env.js';
import { llmAdapter } from '../services/llmAdapter.js';
import { toolRegistry } from '../tools/index.js';
import { REACT_SYSTEM_INSTRUCTION } from './prompts.js';

export class ReActOrchestrator {
  constructor(options = {}) {
    this.maxSteps = options.maxSteps || config.maxReactSteps || 6;
  }

  /**
   * Runs the complete ReAct loop for a given user goal
   * 
   * @param {Object} params
   * @param {string} params.goal - The natural language request
   * @param {string} [params.conversationId] - Session identifier for multi-turn tracking
   * @param {Array} [params.history] - Prior messages in the conversation
   * @param {Function} [params.onStepUpdate] - Callback emitted at each state transition
   * @param {string} [params.providerPreference] - 'gemini' | 'groq' | 'mock'
   * @param {Object} [params.context] - Additional context (user details, auth tokens)
   */
  async run({ goal, conversationId = 'default', history = [], onStepUpdate = () => {}, providerPreference, context = {} }) {
    const messages = [...history];
    if (goal && (!history.length || history[history.length - 1].content !== goal)) {
      messages.push({ role: 'user', content: goal });
    }

    let step = 0;
    const executionTrace = [];

    // Helper to log and dispatch events
    const emit = (event) => {
      executionTrace.push({ timestamp: new Date().toISOString(), ...event });
      try {
        onStepUpdate(event);
      } catch (err) {
        console.error('[Orchestrator] Error in onStepUpdate handler:', err.message);
      }
    };

    emit({
      type: 'agent_started',
      conversationId,
      goal,
      maxSteps: this.maxSteps,
    });

    while (step < this.maxSteps) {
      step++;

      emit({
        type: 'reasoning_start',
        step,
        conversationId,
        message: `Step ${step}: Agent is reasoning...`,
      });

      let plan;
      try {
        plan = await llmAdapter.planNextStep({
          messages,
          systemInstruction: REACT_SYSTEM_INSTRUCTION,
          providerPreference,
        });
      } catch (err) {
        emit({
          type: 'error',
          step,
          error: `LLM invocation failed: ${err.message}`,
        });
        return {
          status: 'error',
          error: err.message,
          step,
          trace: executionTrace,
          messages,
        };
      }

      // Check if LLM determined the goal is complete
      if (plan.type === 'final_answer') {
        emit({
          type: 'final_answer',
          step,
          content: plan.content,
          provider: plan.provider,
        });

        messages.push({
          role: 'assistant',
          content: plan.content,
        });

        return {
          status: 'completed',
          finalAnswer: plan.content,
          stepsTaken: step,
          trace: executionTrace,
          messages,
        };
      }

      // Handle tool call action
      if (plan.type === 'tool_call') {
        emit({
          type: 'tool_call',
          step,
          tool: plan.name,
          args: plan.args,
          reasoning: plan.reasoning,
          provider: plan.provider,
        });

        messages.push({
          role: 'assistant',
          content: plan.reasoning,
          toolCall: {
            name: plan.name,
            args: plan.args,
          },
        });

        // Execute tool through registry (with validation & guardrail checks)
        const toolExecution = await toolRegistry.validateAndExecute(plan.name, plan.args, context);

        // Guardrail: Action requires user confirmation
        if (toolExecution.needsConfirmation) {
          emit({
            type: 'confirmation_required',
            step,
            tool: plan.name,
            args: plan.args,
            description: toolExecution.description,
          });

          return {
            status: 'awaiting_confirmation',
            step,
            pendingAction: {
              tool: plan.name,
              args: plan.args,
              description: toolExecution.description,
            },
            trace: executionTrace,
            messages,
          };
        }

        // Tool execution result (success or error)
        if (!toolExecution.success) {
          emit({
            type: 'tool_observation',
            step,
            tool: plan.name,
            success: false,
            error: toolExecution.error,
          });

          messages.push({
            role: 'tool',
            name: plan.name,
            content: `Error: ${toolExecution.error}`,
            isError: true,
          });
        } else {
          emit({
            type: 'tool_observation',
            step,
            tool: plan.name,
            success: true,
            result: toolExecution.result,
          });

          messages.push({
            role: 'tool',
            name: plan.name,
            content: toolExecution.result,
          });
        }
      }
    }

    // Terminate if max steps reached
    emit({
      type: 'max_steps_exceeded',
      step,
      message: `Hardcoded limit of ${this.maxSteps} reasoning steps reached. Loop stopped to prevent runaway recursion.`,
    });

    return {
      status: 'max_steps_exceeded',
      stepsTaken: step,
      finalAnswer: `I reached the maximum allowable steps (${this.maxSteps}) without concluding. Here is the progress so far.`,
      trace: executionTrace,
      messages,
    };
  }
}

export const orchestrator = new ReActOrchestrator();
