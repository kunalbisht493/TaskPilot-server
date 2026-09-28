import fs from 'fs';
import path from 'path';

const clientPath = path.resolve('../TaskPilot-client/src/components/ReasoningFeed.jsx');

const content = `import React, { useEffect, useRef } from 'react';
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
              ({steps.length} {steps.length === 1 ? 'cycle' : 'cycles'})
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
                  {step.step || idx + 1}
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
                          Awaiting user confirmation
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

                {/* 4. Active reasoning placeholder if waiting for tool */}
                {!step.thought && !step.tool && !step.result && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 italic py-1">
                    <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                    <span>Evaluating next action in cycle...</span>
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
`;

fs.writeFileSync(clientPath, content, 'utf8');
console.log('Successfully written to:', clientPath);
