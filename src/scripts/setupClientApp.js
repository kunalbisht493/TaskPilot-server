import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.resolve(__dirname, '../../../TaskPilot-client');

function writeFile(relativePath, content) {
  const fullPath = path.join(clientDir, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Created: ${relativePath}`);
}

console.log('Writing useAgentSession, App.jsx, and main.jsx...');

// src/hooks/useAgentSession.js
writeFile('src/hooks/useAgentSession.js', `
import { useState, useEffect, useCallback } from 'react';
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
    console.log('Joined conversation room:', conversationId);

    return () => {
      socket.emit('leave_conversation', conversationId);
    };
  }, [socket, isConnected, conversationId]);

  // Socket event listeners for real-time streaming
  useEffect(() => {
    if (!socket) return;

    const handleStep = (data) => {
      console.log('⚡ Socket agent:step:', data);
      setSteps((prev) => [...prev, data]);
      if (data.tool) {
        setCurrentAction(\`Tool: \${data.tool}\`);
      }
    };

    const handleConfirmRequest = (data) => {
      console.log('⚠️ Socket agent:confirm_request:', data);
      setPendingConfirmation(data);
      setCurrentAction(null);
      setIsExecuting(false);
    };

    const handleComplete = (data) => {
      console.log('✅ Socket agent:complete:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setPendingConfirmation(null);
      if (data?.finalAnswer) {
        setFinalAnswer(data.finalAnswer);
      }
    };

    const handleError = (data) => {
      console.error('❌ Socket agent:error:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setError(data?.message || 'Agent execution failed');
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
    setCurrentAction('Initializing ReAct loop...');
    // Clear previous steps or keep for history? Let's start fresh for a new goal
    setSteps([]);

    try {
      const res = await agentApi.startTask({ goal, conversationId });
      console.log('Agent REST response:', res);
      
      if (res?.status === 'awaiting_confirmation') {
        setPendingConfirmation(res.pendingAction);
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'completed') {
        setIsExecuting(false);
        setCurrentAction(null);
        if (res?.finalAnswer) {
          setFinalAnswer(res.finalAnswer);
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
    const confId = pendingConfirmation.confirmationId;
    setIsExecuting(true);
    setCurrentAction(approved ? 'Executing confirmed action...' : 'Processing action cancellation...');

    try {
      const res = await agentApi.confirmAction({
        confirmationId: confId,
        approved,
      });

      console.log('Confirmation REST response:', res);
      setPendingConfirmation(null);

      if (res?.status === 'completed' && res?.result?.finalAnswer) {
        setFinalAnswer(res.result.finalAnswer);
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'awaiting_confirmation') {
        setPendingConfirmation(res.pendingAction);
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
`);

// src/App.jsx
writeFile('src/App.jsx', `
import React, { useState } from 'react';
import { Header } from './components/Header';
import { GoalInput } from './components/GoalInput';
import { ReasoningFeed } from './components/ReasoningFeed';
import { ConfirmationModal } from './components/ConfirmationModal';
import { TaskPanel } from './components/TaskPanel';
import { AuditLogPanel } from './components/AuditLogPanel';
import { SystemInfoModal } from './components/SystemInfoModal';
import { useAgentSession } from './hooks/useAgentSession';
import { useAuth } from './context/AuthContext';
import { 
  Sparkles, 
  RotateCcw, 
  CheckSquare, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, user, devLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'audit'
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const {
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
  } = useAgentSession();

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      {/* 1. Header */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Unauthenticated Quick Banner */}
        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-950/60 to-dark-900 border border-accent-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-500/20 text-accent-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Welcome to TaskPilot</h3>
                <p className="text-xs text-slate-300">
                  Authenticate via Dev Quick Login to interact with live tools and test human-in-the-loop guardrails.
                </p>
              </div>
            </div>
            <button
              onClick={() => devLogin()}
              className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold text-xs transition shadow-md shadow-accent-500/20 whitespace-nowrap"
            >
              One-Click Dev Login
            </button>
          </div>
        )}

        {/* 2. Top Goal Input Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <span>Goal Formulation</span>
              <span className="text-[10px] font-mono text-slate-500">ID: {conversationId.substring(0, 14)}...</span>
            </span>
            {steps.length > 0 && (
              <button
                onClick={resetSession}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Conversation</span>
              </button>
            )}
          </div>

          <GoalInput
            onSubmit={submitGoal}
            isExecuting={isExecuting}
            disabled={!isAuthenticated}
          />
        </div>

        {/* 3. Main Dashboard 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: ReAct Live Reasoning Stream (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <ReasoningFeed
              steps={steps}
              isExecuting={isExecuting}
              currentAction={currentAction}
              finalAnswer={finalAnswer}
              error={error}
              goal={activeGoal}
            />
          </div>

          {/* Right Column: Multi-Panel Tabbed Workspace (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 p-1 bg-dark-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('tasks')}
                className={\`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition \${
                  activeTab === 'tasks'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }\`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                <span>Internal Tasks</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={\`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition \${
                  activeTab === 'audit'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }\`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-accent-400" />
                <span>Action Audit Trail</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'tasks' ? (
              <TaskPanel />
            ) : (
              <AuditLogPanel />
            )}
          </div>
        </div>
      </main>

      {/* 4. Human-in-the-Loop Confirmation Modal */}
      {pendingConfirmation && (
        <ConfirmationModal
          confirmation={pendingConfirmation}
          onConfirm={() => submitConfirmation(true)}
          onReject={() => submitConfirmation(false)}
        />
      )}

      {/* 5. System Info & Architecture Modal */}
      <SystemInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        TaskPilot • Autonomous MERN AI Agent with Hand-Built ReAct Loop • Real-time WebSockets & Audit Logging
      </footer>
    </div>
  );
}
`);

// src/main.jsx
writeFile('src/main.jsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
`);

console.log('App components completed.');
