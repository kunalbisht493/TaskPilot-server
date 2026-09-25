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

console.log('Applying distinct surface hierarchy, single-accent restraint, and timeline trace feed...');

// 1. tailwind.config.js - Graphite/zinc palette with single action accent
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
        canvas: {
          DEFAULT: '#111215',
          subtle: '#16181c',
          muted: '#1c1f24',
          border: '#262a30',
          borderSubtle: '#1e2126',
        },
        action: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'step-arrival': 'stepArrival 0.15s ease-out',
      },
      keyframes: {
        stepArrival: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
`);

// 2. src/index.css - Flush layout, zero drop-shadows, subtle divider rules
writeFile('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #111215;
    color: #e4e4e7;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#111215];
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #2b3038;
}
::-webkit-scrollbar-thumb:hover {
  background: #3b424d;
}
`);

// 3. src/components/Header.jsx - Flush top bar, neutral secondary actions
writeFile('src/components/Header.jsx', `
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bot, Calendar, Check, LogOut, HelpCircle, ExternalLink, Cpu } from 'lucide-react';
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
    <header className="border-b border-canvas-border bg-canvas px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & status */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-canvas-muted border border-canvas-border flex items-center justify-center text-zinc-300">
            <Bot className="w-4 h-4 text-zinc-200" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-zinc-100 tracking-tight">TaskPilot</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">Agent Orchestration Console</span>
          </div>
        </div>

        {/* Runtime info */}
        <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Provider:</span>
            <span className="text-zinc-300 font-mono">
              {health?.activeLLMProvider ? health.activeLLMProvider.toUpperCase() : 'GROQ'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={\`w-2 h-2 rounded-full \${socketConnected ? 'bg-emerald-500' : 'bg-amber-600'}\`}></span>
            <span className="text-zinc-400">{socketConnected ? 'Live stream ready' : 'Connecting to gateway'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 bg-canvas-subtle hover:bg-canvas-muted border border-canvas-borderSubtle focus-ring"
            title="View system architecture"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              {isConnectedToCalendar ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Check className="w-3 h-3 text-emerald-500" />
                  Calendar connected
                </span>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-zinc-300 bg-canvas-subtle hover:bg-canvas-muted border border-canvas-borderSubtle focus-ring"
                >
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Connect Calendar
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </button>
              )}

              <div className="flex items-center gap-2 bg-canvas-subtle border border-canvas-borderSubtle rounded py-0.5 px-2 text-xs text-zinc-300">
                <span className="max-w-[120px] truncate">
                  {user?.name || user?.email || 'Authenticated'}
                </span>
                <button
                  onClick={logout}
                  className="text-zinc-500 hover:text-rose-400 p-0.5 focus-ring"
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
                className="px-2.5 py-1 rounded text-xs text-zinc-200 bg-canvas-muted hover:bg-zinc-800 border border-canvas-border focus-ring disabled:opacity-50"
              >
                {loggingIn ? 'Signing in...' : 'Dev Quick Login'}
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:inline-flex px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 bg-canvas-subtle border border-canvas-borderSubtle focus-ring"
              >
                Google OAuth
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
`);

