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

console.log('Transforming TaskPilot-client to clean, professional White/Light theme & removing provider...');

// 1. index.html - Remove "dark" class from html
writeFile('index.html', `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23111827'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TaskPilot — Autonomous AI ReAct Agent</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body class="bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-200 selection:text-zinc-900 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

// 2. tailwind.config.js - Clean Light Theme tokens
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
          DEFAULT: '#ffffff',
          subtle: '#f9fafb',
          muted: '#f3f4f6',
          border: '#e5e7eb',
          borderSubtle: '#f3f4f6',
        },
        brand: {
          primary: '#0f172a', // Solid crisp charcoal for the single primary action
          primaryHover: '#1e293b',
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

// 3. src/index.css - Light theme base & scrollbar
writeFile('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #ffffff;
    color: #0f172a;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 focus-visible:ring-offset-white;
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
  background: #d1d5db;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
`);

// 4. src/components/Header.jsx - Provider REMOVED, clean professional white header
writeFile('src/components/Header.jsx', `
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bot, Calendar, Check, LogOut, HelpCircle, ExternalLink } from 'lucide-react';
import { authApi } from '../api/authApi';

export function Header({ onOpenInfo }) {
  const { user, isAuthenticated, isConnectedToCalendar, devLogin, logout } = useAuth();
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
    <header className="border-b border-canvas-border bg-white px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-zinc-900 tracking-tight">TaskPilot</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">Autonomous Agent</span>
          </div>
        </div>

        {/* Center: Live stream indicator only (Provider completely removed as requested) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-600">
          <span className={\`w-2 h-2 rounded-full \${socketConnected ? 'bg-emerald-600' : 'bg-amber-500'}\`}></span>
          <span>{socketConnected ? 'Real-time stream connected' : 'Connecting to gateway'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring"
            title="System specifications"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              {isConnectedToCalendar ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Calendar linked
                </span>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-zinc-700 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring"
                >
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  Connect Calendar
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </button>
              )}

              <div className="flex items-center gap-2 bg-canvas-subtle border border-canvas-border rounded py-0.5 px-2 text-xs text-zinc-800">
                <span className="max-w-[120px] truncate font-medium">
                  {user?.name || user?.email || 'Logged in'}
                </span>
                <button
                  onClick={logout}
                  className="text-zinc-400 hover:text-rose-600 p-0.5 focus-ring"
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
                className="px-2.5 py-1 rounded text-xs text-zinc-800 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring disabled:opacity-50"
              >
                {loggingIn ? 'Authenticating...' : 'Dev Quick Login'}
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:inline-flex px-2.5 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring"
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

// 5. src/components/GoalInput.jsx - Crisp light prompt, solid primary action button
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
            className="w-full bg-white text-zinc-900 placeholder-zinc-400 rounded p-2.5 pr-24 border border-canvas-border focus-ring text-xs resize-none disabled:opacity-50"
          />

          <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-mono">
              {goal.length}/{MAX_LENGTH}
            </span>
            {/* The single primary accent action: solid crisp dark charcoal button */}
            <button
              type="submit"
              disabled={!goal.trim() || isExecuting || disabled}
              className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
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

        {/* Suggestion prompt chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] mr-1">Suggestions:</span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setGoal(item.prompt)}
              disabled={isExecuting || disabled}
              className="px-2 py-0.5 rounded bg-white hover:bg-canvas-muted text-zinc-600 hover:text-zinc-900 border border-canvas-border text-[11px] focus-ring disabled:opacity-50 transition-colors"
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

// 6. src/components/ReasoningFeed.jsx - Crisp light execution trace timeline
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
    <div className="flex-1 flex flex-col bg-white min-h-[500px]">
      {/* Pane title bar */}
      <div className="px-4 py-2.5 border-b border-canvas-border flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-800">Live Execution Trace</span>
          {steps.length > 0 && (
            <span className="text-[10px] text-zinc-500 font-mono">
              ({steps.length} {steps.length === 1 ? 'step' : 'steps'})
            </span>
          )}
        </div>

        {isExecuting && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
            <span>Loop active</span>
          </div>
        )}
      </div>

      {/* Trace Timeline Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {goal && (
          <div className="p-2.5 rounded bg-canvas-subtle border-l-2 border-zinc-800 text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-0.5 font-medium">Active Request</span>
            <p className="text-zinc-800">{goal}</p>
          </div>
        )}

        {/* Empty state */}
        {steps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <p className="text-xs text-zinc-700 font-medium">Trace idle</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-1">
              Enter a goal above. The agent will autonomously break it into Reason, Act, and Observe steps, streaming its tool parameters and awaiting your approval for write actions.
            </p>
          </div>
        )}

        {/* Timeline Trace Spine */}
        {steps.length > 0 && (
          <div className="relative pl-6 border-l border-zinc-200 space-y-5 my-2">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative space-y-2 motion-safe:animate-step-arrival"
              >
                {/* Node marker on vertical spine */}
                <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-zinc-300 text-[10px] font-mono text-zinc-600 font-medium">
                  {idx + 1}
                </span>

                {/* Step header */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-mono text-zinc-700 font-semibold">Cycle {step.step || idx + 1}</span>
                  <span className="font-mono">{step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}</span>
                </div>

                {/* 1. Reasoning Section */}
                {step.thought && (
                  <div className="pl-2 border-l border-zinc-300 text-xs text-zinc-700 leading-relaxed">
                    <span className="text-[10px] text-zinc-500 block mb-0.5 font-medium">Reasoning:</span>
                    <p>{step.thought}</p>
                  </div>
                )}

                {/* 2. Tool Invocation Section */}
                {step.tool && (
                  <div className="bg-canvas-subtle p-2.5 rounded border border-canvas-border text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-zinc-500">$ call</span>
                        <span className="text-zinc-900 font-semibold">{step.tool}</span>
                      </div>
                      {step.isWriteAction && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Requires confirmation
                        </span>
                      )}
                    </div>
                    {step.args && Object.keys(step.args).length > 0 && (
                      <pre className="p-2 rounded bg-white text-zinc-700 font-mono text-[10px] overflow-x-auto border border-canvas-border">
                        {JSON.stringify(step.args, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* 3. Observation Section */}
                {step.result && (
                  <div className="bg-canvas-subtle p-2.5 rounded border border-canvas-border text-xs space-y-1">
                    <span className="text-[10px] text-zinc-500 font-medium block">Observation:</span>
                    <div className="p-2 rounded bg-white text-zinc-800 font-mono text-[10px] overflow-x-auto border border-canvas-border max-h-36">
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
          <div className="flex items-center gap-2 p-2.5 rounded bg-canvas-subtle border border-canvas-border text-xs text-zinc-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
            <span>{currentAction || 'Evaluating next action in ReAct loop...'}</span>
          </div>
        )}

        {/* Final output */}
        {finalAnswer && (
          <div className="border border-emerald-200 bg-emerald-50/50 rounded p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Goal completed</span>
            </div>
            <p className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed pl-5 font-sans">
              {finalAnswer}
            </p>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded p-3 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
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

// 7. src/components/TaskPanel.jsx - Clean checklist on light surface
writeFile('src/components/TaskPanel.jsx', `
import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, RefreshCw } from 'lucide-react';
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
      <div className="p-2 border-b border-canvas-border flex items-center justify-between text-xs bg-white">
        <div className="flex gap-1 text-xs">
          {['all', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={\`px-2 py-0.5 rounded text-[11px] capitalize \${
                filter === tab
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-700'
              }\`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-700 p-1 rounded focus-ring"
          title="Refresh tasks"
        >
          <RefreshCw className={\`w-3 h-3 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto divide-y divide-canvas-border bg-white">
        {filteredTasks.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-400 text-xs">
            <p>0 tasks in this view</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Tasks created directly or by the agent persist in MongoDB.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task._id}
                className="flex items-center justify-between py-2 px-3 hover:bg-canvas-subtle transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task._id, task.status)}
                    className="text-zinc-400 hover:text-zinc-700 flex-shrink-0 focus-ring rounded"
                    title={isCompleted ? 'Completed' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-3.5 h-3.5 text-zinc-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={\`text-xs truncate \${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-800'}\`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="capitalize">{task.priority || 'medium'}</span>
                      {task.dueDate && (
                        <span className="font-mono">Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-zinc-400 hover:text-rose-600 p-1 focus-ring"
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
      <form onSubmit={handleCreateTask} className="p-2 border-t border-canvas-border bg-canvas-subtle flex items-center gap-1.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={200}
          placeholder="Add a new task..."
          className="flex-1 bg-white text-zinc-800 placeholder-zinc-400 rounded px-2 py-1 text-xs border border-canvas-border focus-ring"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="bg-white text-zinc-600 rounded px-1.5 py-1 text-xs border border-canvas-border focus-ring"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium focus-ring disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
`);

// 8. src/components/AuditLogPanel.jsx - Crisp light semantic table
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
      <div className="p-2 border-b border-canvas-border flex items-center justify-between text-xs text-zinc-500 bg-white">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Total: <strong className="text-zinc-800">{stats?.totalActions ?? logs.length}</strong></span>
          <span>Confirmed: <strong className="text-zinc-800">{stats?.confirmedByUser || 0}</strong></span>
          <span>Success: <strong className="text-zinc-800">{stats?.totalActions > 0 ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%' : '100%'}</strong></span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-700 p-1 rounded focus-ring"
          title="Refresh audit trail"
        >
          <RefreshCw className={\`w-3 h-3 \${loading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      {/* Semantic Table of Logs */}
      <div className="flex-1 overflow-y-auto bg-white">
        {logs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-400 text-xs">
            <p>0 actions logged</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Every tool invocation and confirmation is committed to MongoDB.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-canvas-subtle text-zinc-500 border-b border-canvas-border sticky top-0 font-mono text-[10px]">
              <tr>
                <th className="py-1.5 px-3">TOOL</th>
                <th className="py-1.5 px-3">STATE</th>
                <th className="py-1.5 px-3">TIME</th>
                <th className="py-1.5 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-border font-mono text-[11px]">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const isSuccess = log.status === 'success';

                return (
                  <React.Fragment key={log._id || Math.random()}>
                    <tr 
                      onClick={() => setExpandedId(prev => prev === log._id ? null : log._id)}
                      className="hover:bg-canvas-subtle cursor-pointer"
                    >
                      <td className="py-1.5 px-3 text-zinc-900 font-medium">
                        {log.tool}
                      </td>
                      <td className="py-1.5 px-3 text-[10px]">
                        <span className={\`inline-flex items-center gap-1 \${isSuccess ? 'text-zinc-600' : 'text-rose-600'}\`}>
                          {isSuccess ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3" />}
                          {log.confirmedByUser ? 'Confirmed' : 'Read'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-zinc-400 text-[10px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                      </td>
                      <td className="py-1.5 px-2 text-right text-zinc-400">
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 inline" />
                        ) : (
                          <ChevronDown className="w-3 h-3 inline" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-canvas-subtle">
                        <td colSpan={4} className="p-2.5 border-t border-canvas-border space-y-1.5 font-mono text-[10px]">
                          {log.inputArgs && (
                            <div>
                              <span className="text-zinc-500 block mb-0.5 font-sans">Input arguments:</span>
                              <pre className="p-1.5 rounded bg-white text-zinc-800 overflow-x-auto border border-canvas-border">
                                {JSON.stringify(log.inputArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.outputResult && (
                            <div>
                              <span className="text-zinc-500 block mb-0.5 font-sans">Output result:</span>
                              <pre className="p-1.5 rounded bg-white text-zinc-800 overflow-x-auto border border-canvas-border">
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

// 9. src/components/ConfirmationModal.jsx - Clean light modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="bg-white border border-canvas-border rounded-lg max-w-md w-full p-4 text-zinc-900 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-zinc-900">
              Confirmation required
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              The agent proposed a mutating write action. Review parameters before approving.
            </p>
          </div>
        </div>

        {/* Parameters Box */}
        <div className="bg-canvas-subtle rounded border border-canvas-border p-3 space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-canvas-border">
            <span className="text-zinc-500">Target tool:</span>
            <span className="font-mono text-zinc-800 bg-white px-1.5 py-0.5 rounded border border-canvas-border font-medium">
              {tool}
            </span>
          </div>

          {isCalendar && args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{args.summary || 'Calendar event'}</span>
              </div>
              <div className="text-zinc-600 pl-5 space-y-0.5 text-[11px] font-mono">
                <div>Start: {args.startDateTime}</div>
                <div>End:   {args.endDateTime}</div>
                {args.description && <div className="text-zinc-500 font-sans">Description: {args.description}</div>}
              </div>
            </div>
          )}

          {isTask && args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
                <span>{tool === 'complete_task' ? \`Complete: \${args.title || args.taskId}\` : args.title}</span>
              </div>
              <div className="text-zinc-600 pl-5 text-[11px] space-y-0.5">
                {args.priority && <div>Priority: {args.priority}</div>}
                {args.dueDate && <div className="font-mono">Due: {args.dueDate}</div>}
              </div>
            </div>
          )}

          {description && (
            <p className="text-xs text-zinc-500 italic pt-1 border-t border-canvas-border">
              "{description}"
            </p>
          )}
        </div>

        {/* Action controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-canvas-border bg-white hover:bg-canvas-subtle text-zinc-700 text-xs font-medium focus-ring disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium focus-ring disabled:opacity-50"
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

// 10. src/components/SystemInfoModal.jsx - Provider REMOVED, clean light specs
writeFile('src/components/SystemInfoModal.jsx', `
import React from 'react';
import { X } from 'lucide-react';

export function SystemInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-labelledby="sysinfo-title"
        aria-modal="true"
        className="bg-white border border-canvas-border rounded-lg max-w-lg w-full p-5 text-zinc-900 shadow-xl relative max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1 focus-ring"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 id="sysinfo-title" className="text-sm font-semibold text-zinc-900 mb-1">
          System Architecture
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          TaskPilot technical boundaries, tools, and security mechanisms.
        </p>

        <div className="space-y-3 text-xs text-zinc-600">
          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1">
            <span className="font-semibold text-zinc-800 block">ReAct Loop Architecture</span>
            <p className="leading-relaxed">
              Hand-built cyclic loop in Node.js executing Reason, Act, and Observe steps directly without LangChain or LangGraph dependencies. Enforces a cap of 6 maximum steps.
            </p>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1">
            <span className="font-semibold text-zinc-800 block">Confirm-Before-Write Policy</span>
            <p className="leading-relaxed">
              Mutating tools pause orchestrator execution, persist state in MongoDB, and broadcast an approval request via WebSockets. No write executes without explicit confirmation.
            </p>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1 font-mono text-[11px]">
            <span className="font-semibold text-zinc-800 font-sans block">Registered Tools</span>
            <ul className="list-disc pl-4 space-y-0.5 text-zinc-700">
              <li>check_calendar_availability (read-only)</li>
              <li>create_calendar_event (write, requires approval)</li>
              <li>list_tasks (read-only)</li>
              <li>create_task, complete_task (write, requires approval)</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Auth: HttpOnly JWT</span>
            <span>Port: 5174</span>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// 11. src/App.jsx - Clean White / Light theme layout
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
    <div className="min-h-screen bg-white flex flex-col text-zinc-900 antialiased">
      {/* Flush top navigation */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main container */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col">
        {/* Unauthenticated notice */}
        {!isAuthenticated && (
          <div className="p-3 bg-canvas-subtle border-b border-canvas-border flex items-center justify-between text-xs text-zinc-700">
            <span>Development session inactive. Authenticate via Dev Quick Login to enable tool execution and confirmations.</span>
            <button
              onClick={() => devLogin()}
              className="px-2.5 py-1 rounded bg-white hover:bg-zinc-50 text-zinc-900 border border-canvas-border focus-ring font-medium"
            >
              Dev Quick Login
            </button>
          </div>
        )}

        {/* Goal input bar */}
        <GoalInput
          onSubmit={submitGoal}
          isExecuting={isExecuting}
          disabled={!isAuthenticated}
        />

        {/* Two-Pane Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[580px] border-b border-canvas-border">
          {/* Left Pane: Execution Trace Timeline (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-canvas-border">
            <div className="px-4 py-1.5 border-b border-canvas-border bg-white flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>SESSION: {conversationId.substring(0, 16)}</span>
              {steps.length > 0 && (
                <button
                  onClick={resetSession}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-sans focus-ring rounded"
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
            <div className="flex border-b border-canvas-border bg-white text-xs font-medium">
              <button
                onClick={() => setActiveTab('tasks')}
                className={\`flex-1 py-2 px-3 text-center border-b-2 transition-colors \${
                  activeTab === 'tasks'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }\`}
              >
                Database Tasks
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={\`flex-1 py-2 px-3 text-center border-b-2 transition-colors \${
                  activeTab === 'audit'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
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
      <footer className="py-3 px-6 text-center text-[11px] text-zinc-400 bg-white">
        TaskPilot • Autonomous MERN AI Agent with Hand-Built ReAct Loop and Human-in-the-Loop Confirmation
      </footer>
    </div>
  );
}
`);

console.log('Clean White/Light professional theme applied and provider removed.');
