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
  console.log(`Updated: ${relativePath}`);
}

console.log('Refactoring frontend code, security, and design system...');

// 1. vite.config.js - Port 5174
writeFile('vite.config.js', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
});
`);

// 2. tailwind.config.js - Clean, deliberate palette without neon or glowing accents
writeFile('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          700: '#334155',
          800: '#1e293b',
          850: '#161f30',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        status: {
          success: '#15803d',
          warning: '#b45309',
          danger: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'step-in': 'stepIn 0.18s ease-out',
      },
      keyframes: {
        stepIn: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
`);

// 3. src/index.css - Flat surfaces, zero glowing shadows, accessible focus rings
writeFile('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #0a0f1d;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

/* Accessible focus ring utility */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Minimal functional scrollbar */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
`);

// 4. src/api/client.js - Security rules 1.1, 1.2
writeFile('src/api/client.js', `
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Standard HTTP client adhering to Part 1 security rules:
 * - Credentials included for HttpOnly cookie persistence (no localStorage storage of JWT)
 * - Safe response parsing
 * - No sensitive data leakage in console logs
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : \`\${API_BASE}\${endpoint}\`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || \`Request failed with status \${res.status}\`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Clean error logging without leaking tokens
    console.error(\`API request failed [\${options.method || 'GET'} \${endpoint}]: \${err.message}\`);
    throw err;
  }
}
`);

// 5. src/components/Header.jsx - Clean design, no neon, no ALL-CAPS eyebrows, no gradient text
writeFile('src/components/Header.jsx', `
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Bot, 
  Calendar, 
  Check, 
  LogOut, 
  HelpCircle, 
  ExternalLink,
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
      alert('Login failed: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleConnect = () => {
    window.location.href = authApi.getGoogleConnectUrl();
  };

  return (
    <header className="border-b border-surface-800 bg-surface-900 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-slate-200">
            <Bot className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100 tracking-tight">TaskPilot</span>
              <span className="text-xs text-slate-400 font-normal">Personal AI Assistant</span>
            </div>
          </div>
        </div>

        {/* Center status indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 border-l border-r border-surface-800 px-4">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Model:</span>
            <span className="font-medium text-slate-200">
              {health?.activeLLMProvider ? health.activeLLMProvider.toUpperCase() : 'GROQ'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={\`w-2 h-2 rounded-full \${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}\`}></span>
            <span>{socketConnected ? 'Real-time feed connected' : 'Connecting to feed...'}</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-white bg-surface-850 hover:bg-surface-800 border border-surface-700 focus-ring transition-colors"
            title="System architecture specifications"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System details</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              {isConnectedToCalendar ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Calendar linked
                </span>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-200 bg-surface-800 hover:bg-surface-700 border border-surface-700 focus-ring"
                >
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Connect Google Calendar
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}

              <div className="flex items-center gap-2 bg-surface-850 border border-surface-700 rounded-md py-1 px-2.5 text-xs text-slate-300">
                <span className="font-medium max-w-[120px] truncate">
                  {user?.name || user?.email || 'Logged in'}
                </span>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-rose-400 p-0.5 ml-1 focus-ring"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDevLogin}
                disabled={loggingIn}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white focus-ring transition-colors disabled:opacity-50"
              >
                {loggingIn ? 'Authenticating...' : 'Dev Quick Login'}
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-surface-800 hover:bg-surface-700 border border-surface-700 focus-ring transition-colors"
              >
                Google Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
`);

