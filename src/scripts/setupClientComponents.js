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

console.log('Writing UI components...');

// src/components/Header.jsx
writeFile('src/components/Header.jsx', `
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Bot, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  User, 
  Zap, 
  Info, 
  ExternalLink,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { authApi } from '../api/authApi';

export function Header({ onOpenInfo }) {
  const { user, isAuthenticated, isConnectedToCalendar, devLogin, logout, health } = useAuth();
  const { isConnected: socketConnected } = useSocket();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleDevLogin = async () => {
    try {
      setLoggingIn(true);
      await devLogin();
    } catch (err) {
      alert('Dev login failed: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleConnect = () => {
    window.location.href = authApi.getGoogleConnectUrl();
  };

  return (
    <header className="border-b border-slate-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/30 border border-brand-500/40 shadow-lg shadow-brand-500/10">
            <Bot className="w-5 h-5 text-brand-500" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 \${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'}\`}></span>
              <span className={\`relative inline-flex rounded-full h-2.5 w-2.5 \${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}\`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                TaskPilot
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Autonomous Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Hand-built ReAct Loop • Human-in-the-Loop Guardrails
            </p>
          </div>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center gap-3 text-xs bg-slate-800/50 border border-slate-700/60 rounded-full px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-accent-500" />
            <span className="text-slate-300 font-medium">LLM:</span>
            <span className="text-emerald-400 font-mono">
              {health?.activeLlmProvider ? health.activeLlmProvider.toUpperCase() : 'GROQ'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className={\`w-2 h-2 rounded-full \${socketConnected ? 'bg-emerald-500' : 'bg-red-500'}\`}></span>
            <span className="text-slate-300">{socketConnected ? 'Real-Time Stream' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* Architecture Info Button */}
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
            title="View Architecture Details"
          >
            <Info className="w-3.5 h-3.5 text-accent-400" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {/* Calendar Status */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center">
              {isConnectedToCalendar ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Calendar Linked</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                </div>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connect Calendar</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </button>
              )}
            </div>
          )}

          {/* Auth State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 pr-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent-600 to-brand-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                  {user?.name || user?.email || 'Authenticated'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isConnectedToCalendar ? 'Calendar active' : 'Dev session'}
                </p>
              </div>
              <button
                onClick={logout}
                className="ml-1 text-slate-400 hover:text-rose-400 p-1 rounded-md transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDevLogin}
                disabled={loggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{loggingIn ? 'Connecting...' : 'Dev Quick Login'}</span>
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Google OAuth</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
`);

// src/components/GoalInput.jsx
writeFile('src/components/GoalInput.jsx', `
import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, Calendar, CheckSquare } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Calendar,
    label: "Check Calendar",
    prompt: "Check my calendar availability for next Tuesday afternoon"
  },
  {
    icon: Calendar,
    label: "Schedule Event",
    prompt: "Schedule a sprint sync with the team on 2026-09-30 at 14:00 for 30 minutes"
  },
  {
    icon: CheckSquare,
    label: "Create Task",
    prompt: "Create a task to prepare presentation slides for mentor review before Friday"
  },
  {
    icon: Sparkles,
    label: "Multi-Domain",
    prompt: "Schedule a project debrief on 2026-10-02 at 10:00 and create a task to review documentation beforehand"
  }
];

export function GoalInput({ onSubmit, isExecuting, disabled }) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!goal.trim() || isExecuting || disabled) return;
    onSubmit(goal.trim());
    setGoal('');
  };

  const handleSelectSuggestion = (suggestionPrompt) => {
    setGoal(suggestionPrompt);
  };

  return (
    <div className="w-full bg-dark-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a goal (e.g., 'Schedule a call next Monday at 3pm and add a follow-up prep task')..."
            rows={2}
            disabled={isExecuting || disabled}
            className="w-full bg-dark-950/70 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-24 border border-slate-700/60 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 outline-none transition resize-none text-sm font-sans"
          />
          <button
            type="submit"
            disabled={!goal.trim() || isExecuting || disabled}
            className="absolute right-2.5 bottom-2.5 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-95"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <span>Run Agent</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Goals:</span>
        </span>
        {SUGGESTIONS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(s.prompt)}
              disabled={isExecuting || disabled}
              className="text-xs bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/50 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-brand-400" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
`);