// 4. src/components/GoalInput.jsx - Pinned prompt bar, ONE accent color on Run button
writeFile('src/components/GoalInput.jsx', `
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Check calendar', prompt: 'Check my calendar availability for next Tuesday afternoon' },
  { label: 'Schedule meeting', prompt: 'Schedule a sprint sync on 2026-09-30 at 14:00 for 30 minutes' },
  { label: 'Create task', prompt: 'Create a task to prepare presentation slides before Friday' },
  { label: 'Chained workflow', prompt: 'Schedule project debrief on 2026-10-02 at 10:00 and add a prep task' }
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
    <div className="bg-canvas-subtle border-b border-canvas-border p-4">
      <form onSubmit={handleSubmit} className="space-y-2.5">
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
            aria-label="Agent goal input"
            className="w-full bg-canvas text-zinc-100 placeholder-zinc-500 rounded p-2.5 pr-24 border border-canvas-border focus-ring text-xs resize-none disabled:opacity-50"
          />

          <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">
              {goal.length}/{MAX_LENGTH}
            </span>
            {/* The single primary accent color on the entire screen */}
            <button
              type="submit"
              disabled={!goal.trim() || isExecuting || disabled}
              className="px-3 py-1 rounded bg-action hover:bg-action-hover text-white text-xs font-medium flex items-center gap-1.5 focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Running</span>
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

        {/* Suggestion prompt chips - neutral styling */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] mr-1">Suggestions:</span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setGoal(item.prompt)}
              disabled={isExecuting || disabled}
              className="px-2 py-0.5 rounded bg-canvas hover:bg-canvas-muted text-zinc-400 hover:text-zinc-200 border border-canvas-borderSubtle text-[11px] focus-ring disabled:opacity-50"
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

// 5. src/components/ReasoningFeed.jsx - High-density Timeline / Terminal Execution Trace
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
    <div className="flex-1 flex flex-col bg-canvas min-h-[500px]">
      {/* Pane title bar */}
      <div className="px-4 py-2.5 border-b border-canvas-border flex items-center justify-between bg-canvas">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Live Execution Trace</span>
          {steps.length > 0 && (
            <span className="text-[10px] text-zinc-500 font-mono">
              ({steps.length} {steps.length === 1 ? 'step' : 'steps'})
            </span>
          )}
        </div>

        {isExecuting && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            <span>Loop active</span>
          </div>
        )}
      </div>

      {/* Trace Timeline Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {goal && (
          <div className="p-2.5 rounded bg-canvas-subtle border-l-2 border-zinc-600 text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-0.5">Active Request</span>
            <p className="text-zinc-200">{goal}</p>
          </div>
        )}

        {/* Honest, specific empty state */}
        {steps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <p className="text-xs text-zinc-400 font-medium">Trace idle</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-1">
              Enter a goal above. The agent will autonomously break it into Reason, Act, and Observe steps, streaming its tool parameters and awaiting your approval for write actions.
            </p>
          </div>
        )}

        {/* Timeline Trace Spine */}
        {steps.length > 0 && (
          <div className="relative pl-6 border-l border-zinc-800 space-y-5 my-2">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative space-y-2 motion-safe:animate-step-arrival"
              >
                {/* Node marker on vertical spine */}
                <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-canvas border border-zinc-700 text-[10px] font-mono text-zinc-400">
                  {idx + 1}
                </span>

                {/* Step header */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-mono text-zinc-400 font-medium">Cycle {step.step || idx + 1}</span>
                  <span className="font-mono">{step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}</span>
                </div>

                {/* 1. Reasoning Section */}
                {step.thought && (
                  <div className="pl-2 border-l border-zinc-750 text-xs text-zinc-300 leading-relaxed">
                    <span className="text-[10px] text-zinc-500 block mb-0.5 font-medium">Reasoning:</span>
                    <p>{step.thought}</p>
                  </div>
                )}

                {/* 2. Tool Invocation Section */}
                {step.tool && (
                  <div className="bg-canvas-subtle p-2.5 rounded border border-canvas-borderSubtle text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-zinc-500">$ call</span>
                        <span className="text-zinc-200 font-semibold">{step.tool}</span>
                      </div>
                      {step.isWriteAction && (
                        <span className="text-[10px] text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900">
                          Requires confirmation
                        </span>
                      )}
                    </div>
                    {step.args && Object.keys(step.args).length > 0 && (
                      <pre className="p-2 rounded bg-canvas text-zinc-400 font-mono text-[10px] overflow-x-auto border border-canvas-border">
                        {JSON.stringify(step.args, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* 3. Observation Section */}
                {step.result && (
                  <div className="bg-canvas-subtle p-2.5 rounded border border-canvas-borderSubtle text-xs space-y-1">
                    <span className="text-[10px] text-zinc-500 font-medium block">Observation:</span>
                    <div className="p-2 rounded bg-canvas text-zinc-300 font-mono text-[10px] overflow-x-auto border border-canvas-border max-h-36">
                      <pre>{typeof step.result === 'object' ? JSON.stringify(step.result, null, 2) : String(step.result)}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active execution indicator */}
        {isExecuting && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-canvas-subtle text-xs text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            <span>{currentAction || 'Evaluating next action in ReAct loop...'}</span>
          </div>
        )}

        {/* Final output */}
        {finalAnswer && (
          <div className="border border-zinc-700 bg-canvas-subtle rounded p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Goal completed</span>
            </div>
            <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed pl-5 font-sans">
              {finalAnswer}
            </p>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="border border-rose-900 bg-rose-950/20 rounded p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Execution halted</span>
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

// 6. src/components/TaskPanel.jsx - Clean operational checklist, zero card wrappers
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
    <div className="flex flex-col h-full bg-canvas-subtle">
      {/* Sub-bar: filter tabs and refresh */}
      <div className="p-2 border-b border-canvas-borderSubtle flex items-center justify-between text-xs">
        <div className="flex gap-1 text-xs">
          {['all', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={\`px-2 py-0.5 rounded text-[11px] capitalize \${
                filter === tab
                  ? 'bg-canvas-muted text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }\`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded focus-ring"
          title="Refresh tasks"
        >
          <RefreshCw className={\`w-3 h-3 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Task list - flat dividers, zero cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-canvas-borderSubtle">
        {filteredTasks.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-500 text-xs">
            <p>0 tasks in this view</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Tasks created directly or by the agent persist in MongoDB.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task._id}
                className="flex items-center justify-between py-2 px-3 hover:bg-canvas-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task._id, task.status)}
                    className="text-zinc-500 hover:text-zinc-300 flex-shrink-0 focus-ring rounded"
                    title={isCompleted ? 'Completed' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={\`text-xs truncate \${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}\`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="capitalize">{task.priority || 'medium'}</span>
                      {task.dueDate && (
                        <span className="font-mono">Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-zinc-600 hover:text-rose-400 p-1 focus-ring"
                  title="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Inline add task form at bottom */}
      <form onSubmit={handleCreateTask} className="p-2 border-t border-canvas-borderSubtle bg-canvas flex items-center gap-1.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={200}
          placeholder="Add a new task..."
          className="flex-1 bg-canvas-subtle text-zinc-200 placeholder-zinc-500 rounded px-2 py-1 text-xs border border-canvas-border focus-ring"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="bg-canvas-subtle text-zinc-400 rounded px-1.5 py-1 text-xs border border-canvas-border focus-ring"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium focus-ring disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
`);

