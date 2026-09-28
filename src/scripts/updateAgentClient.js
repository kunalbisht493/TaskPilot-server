import fs from 'fs';
import path from 'path';

const clientPath = path.resolve('../TaskPilot-client/src/hooks/useAgentSession.js');

const content = `import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { agentApi } from '../api/agentApi';

export function useAgentSession() {
  const { socket, isConnected } = useSocket();
  const [conversationId, setConversationId] = useState(() => 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const [steps, setSteps] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [activeGoal, setActiveGoal] = useState('');

  // Join the conversation room whenever conversationId or socket changes
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    socket.emit('join_conversation', conversationId);
    console.log('[Socket] Joined conversation room:', conversationId);

    return () => {
      socket.emit('leave_conversation', conversationId);
    };
  }, [socket, isConnected, conversationId]);

  // Socket event listeners for real-time streaming
  useEffect(() => {
    if (!socket) return;

    const handleStep = (data) => {
      console.log('[Socket] agent:step:', data);
      if (!data || data.type === 'agent_started') return;

      setSteps((prevSteps) => {
        const cycleNum = data.step || (prevSteps.length > 0 ? prevSteps[prevSteps.length - 1].step : 1);
        const existingIdx = prevSteps.findIndex((s) => s.step === cycleNum);

        if (existingIdx >= 0) {
          const updated = [...prevSteps];
          const curr = { ...updated[existingIdx] };

          if (data.type === 'reasoning_start') {
            curr.thought = data.reasoning || curr.thought;
            curr.status = 'reasoning';
          } else if (data.type === 'tool_call') {
            curr.tool = data.tool;
            curr.args = data.args;
            curr.thought = data.reasoning || curr.thought;
            curr.provider = data.provider;
            curr.status = 'tool_call';
          } else if (data.type === 'confirmation_required') {
            curr.tool = data.tool || curr.tool;
            curr.args = data.args || curr.args;
            curr.isWriteAction = true;
            curr.description = data.description;
            curr.status = 'awaiting_confirmation';
          } else if (data.type === 'tool_observation') {
            curr.result = data.result || (data.error ? { error: data.error } : null);
            curr.success = data.success !== false;
            curr.status = 'observed';
          } else if (data.type === 'final_answer') {
            curr.finalAnswer = data.content;
            curr.status = 'completed';
          }

          updated[existingIdx] = curr;
          return updated;
        } else {
          const newStep = {
            step: cycleNum,
            timestamp: data.timestamp || new Date().toISOString(),
            thought: data.reasoning || null,
            tool: data.tool || null,
            args: data.args || null,
            isWriteAction: data.type === 'confirmation_required',
            description: data.description || null,
            result: data.result || (data.error ? { error: data.error } : null),
            status: data.type,
          };
          return [...prevSteps, newStep];
        }
      });

      if (data.tool) {
        setCurrentAction(\`Tool execution: \${data.tool}\`);
      } else if (data.type === 'reasoning_start') {
        setCurrentAction(\`Cycle \${data.step}: Evaluating next action...\`);
      } else if (data.type === 'final_answer') {
        setFinalAnswer(data.content);
      }
    };

    const handleConfirmRequest = (data) => {
      console.log('[Socket] agent:confirm_request:', data);
      setPendingConfirmation(data);
      setCurrentAction(null);
      setIsExecuting(false);
    };

    const handleComplete = (data) => {
      console.log('[Socket] agent:complete:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setPendingConfirmation(null);
      if (data?.finalAnswer || data?.result?.finalAnswer) {
        setFinalAnswer(data.finalAnswer || data.result?.finalAnswer);
      }
    };

    const handleError = (data) => {
      console.error('[Socket] agent:error:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setError(data?.message || data?.error || 'Agent execution failed');
    };

    socket.on('agent:step', handleStep);
    socket.on('agent:confirm_request', handleConfirmRequest);
    socket.on('agent:complete', handleComplete);
    socket.on('agent:error', handleError);

    return () => {
      socket.off('agent:step', handleStep);
      socket.off('agent:confirm_request', handleConfirmRequest);
      socket.off('agent:complete', handleComplete);
      socket.off('agent:error', handleError);
    };
  }, [socket]);

  // Start new agent task
  const submitGoal = async (goal) => {
    setActiveGoal(goal);
    setIsExecuting(true);
    setFinalAnswer(null);
    setError(null);
    setCurrentAction('Initializing ReAct orchestrator loop...');
    setSteps([]);

    try {
      const res = await agentApi.startTask({ goal, conversationId });
      console.log('Agent REST response:', res);
      
      if (res?.status === 'awaiting_confirmation') {
        const pending = res.pendingConfirmation || res.pendingAction || res.result?.pendingAction;
        if (pending) {
          setPendingConfirmation(pending);
        }
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'completed') {
        setIsExecuting(false);
        setCurrentAction(null);
        if (res?.finalAnswer || res?.result?.finalAnswer) {
          setFinalAnswer(res.finalAnswer || res.result?.finalAnswer);
        }
      }
    } catch (err) {
      console.error('Submit goal error:', err);
      setError(err.message || 'Failed to start agent task');
      setIsExecuting(false);
      setCurrentAction(null);
    }
  };

  // Submit confirmation decision (Approve or Reject)
  const submitConfirmation = async (approved) => {
    if (!pendingConfirmation) return;
    const confId = pendingConfirmation.confirmationId || pendingConfirmation._id || pendingConfirmation.id;
    setIsExecuting(true);
    setCurrentAction(approved ? 'Executing approved write action...' : 'Processing action cancellation...');

    try {
      const res = await agentApi.confirmAction({
        confirmationId: confId,
        approved,
      });

      console.log('Confirmation REST response:', res);
      setPendingConfirmation(null);

      if (res?.status === 'completed' || res?.result?.status === 'completed') {
        const answer = res.result?.finalAnswer || res.finalAnswer;
        if (answer) {
          setFinalAnswer(answer);
        }
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'awaiting_confirmation') {
        const nextPending = res.pendingConfirmation || res.pendingAction || res.result?.pendingAction;
        setPendingConfirmation(nextPending);
        setIsExecuting(false);
        setCurrentAction(null);
      } else {
        setIsExecuting(false);
        setCurrentAction(null);
      }
    } catch (err) {
      console.error('Confirm action error:', err);
      setError(err.message || 'Failed to submit confirmation');
      setIsExecuting(false);
      setCurrentAction(null);
    }
  };

  // Reset conversation
  const resetSession = () => {
    const newId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setConversationId(newId);
    setSteps([]);
    setIsExecuting(false);
    setCurrentAction(null);
    setPendingConfirmation(null);
    setFinalAnswer(null);
    setError(null);
    setActiveGoal('');
  };

  return {
    conversationId,
    steps,
    isExecuting,
    currentAction,
    pendingConfirmation,
    finalAnswer,
    error,
    activeGoal,
    submitGoal,
    submitConfirmation,
    resetSession,
  };
}
`;

fs.writeFileSync(clientPath, content, 'utf8');
console.log('Successfully written to:', clientPath);