// 6. src/components/GoalInput.jsx - Security rule 1.5 (maxLength, counter, disable submit)
writeFile('src/components/GoalInput.jsx', `
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Check availability', prompt: 'Check my calendar availability for next Tuesday afternoon' },
  { label: 'Schedule meeting', prompt: 'Schedule a sprint sync on 2026-09-30 at 14:00 for 30 minutes' },
  { label: 'Add task', prompt: 'Create a task to prepare presentation slides for mentor review before Friday' },
  { label: 'Multi-step action', prompt: 'Schedule a project debrief on 2026-10-02 at 10:00 and add a prep task' }
];

export function GoalInput({ onSubmit, isExecuting, disabled }) {
  const [goal, setGoal] = useState('');
  const MAX_LENGTH = 500;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!goal.trim() || isExecuting || disabled) return;
    onSubmit(goal.trim());
    setGoal('');
  };

  return (
    <div className="w-full bg-surface-900 border border-surface-800 rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={MAX_LENGTH}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a goal (e.g. Schedule a call with mentor next Tuesday and add a prep task)..."
            rows={2}
            disabled={isExecuting || disabled}
            aria-label="Agent request input"
            className="w-full bg-surface-950 text-slate-100 placeholder-slate-500 rounded-md p-3 pr-24 border border-surface-700 focus-ring text-sm resize-none disabled:opacity-60"
          />

          <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {goal.length}/{MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={!goal.trim() || isExecuting || disabled}
              className="px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs flex items-center gap-1.5 focus-ring disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing</span>
                </>
              ) : (
                <>
                  <span>Run goal</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestion pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium mr-1">Examples:</span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setGoal(item.prompt)}
              disabled={isExecuting || disabled}
              className="px-2.5 py-1 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 border border-surface-700 focus-ring transition-colors disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
`);

// 7. src/components/ReasoningFeed.jsx - Rule 1.3 (safe text rendering), Rule 2.1/2.2 (no em-dashes, no all-caps, single deliberate animation)
writeFile('src/components/ReasoningFeed.jsx', `
import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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

  return (
    <div className="flex-1 flex flex-col bg-surface-900 border border-surface-800 rounded-lg min-h-[460px] overflow-hidden">
      {/* Feed Header */}
      <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between bg-surface-900">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-200">Execution and Reasoning Feed</h2>
          {steps.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-800 text-slate-400 font-normal">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </span>
          )}
        </div>

        {isExecuting && (
          <div className="flex items-center gap-1.5 text-xs text-primary-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Orchestrator active</span>
          </div>
        )}
      </div>

      {/* Feed Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {goal && (
          <div className="bg-surface-950 p-3 rounded-md border border-surface-800 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Active request:</span>
            <p className="text-slate-200">{goal}</p>
          </div>
        )}

        {steps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <p className="text-sm font-medium text-slate-300">Agent waiting for request</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Enter a goal above. The agent will formulate steps, execute tools, and request your approval for write actions.
            </p>
          </div>
        )}

        {/* Timeline of steps with single deliberate animation */}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className="border border-surface-800 bg-surface-950 rounded-md p-3.5 space-y-3 motion-safe:animate-step-in"
          >
            {/* Step header */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-surface-850">
              <span className="font-medium text-slate-300">
                Step {step.step || idx + 1}
              </span>
              <span>{step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}</span>
            </div>

            {/* 1. Reasoning */}
            {step.thought && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Reasoning:</span>
                <p className="text-xs text-slate-200 pl-3 border-l-2 border-primary-600 leading-relaxed">
                  {step.thought}
                </p>
              </div>
            )}

            {/* 2. Tool invocation */}
            {step.tool && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-400">Tool requested:</span>
                  <span className="font-mono text-[11px] bg-surface-850 text-slate-200 px-2 py-0.5 rounded border border-surface-750">
                    {step.tool}
                  </span>
                  {step.isWriteAction && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900">
                      Write action (requires confirmation)
                    </span>
                  )}
                </div>
                {step.args && Object.keys(step.args).length > 0 && (
                  <pre className="p-2.5 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800">
                    {JSON.stringify(step.args, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* 3. Observation */}
            {step.result && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Observation:</span>
                <div className="p-2.5 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800 max-h-40">
                  <pre>{typeof step.result === 'object' ? JSON.stringify(step.result, null, 2) : String(step.result)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* In-progress status */}
        {isExecuting && (
          <div className="flex items-center gap-2 p-3 bg-surface-950 border border-surface-800 rounded-md text-xs text-slate-300">
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
            <span>{currentAction || 'Evaluating next action in ReAct loop...'}</span>
          </div>
        )}

        {/* Final output */}
        {finalAnswer && (
          <div className="border border-emerald-800/80 bg-surface-950 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Goal completed</span>
            </div>
            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pl-5">
              {finalAnswer}
            </p>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="border border-rose-900 bg-rose-950/30 rounded-md p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Execution error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
`);