// 7. src/components/AuditLogPanel.jsx - Compact semantic table, zero card wrappers
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
        auditApi.getLogs({ limit: 25 }),
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
      setLogs((prev) => [newLog, ...prev.slice(0, 29)]);
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
    <div className="flex flex-col h-full bg-canvas-subtle">
      {/* Sub-bar metrics */}
      <div className="p-2 border-b border-canvas-borderSubtle flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Total: <strong className="text-zinc-200">{stats?.totalActions ?? logs.length}</strong></span>
          <span>Confirmed: <strong className="text-zinc-200">{stats?.confirmedByUser || 0}</strong></span>
          <span>Success: <strong className="text-zinc-200">{stats?.totalActions > 0 ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%' : '100%'}</strong></span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded focus-ring"
          title="Refresh audit trail"
        >
          <RefreshCw className={\`w-3 h-3 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Semantic Table of Logs */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-500 text-xs">
            <p>0 actions logged</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Every tool invocation and confirmation is committed to MongoDB.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-canvas text-zinc-500 border-b border-canvas-borderSubtle sticky top-0 font-mono text-[10px]">
              <tr>
                <th className="py-1.5 px-3">TOOL</th>
                <th className="py-1.5 px-3">STATE</th>
                <th className="py-1.5 px-3">TIME</th>
                <th className="py-1.5 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-borderSubtle font-mono text-[11px]">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const isSuccess = log.status === 'success';

                return (
                  <React.Fragment key={log._id || Math.random()}>
                    <tr 
                      onClick={() => setExpandedId(prev => prev === log._id ? null : log._id)}
                      className="hover:bg-canvas-muted/40 cursor-pointer"
                    >
                      <td className="py-1.5 px-3 text-zinc-200 font-medium">
                        {log.tool}
                      </td>
                      <td className="py-1.5 px-3 text-[10px]">
                        <span className={\`inline-flex items-center gap-1 \${isSuccess ? 'text-zinc-400' : 'text-rose-400'}\`}>
                          {isSuccess ? <CheckCircle className="w-3 h-3 text-zinc-500" /> : <XCircle className="w-3 h-3" />}
                          {log.confirmedByUser ? 'Confirmed' : 'Read'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-zinc-500 text-[10px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                      </td>
                      <td className="py-1.5 px-2 text-right text-zinc-500">
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 inline" />
                        ) : (
                          <ChevronDown className="w-3 h-3 inline" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-canvas">
                        <td colSpan={4} className="p-2.5 border-t border-canvas-borderSubtle space-y-1.5 font-mono text-[10px]">
                          {log.inputArgs && (
                            <div>
                              <span className="text-zinc-500 block mb-0.5">Input:</span>
                              <pre className="p-1.5 rounded bg-canvas-subtle text-zinc-400 overflow-x-auto border border-canvas-borderSubtle">
                                {JSON.stringify(log.inputArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.outputResult && (
                            <div>
                              <span className="text-zinc-500 block mb-0.5">Output:</span>
                              <pre className="p-1.5 rounded bg-canvas-subtle text-zinc-300 overflow-x-auto border border-canvas-borderSubtle">
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

// 8. src/components/ConfirmationModal.jsx - Clean confirmation dialog, zero ambient glows
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div 
        role="dialog"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="bg-canvas border border-canvas-border rounded max-w-md w-full p-4 text-zinc-200"
      >
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="p-1.5 rounded bg-amber-950/40 border border-amber-900 text-amber-500 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-zinc-100">
              Confirmation required
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The agent proposed a mutating write action. Review parameters before approving.
            </p>
          </div>
        </div>

        {/* Parameters Box */}
        <div className="bg-canvas-subtle rounded border border-canvas-borderSubtle p-3 space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-canvas-borderSubtle">
            <span className="text-zinc-500">Tool:</span>
            <span className="font-mono text-zinc-200 bg-canvas px-1.5 py-0.5 rounded border border-canvas-border">
              {tool}
            </span>
          </div>

          {isCalendar && args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{args.summary || 'Calendar event'}</span>
              </div>
              <div className="text-zinc-400 pl-5 space-y-0.5 text-[11px] font-mono">
                <div>Start: {args.startDateTime}</div>
                <div>End:   {args.endDateTime}</div>
                {args.description && <div className="text-zinc-500 font-sans">Description: {args.description}</div>}
              </div>
            </div>
          )}

          {isTask && args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span>{tool === 'complete_task' ? \`Complete: \${args.title || args.taskId}\` : args.title}</span>
              </div>
              <div className="text-zinc-400 pl-5 text-[11px] space-y-0.5">
                {args.priority && <div>Priority: {args.priority}</div>}
                {args.dueDate && <div className="font-mono">Due: {args.dueDate}</div>}
              </div>
            </div>
          )}

          {description && (
            <p className="text-xs text-zinc-400 italic pt-1 border-t border-canvas-borderSubtle">
              "{description}"
            </p>
          )}
        </div>

        {/* Action controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-canvas-border bg-canvas-subtle hover:bg-canvas-muted text-zinc-300 text-xs font-medium focus-ring disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-action hover:bg-action-hover text-white text-xs font-medium focus-ring disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{submitting ? 'Executing...' : 'Approve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// 9. src/components/SystemInfoModal.jsx - Clean technical specs
writeFile('src/components/SystemInfoModal.jsx', `
import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SystemInfoModal({ isOpen, onClose }) {
  const { health } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div 
        role="dialog"
        aria-labelledby="sysinfo-title"
        aria-modal="true"
        className="bg-canvas border border-canvas-border rounded max-w-lg w-full p-5 text-zinc-200 relative max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 p-1 focus-ring"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 id="sysinfo-title" className="text-sm font-semibold text-zinc-100 mb-1">
          System Specifications
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          TaskPilot runtime architecture, security policies, and tool registration.
        </p>

        <div className="space-y-3 text-xs text-zinc-400">
          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-borderSubtle space-y-1">
            <span className="font-semibold text-zinc-200 block">ReAct Loop Architecture</span>
            <p className="leading-relaxed">
              Hand-built cyclic loop in Node.js executing Reason, Act, and Observe steps directly without LangChain or LangGraph dependencies. Enforces a hard cap of 6 maximum steps.
            </p>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-borderSubtle space-y-1">
            <span className="font-semibold text-zinc-200 block">Confirm-Before-Write Guardrail</span>
            <p className="leading-relaxed">
              Mutating tools pause orchestrator execution, persist state in MongoDB, and broadcast an approval request via WebSockets. No write executes without explicit confirmation.
            </p>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-borderSubtle space-y-1 font-mono text-[11px]">
            <span className="font-semibold text-zinc-200 font-sans block">Registered Tools</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>check_calendar_availability (read-only)</li>
              <li>create_calendar_event (write, requires approval)</li>
              <li>list_tasks (read-only)</li>
              <li>create_task, complete_task (write, requires approval)</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-borderSubtle flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Provider: {health?.activeLLMProvider?.toUpperCase() || 'GROQ'}</span>
            <span>Auth: HttpOnly JWT</span>
            <span>Port: 5174</span>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// 10. src/App.jsx - Seamless Two-Pane Workspace, zero card-in-card syndrome
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
    <div className="min-h-screen bg-canvas flex flex-col text-zinc-100 antialiased">
      {/* Flush top navigation */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main container */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col">
        {/* Unauthenticated notice */}
        {!isAuthenticated && (
          <div className="p-3 bg-canvas-subtle border-b border-canvas-border flex items-center justify-between text-xs text-zinc-300">
            <span>Development session inactive. Authenticate via Dev Quick Login to enable tool execution and confirmations.</span>
            <button
              onClick={() => devLogin()}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 focus-ring font-medium"
            >
              Dev Quick Login
            </button>
          </div>
        )}

        {/* Goal input header */}
        <GoalInput
          onSubmit={submitGoal}
          isExecuting={isExecuting}
          disabled={!isAuthenticated}
        />

        {/* Two-Pane Workspace Layout (Divided by single vertical border, NOT floating cards) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[580px] border-b border-canvas-border">
          {/* Left Pane: Execution Trace Timeline (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-canvas-border">
            <div className="px-4 py-1.5 border-b border-canvas-borderSubtle bg-canvas flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>SESSION: {conversationId.substring(0, 16)}</span>
              {steps.length > 0 && (
                <button
                  onClick={resetSession}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 font-sans focus-ring rounded"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <ReasoningFeed
              steps={steps}
              isExecuting={isExecuting}
              currentAction={currentAction}
              finalAnswer={finalAnswer}
              error={error}
              goal={activeGoal}
            />
          </div>

          {/* Right Pane: Operations & Ledger Workspace (5 cols, subtle background tonal contrast) */}
          <div className="lg:col-span-5 flex flex-col bg-canvas-subtle">
            {/* Tab selector */}
            <div className="flex border-b border-canvas-border bg-canvas text-xs font-medium">
              <button
                onClick={() => setActiveTab('tasks')}
                className={\`flex-1 py-2 px-3 text-center border-b-2 transition-colors \${
                  activeTab === 'tasks'
                    ? 'border-zinc-200 text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }\`}
              >
                Database Tasks
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={\`flex-1 py-2 px-3 text-center border-b-2 transition-colors \${
                  activeTab === 'audit'
                    ? 'border-zinc-200 text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }\`}
              >
                Action Audit Log
              </button>
            </div>

            {/* Selected panel view */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'tasks' ? (
                <TaskPanel />
              ) : (
                <AuditLogPanel />
              )}
            </div>
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

      {/* Architecture Specs Modal */}
      <SystemInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="py-3 px-6 text-center text-[11px] text-zinc-600 bg-canvas">
        TaskPilot • Autonomous MERN AI Agent with Hand-Built ReAct Loop and Human-in-the-Loop Confirmation
      </footer>
    </div>
  );
}
`);

console.log('Design refactor completed with distinct surfaces and single-accent discipline.');
