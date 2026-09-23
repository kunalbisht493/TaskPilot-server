import { orchestrator } from '../orchestrator/orchestrator.js';
import { toolRegistry } from '../tools/index.js';

async function runTest() {
  console.log('====================================================');
  console.log('🤖 TaskPilot — ReAct Loop Verification Test (Phase 1)');
  console.log('====================================================\n');

  console.log('Registered Tools in Registry:');
  toolRegistry.getAllTools().forEach((t) => {
    console.log(`  - [${t.name}] (isWriteAction: ${t.isWriteAction}): ${t.description.slice(0, 70)}...`);
  });
  console.log('');

  const testGoal = 'What is the current date and time right now?';
  console.log(`🎯 Test Goal: "${testGoal}"\n`);

  const startTime = Date.now();

  const result = await orchestrator.run({
    goal: testGoal,
    conversationId: 'test_react_session_01',
    onStepUpdate: (event) => {
      switch (event.type) {
        case 'agent_started':
          console.log(`[ReAct Event] Agent started (Max Steps: ${event.maxSteps})`);
          break;
        case 'reasoning_start':
          console.log(`\n--- Step ${event.step} Reasoning ---`);
          break;
        case 'tool_call':
          console.log(`[ACT] Tool Call -> "${event.tool}"`);
          console.log(`      Args:`, JSON.stringify(event.args));
          console.log(`      Reasoning: ${event.reasoning}`);
          break;
        case 'tool_observation':
          console.log(`[OBSERVE] Result ->`, JSON.stringify(event.result));
          break;
        case 'final_answer':
          console.log(`\n🎉 [FINAL ANSWER]:\n${event.content}\n`);
          break;
        case 'confirmation_required':
          console.log(`⚠️  [GUARDRAIL] Confirmation needed for write action: ${event.tool}`);
          break;
        case 'max_steps_exceeded':
          console.log(`🛑 [TERMINATION] Max steps cap hit.`);
          break;
        default:
          break;
      }
    },
  });

  const duration = Date.now() - startTime;
  console.log('====================================================');
  console.log(`Execution Status: ${result.status.toUpperCase()}`);
  console.log(`Steps Taken: ${result.stepsTaken}`);
  console.log(`Duration: ${duration}ms`);
  console.log('====================================================\n');

  if (result.status === 'completed') {
    console.log('✅ Phase 1 Verification Passed: Raw ReAct loop executed Reason → Act → Observe successfully!');
    process.exit(0);
  } else {
    console.error('❌ Verification did not complete cleanly:', result);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