// 8. src/components/ConfirmationModal.jsx - Rule 1.4, Rule 2.1 (no neon, no glowing blob)
writeFile('src/components/ConfirmationModal.jsx', `
import React, { useState } from 'react';
import { AlertCircle, Check, X, Calendar, CheckSquare } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        role="dialog"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="bg-surface-900 border border-surface-700 rounded-lg max-w-md w-full p-5 shadow-xl text-slate-200"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded bg-amber-950/60 border border-amber-800 text-amber-400 flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-slate-100">
              Confirmation required
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The agent proposed a write action. Review parameters before approving execution.
            </p>
          </div>
        </div>

        {/* Parameters Box */}
        <div className="bg-surface-950 rounded border border-surface-800 p-3 space-y-2.5 mb-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-surface-850">
            <span className="text-slate-400">Target tool:</span>
            <span className="font-mono text-slate-200 bg-surface-900 px-2 py-0.5 rounded border border-surface-800">
              {tool}
            </span>
          </div>

          {isCalendar && args && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{args.summary || 'Calendar event'}</span>
              </div>
              <div className="text-slate-300 pl-5 space-y-1 text-[11px]">
                <div><span className="text-slate-500">Start: </span><span className="font-mono">{args.startDateTime}</span></div>
                <div><span className="text-slate-500">End: </span><span className="font-mono">{args.endDateTime}</span></div>
                {args.description && <div><span className="text-slate-500">Description: </span><span>{args.description}</span></div>}
              </div>
            </div>
          )}

          {isTask && args && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{tool === 'complete_task' ? \`Complete: \${args.title || args.taskId}\` : args.title}</span>
              </div>
              <div className="text-slate-300 pl-5 text-[11px] space-y-0.5">
                {args.priority && <div><span className="text-slate-500">Priority: </span><span>{args.priority}</span></div>}
                {args.dueDate && <div><span className="text-slate-500">Due: </span><span className="font-mono">{args.dueDate}</span></div>}
              </div>
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-400 italic pt-1 border-t border-surface-850">
              "{description}"
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-surface-700 bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-medium focus-ring transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Reject action</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium focus-ring transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{submitting ? 'Executing...' : 'Approve action'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// 9. src/components/TaskPanel.jsx - Clean list, accessible, input maxLength
writeFile('src/components/TaskPanel.jsx', `
import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, Plus, RefreshCw } from 'lucide-react';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';