// src/components/ReasoningFeed.jsx
writeFile('src/components/ReasoningFeed.jsx', `
import React, { useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Wrench, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Terminal,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export function ReasoningFeed({ 
  steps = [], 
  isExecuting, 
  currentAction, 
  finalAnswer, 
  error, 
  goal 
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps, isExecuting, finalAnswer, error]);

  const renderToolArgs = (args) => {
    if (!args || Object.keys(args).length === 0) return null;
    return (
      <pre className="bg-dark-950/90 text-slate-300 p-2.5 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800/80 mt-1.5">
        {JSON.stringify(args, null, 2)}
      </pre>
    );
  };

  const renderToolResult = (result) => {
    if (!result) return null;
    let formatted = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    return (
      <div className="bg-dark-950/90 text-emerald-300/90 p-2.5 rounded-lg text-xs font-mono overflow-x-auto border border-emerald-950/60 mt-1.5 max-h-48">
        <pre>{formatted}</pre>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md min-h-[480px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-dark-900/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Live ReAct Reasoning Stream
          </h2>
          {steps.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </span>
          )}
        </div>
        
        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
            <span className="font-medium">Orchestrator Active</span>
          </div>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans">
        {goal && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              Active Goal
            </span>
            <p className="font-medium text-slate-200">{goal}</p>
          </div>
        )}

        {steps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <BrainCircuit className="w-12 h-12 mb-3 text-slate-700 stroke-1" />
            <p className="text-sm font-medium text-slate-400">Agent Idle — Awaiting Goal</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Type a goal or click a suggestion chip above. The agent will autonomously break down the goal, call tools, and request human confirmation for write actions.
            </p>
          </div>
        )}

        {/* Steps Loop */}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden shadow-sm animate-fade-in"
          >
            {/* Step Header */}
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                Step {step.step || idx + 1}
              </span>
              <span className="text-[11px] text-slate-400">
                {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* 1. REASON */}
              {step.thought && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>REASON (Thought)</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-5 leading-relaxed bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/30">
                    {step.thought}
                  </p>
                </div>
              )}

              {/* 2. ACT */}
              {step.tool && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>ACT (Tool Call)</span>
                    <span className="font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded text-[11px] border border-amber-500/20 ml-1">
                      {step.tool}
                    </span>
                    {step.isWriteAction && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/20 font-medium">
                        Write Guardrail
                      </span>
                    )}
                  </div>
                  <div className="pl-5">
                    {renderToolArgs(step.args)}
                  </div>
                </div>
              )}

              {/* 3. OBSERVE */}
              {step.result && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>OBSERVE (Result)</span>
                  </div>
                  <div className="pl-5">
                    {renderToolResult(step.result)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Current Execution State Indicator */}
        {isExecuting && (
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700/40 rounded-xl text-xs text-slate-300 animate-pulse">
            <BrainCircuit className="w-4 h-4 text-brand-400 animate-spin" />
            <div>
              <p className="font-medium text-slate-200">
                {currentAction ? \`Executing: \${currentAction}...\` : 'Analyzing next step in ReAct loop...'}
              </p>
              <p className="text-[11px] text-slate-400">Evaluating observations against available tools</p>
            </div>
          </div>
        )}

        {/* Final Completed Answer */}
        {finalAnswer && (
          <div className="border border-brand-500/40 bg-gradient-to-br from-brand-950/40 via-dark-900 to-emerald-950/30 rounded-xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              <span>Goal Achieved — Final Response</span>
            </div>
            <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed pl-6 font-sans">
              {finalAnswer}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border border-rose-500/40 bg-rose-950/30 rounded-xl p-4 shadow-lg text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Execution Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
`);