export function TaskPanel() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await taskApi.getTasks();
      if (res?.tasks) setTasks(res.tasks);
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
    <div className="bg-surface-900 border border-surface-800 rounded-lg flex flex-col h-[480px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-200">Database Tasks</h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-800 text-slate-400">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded focus-ring transition-colors"
          title="Refresh task list"
        >
          <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3.5 py-2 border-b border-surface-800 bg-surface-950 flex gap-2 text-xs">
        {['all', 'pending', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={\`px-2.5 py-1 rounded text-xs capitalize transition-colors \${
              filter === tab
                ? 'bg-surface-800 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }\`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inline Add Task Form */}
      <form onSubmit={handleCreateTask} className="p-3 border-b border-surface-800 bg-surface-900 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={200}
          placeholder="New task title..."
          className="flex-1 bg-surface-950 text-slate-200 placeholder-slate-500 rounded px-2.5 py-1.5 text-xs border border-surface-700 focus-ring"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="bg-surface-950 text-slate-300 rounded px-2 py-1.5 text-xs border border-surface-700 focus-ring"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-2.5 py-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium focus-ring transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <p className="text-xs text-slate-400">No tasks in this view</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task._id}
                className={\`flex items-center justify-between p-2.5 rounded border transition-colors \${
                  isCompleted 
                    ? 'bg-surface-950/60 border-surface-850 opacity-60' 
                    : 'bg-surface-950 border-surface-800 hover:border-surface-700'
                }\`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task._id, task.status)}
                    className="text-slate-400 hover:text-slate-200 flex-shrink-0 focus-ring rounded"
                    title={isCompleted ? 'Completed' : 'Mark complete'}
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
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-slate-400 capitalize">
                        {task.priority || 'medium'}
                      </span>
                      {task.dueDate && (
                        <span className="text-slate-400 font-mono">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded focus-ring transition-colors ml-2"
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

// 10. src/components/AuditLogPanel.jsx - Real Semantic Table, rule 2.1
writeFile('src/components/AuditLogPanel.jsx', `
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
        auditApi.getLogs({ limit: 20 }),
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

  useEffect(() => {
    if (!socket) return;
    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 24)]);
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

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg flex flex-col h-[480px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-200">Action Audit Trail</h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-800 text-slate-400">
            {stats?.totalActions ?? logs.length} logged
          </span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded focus-ring transition-colors"
          title="Refresh audit trail"
        >
          <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Summary stats row */}
      {stats && (
        <div className="grid grid-cols-3 divide-x divide-surface-800 border-b border-surface-800 bg-surface-950 text-xs">
          <div className="p-2 text-center">
            <span className="text-[11px] text-slate-400 block">Total actions</span>
            <span className="font-semibold text-slate-200">{stats.totalActions || 0}</span>
          </div>
          <div className="p-2 text-center">
            <span className="text-[11px] text-slate-400 block">Confirmed</span>
            <span className="font-semibold text-slate-200">{stats.confirmedByUser || 0}</span>
          </div>
          <div className="p-2 text-center">
            <span className="text-[11px] text-slate-400 block">Success rate</span>
            <span className="font-semibold text-slate-200">
              {stats.totalActions > 0 
                ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%' 
                : '100%'}
            </span>
          </div>
        </div>
      )}

      {/* Semantic Table of Logs */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4 text-xs text-slate-500">
            No audit records found
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-surface-950 text-slate-400 border-b border-surface-800 sticky top-0">
              <tr>
                <th className="py-2 px-3 font-medium">Tool</th>
                <th className="py-2 px-3 font-medium">State</th>
                <th className="py-2 px-3 font-medium">Time</th>
                <th className="py-2 px-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-850">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const isSuccess = log.status === 'success';

                return (
                  <React.Fragment key={log._id || Math.random()}>
                    <tr 
                      onClick={() => setExpandedId(prev => prev === log._id ? null : log._id)}
                      className="hover:bg-surface-850 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-200">
                        {log.tool}
                      </td>
                      <td className="py-2 px-3">
                        <span className={\`inline-flex items-center gap-1 text-[11px] \${isSuccess ? 'text-emerald-400' : 'text-rose-400'}\`}>
                          {isSuccess ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.confirmedByUser ? 'Confirmed' : 'Read'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 inline text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 inline text-slate-400" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-950">
                        <td colSpan={4} className="p-3 border-t border-surface-850 space-y-2">
                          {log.inputArgs && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-medium block mb-1">Input arguments:</span>
                              <pre className="p-2 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800">
                                {JSON.stringify(log.inputArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.outputResult && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-medium block mb-1">Output result:</span>
                              <pre className="p-2 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800">
                                {JSON.stringify(log.outputResult, null, 2)}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
`);

// 11. src/components/SystemInfoModal.jsx - Clean architectural specs
writeFile('src/components/SystemInfoModal.jsx', `
import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SystemInfoModal({ isOpen, onClose }) {
  const { health } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div 
        role="dialog"
        aria-labelledby="sysinfo-title"
        aria-modal="true"
        className="bg-surface-900 border border-surface-700 rounded-lg max-w-xl w-full p-5 text-slate-200 relative max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded focus-ring"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 id="sysinfo-title" className="text-sm font-semibold text-slate-100 mb-1">
          System architecture specifications
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          TaskPilot technical boundaries, tools, and security mechanisms.
        </p>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1">
            <span className="font-semibold text-slate-200 block">ReAct Loop Architecture</span>
            <p className="leading-relaxed text-slate-400">
              Hand-built cyclic loop in Node.js executing Reason, Act, and Observe steps directly without LangChain or LangGraph dependencies. Hardcapped at 6 maximum steps to prevent runaway loops.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1">
            <span className="font-semibold text-slate-200 block">Security and Guardrails</span>
            <p className="leading-relaxed text-slate-400">
              Confirm-before-write policy enforced server-side. Mutating tools pause the execution cycle, record pending state in MongoDB, and broadcast an approval request via WebSockets.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1">
            <span className="font-semibold text-slate-200 block">Active Tools</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400 font-mono text-[11px]">
              <li>check_calendar_availability (read-only)</li>
              <li>create_calendar_event (write, requires approval)</li>
              <li>list_tasks (read-only)</li>
              <li>create_task, complete_task (write, requires approval)</li>
            </ul>
          </div>

          <div className="p-3 rounded bg-surface-950 border border-surface-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Provider: <strong className="text-slate-200">{health?.activeLLMProvider?.toUpperCase() || 'GROQ'}</strong></span>
            <span>Auth: <strong className="text-slate-200">JWT (HttpOnly)</strong></span>
            <span>Client port: <strong className="text-slate-200">5174</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// 12. src/App.jsx - Flat surfaces, clean layout, no gradient washes
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
import { RotateCcw } from 'lucide-react';

export default function App() {
  const { isAuthenticated, devLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
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
    <div className="min-h-screen bg-surface-950 flex flex-col text-slate-100">
      {/* Header */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Unauthenticated Quick Banner */}
        {!isAuthenticated && (
          <div className="p-3.5 rounded-lg bg-surface-900 border border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-300">
              Not currently logged in. Run Dev Quick Login to test tool execution and confirmations.
            </p>
            <button
              onClick={() => devLogin()}
              className="px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium focus-ring whitespace-nowrap"
            >
              Dev Quick Login
            </button>
          </div>
        )}

        {/* Goal Input Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Session: <span className="font-mono">{conversationId.substring(0, 16)}</span></span>
            {steps.length > 0 && (
              <button
                onClick={resetSession}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors focus-ring rounded"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset conversation</span>
              </button>
            )}
          </div>

          <GoalInput
            onSubmit={submitGoal}
            isExecuting={isExecuting}
            disabled={!isAuthenticated}
          />
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Live Reasoning Feed (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <ReasoningFeed
              steps={steps}
              isExecuting={isExecuting}
              currentAction={currentAction}
              finalAnswer={finalAnswer}
              error={error}
              goal={activeGoal}
            />
          </div>

          {/* Right Column: Tabbed Task and Audit Workspace (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex border-b border-surface-800 gap-4 text-xs font-medium">
              <button
                onClick={() => setActiveTab('tasks')}
                className={\`pb-2.5 transition-colors border-b-2 \${
                  activeTab === 'tasks'
                    ? 'border-primary-600 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }\`}
              >
                Database tasks
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={\`pb-2.5 transition-colors border-b-2 \${
                  activeTab === 'audit'
                    ? 'border-primary-600 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }\`}
              >
                Action audit trail
              </button>
            </div>

            {activeTab === 'tasks' ? (
              <TaskPanel />
            ) : (
              <AuditLogPanel />
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {pendingConfirmation && (
        <ConfirmationModal
          confirmation={pendingConfirmation}
          onConfirm={() => submitConfirmation(true)}
          onReject={() => submitConfirmation(false)}
        />
      )}

      {/* Architecture Modal */}
      <SystemInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-surface-900 py-4 px-6 text-center text-xs text-slate-500">
        TaskPilot • Autonomous MERN AI Agent with Hand-Built ReAct Loop and Human-in-the-Loop Confirmation
      </footer>
    </div>
  );
}
`);

console.log('All frontend files refactored as per rules.md.');