// src/components/ConfirmationModal.jsx
writeFile('src/components/ConfirmationModal.jsx', `
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Calendar, 
  CheckSquare, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';

export function ConfirmationModal({ 
  confirmation, 
  onConfirm, 
  onReject 
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!confirmation) return null;

  const { confirmationId, tool, args, description } = confirmation;

  const handleAction = async (approved) => {
    setSubmitting(true);
    try {
      if (approved) {
        await onConfirm(confirmationId);
      } else {
        await onReject(confirmationId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isCalendar = tool === 'create_calendar_event';
  const isTask = tool === 'create_task' || tool === 'complete_task';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-500/10 overflow-hidden relative">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Action Requires Approval
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                HITL Guardrail
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              The agent is requesting to execute a write action that will modify state.
            </p>
          </div>
        </div>

        {/* Details Box */}
        <div className="bg-dark-950/80 rounded-xl p-4 border border-slate-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Proposed Tool:</span>
            <span className="font-mono font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {tool}
            </span>
          </div>

          {/* Calendar specific breakdown */}
          {isCalendar && args && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-white font-semibold">{args.summary || 'Calendar Event'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 pl-5 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Start Time:</span>
                  <span className="font-mono text-emerald-400">{args.startDateTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">End Time:</span>
                  <span className="font-mono text-emerald-400">{args.endDateTime}</span>
                </div>
              </div>
              {args.description && (
                <div className="pl-5 text-[11px] text-slate-400">
                  <span className="text-slate-500 block">Description:</span>
                  <span>{args.description}</span>
                </div>
              )}
            </div>
          )}

          {/* Task specific breakdown */}
          {isTask && args && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-white font-semibold">
                  {tool === 'complete_task' ? \`Complete Task: \${args.title || args.taskId}\` : args.title}
                </span>
              </div>
              {args.priority && (
                <div className="pl-5 text-[11px] text-slate-300">
                  <span className="text-slate-500">Priority: </span>
                  <span className="font-semibold uppercase text-amber-400">{args.priority}</span>
                </div>
              )}
              {args.dueDate && (
                <div className="pl-5 text-[11px] text-slate-300">
                  <span className="text-slate-500">Due Date: </span>
                  <span className="font-mono text-emerald-400">{args.dueDate}</span>
                </div>
              )}
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-400 italic pt-1">
              "{description}"
            </p>
          )}
        </div>

        {/* Warning Note */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>If approved, this action will be executed and recorded in the audit log.</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Reject / Cancel</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-600 hover:to-brand-700 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Executing...' : 'Approve & Execute'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// src/components/TaskPanel.jsx
writeFile('src/components/TaskPanel.jsx', `
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';

export function TaskPanel() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | pending | completed
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await taskApi.getTasks();
      if (res?.tasks) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;
    try {
      setIsAdding(true);
      const res = await taskApi.createTask({
        title: newTitle.trim(),
        priority: newPriority,
      });
      if (res?.task) {
        setTasks(prev => [res.task, ...prev]);
        setNewTitle('');
      }
    } catch (err) {
      alert('Error creating task: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    if (currentStatus === 'completed') return;
    try {
      const res = await taskApi.completeTask(taskId);
      if (res?.task) {
        setTasks(prev => prev.map(t => t._id === taskId ? res.task : t));
      }
    } catch (err) {
      alert('Error completing task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-dark-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Database Tasks
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
          title="Refresh tasks"
        >
          <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-850/50 flex gap-2 text-xs">
        {['all', 'pending', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={\`px-2.5 py-1 rounded-lg capitalize transition \${
              filter === tab
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }\`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inline Add Task Form */}
      <form onSubmit={handleCreateTask} className="p-3 border-b border-slate-800/80 bg-dark-950/40 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Quick add new task..."
          className="flex-1 bg-slate-800/60 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs border border-slate-700/60 outline-none focus:border-brand-500"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="bg-slate-800/60 text-slate-300 rounded-lg px-2 py-1.5 text-xs border border-slate-700/60 outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <CheckCircle2 className="w-8 h-8 mb-2 text-slate-700" />
            <p className="text-xs font-medium text-slate-400">No tasks found</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tasks created directly or by the AI agent will appear here.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task._id}
                className={\`flex items-center justify-between p-2.5 rounded-xl border transition \${
                  isCompleted 
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-60' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                }\`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task._id, task.status)}
                    className="text-slate-400 hover:text-brand-400 flex-shrink-0 transition"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={\`text-xs font-medium truncate \${isCompleted ? 'line-through text-slate-400' : 'text-slate-200'}\`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={\`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded \${
                        task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                        task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-700 text-slate-300'
                      }\`}>
                        {task.priority || 'medium'}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition ml-2"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
`);

// src/components/AuditLogPanel.jsx
writeFile('src/components/AuditLogPanel.jsx', `
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { auditApi } from '../api/auditApi';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function AuditLogPanel() {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogsAndStats = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        auditApi.getLogs({ limit: 15 }),
        auditApi.getStats()
      ]);
      if (logsRes?.logs) setLogs(logsRes.logs);
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndStats();
  }, [isAuthenticated]);

  // Live WebSocket listener for newly dispatched audit logs
  useEffect(() => {
    if (!socket) return;
    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      // Update quick count
      setStats((prev) => prev ? {
        ...prev,
        totalActions: (prev.totalActions || 0) + 1,
        confirmedByUser: newLog.confirmedByUser ? (prev.confirmedByUser || 0) + 1 : prev.confirmedByUser,
      } : null);
    };

    socket.on('audit:new_log', handleNewLog);
    return () => {
      socket.off('audit:new_log', handleNewLog);
    };
  }, [socket]);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-dark-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Immutable Audit Trail
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {stats?.totalActions ?? logs.length} actions
          </span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
          title="Refresh audit trail"
        >
          <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-dark-950/60 border-b border-slate-800 text-xs">
          <div className="bg-slate-850/80 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Calls</span>
            <span className="text-sm font-bold text-slate-100 font-mono">{stats.totalActions || 0}</span>
          </div>
          <div className="bg-slate-850/80 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confirmed</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{stats.confirmedByUser || 0}</span>
          </div>
          <div className="bg-slate-850/80 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Success Rate</span>
            <span className="text-sm font-bold text-accent-400 font-mono">
              {stats.totalActions > 0 
                ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%'
                : '100%'}
            </span>
          </div>
        </div>
      )}

      {/* Log Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Layers className="w-8 h-8 mb-2 text-slate-700" />
            <p className="text-xs font-medium text-slate-400">No audit logs recorded yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Every tool invocation and human confirmation is logged immutably in MongoDB.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log._id;
            const isSuccess = log.status === 'success';

            return (
              <div 
                key={log._id || Math.random()}
                className="bg-slate-850/60 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition"
              >
                <div 
                  onClick={() => toggleExpand(log._id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isSuccess ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                      {log.tool}
                    </span>
                    {log.confirmedByUser ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium">
                        HITL Confirmed
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                        Read Action
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {log.executionDurationMs && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.executionDurationMs}ms
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Payload Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800 bg-dark-950/70 text-xs space-y-2">
                    {log.inputArgs && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">INPUT ARGS:</span>
                        <pre className="p-2 rounded bg-dark-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.inputArgs, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.outputResult && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">OUTPUT RESULT:</span>
                        <pre className="p-2 rounded bg-dark-950 text-emerald-400/90 font-mono text-[11px] overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.outputResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
`);

// src/components/SystemInfoModal.jsx
writeFile('src/components/SystemInfoModal.jsx', `
import React from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  GitBranch, 
  Database, 
  Zap, 
  Lock,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SystemInfoModal({ isOpen, onClose }) {
  const { health } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-accent-500/20 border border-accent-500/30 text-accent-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              TaskPilot Architecture & Engineering
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous ReAct Loop with Dual-Domain Tools and HITL Guardrails
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Card 1: Core Loop */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-brand-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>Hand-Built ReAct Loop (Zero LangChain / LangGraph)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              TaskPilot executes a native Reason → Act → Observe cyclic loop built from scratch in Node.js. The LLM acts purely as a reasoning engine producing structured tool calls, while the server enforces deterministic safety checks before calling external APIs.
            </p>
          </div>

          {/* Card 2: Security & HITL */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm-Before-Write (Human-in-the-Loop Guardrail)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Mutating actions (<code className="text-amber-300">create_calendar_event</code>, <code className="text-amber-300">create_task</code>, <code className="text-amber-300">complete_task</code>) physically halt the orchestrator loop, create a pending confirmation in MongoDB, and broadcast an approval request via WebSockets. No write operation can execute without an explicit cryptographic session token.
            </p>
          </div>

          {/* Card 3: Dual Domain Tools */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-accent-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>Active Tool Registry & Schemas</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-emerald-400 block font-semibold">check_calendar_availability</span>
                <span className="text-slate-400 text-[10px]">Read-only calendar check</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-amber-400 block font-semibold">create_calendar_event</span>
                <span className="text-slate-400 text-[10px]">Write action (requires HITL)</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-emerald-400 block font-semibold">list_tasks</span>
                <span className="text-slate-400 text-[10px]">Read-only internal task query</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-amber-400 block font-semibold">create_task / complete_task</span>
                <span className="text-slate-400 text-[10px]">Write actions (requires HITL)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Runtime Specs */}
          <div className="bg-dark-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>LLM Provider: <strong className="text-white">{health?.activeLlmProvider?.toUpperCase() || 'GROQ'}</strong></span>
            <span>Max Loop Cap: <strong className="text-white">6 Steps</strong></span>
            <span>Auth: <strong className="text-white">JWT + Google OAuth 2.0</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

console.log('UI components generated.');
