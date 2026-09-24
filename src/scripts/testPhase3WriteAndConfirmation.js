import { toolRegistry } from '../tools/index.js';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { confirmationService } from '../services/confirmationService.js';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('🧪 TaskPilot — Phase 3 Verification Test Suite');
  console.log('   (Write Actions & Human-in-the-Loop Confirmation)');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // ----------------------------------------------------
  // Test 1: Tool Registry Registration & Write Classification
  // ----------------------------------------------------
  console.log('\n--- 1. Write Tool Registration & Guardrail Classification ---');
  const writeTool = toolRegistry.getTool('create_calendar_event');
  assert(writeTool !== undefined, 'Tool "create_calendar_event" is registered in tool registry');
  assert(writeTool.isWriteAction === true, 'Tool is strictly marked as a mutating write action (isWriteAction: true)');
  assert(typeof writeTool.execute === 'function', 'Tool has an executable handler function');

  // ----------------------------------------------------
  // Test 2: Multi-Provider Schema Generation (ADR-018)
  // ----------------------------------------------------
  console.log('\n--- 2. Multi-Provider Schema Compatibility ---');
  const geminiDecls = toolRegistry.getGeminiFunctionDeclarations();
  const geminiWrite = geminiDecls.find((t) => t.name === 'create_calendar_event');
  assert(geminiWrite !== undefined, 'Gemini function declaration exists for create_calendar_event');
  assert(
    geminiWrite.parameters.properties.description.nullable === true,
    'Gemini schema correctly normalizes optional description with nullable: true'
  );

  const groqDecls = toolRegistry.getGroqToolDeclarations();
  const groqWrite = groqDecls.find((t) => t.function.name === 'create_calendar_event');
  assert(groqWrite !== undefined, 'Groq tool declaration exists for create_calendar_event');
  assert(
    Array.isArray(groqWrite.function.parameters.properties.description.type),
    'Groq schema preserves union type ["string", "null"] for description'
  );

  // ----------------------------------------------------
  // Test 3: Zod Schema Validation
  // ----------------------------------------------------
  console.log('\n--- 3. Zod Input Schema Validation ---');
  const missingArgsResult = await toolRegistry.validateAndExecute('create_calendar_event', {
    summary: 'Incomplete Event',
    // Missing required startTime and endTime
  }, { isConfirmed: true });
  assert(missingArgsResult.success === false, 'Rejects invocation when required parameters are missing');
  assert(missingArgsResult.isValidationError === true, 'Flags failure as a Zod validation error');

  // ----------------------------------------------------
  // Test 4: Confirm-Before-Write Guardrail Trigger
  // ----------------------------------------------------
  console.log('\n--- 4. Confirm-Before-Write Safety Guardrail ---');
  const unconfirmedExecution = await toolRegistry.validateAndExecute('create_calendar_event', {
    summary: 'Project Review',
    startTime: '2026-09-25T15:00:00Z',
    endTime: '2026-09-25T16:00:00Z',
  }, { isConfirmed: false }); // Human has NOT confirmed yet!

  assert(unconfirmedExecution.success === false, 'Blocks execution when isConfirmed is false');
  assert(unconfirmedExecution.needsConfirmation === true, 'Sets needsConfirmation: true');
  assert(unconfirmedExecution.tool === 'create_calendar_event', 'Identifies correct tool requiring confirmation');
  assert(
    unconfirmedExecution.args.summary === 'Project Review',
    'Preserves parsed arguments for user approval review'
  );

  // ----------------------------------------------------
  // Test 5: ReAct Loop Automatic Pause on Write Action
  // ----------------------------------------------------
  console.log('\n--- 5. ReAct Loop Pause Lifecycle ---');
  const writeGoal = 'Schedule a meeting with my mentor titled "Design Review" tomorrow from 3pm to 4pm.';
  console.log(`🎯 Test Goal: "${writeGoal}"`);

  let pauseEventReceived = false;

  const loopResult = await orchestrator.run({
    goal: writeGoal,
    conversationId: 'phase3_test_pause_conv',
    context: {
      isConfirmed: false,
    },
    onStepUpdate: (event) => {
      if (event.type === 'tool_call') {
        console.log(`   [ACT] LLM requested write action: "${event.tool}"`);
        console.log(`         Args:`, JSON.stringify(event.args));
      } else if (event.type === 'confirmation_required') {
        pauseEventReceived = true;
        console.log(`   🛑 [GUARDRAIL TRIGGERED] Execution paused awaiting human confirmation.`);
      }
    },
  });

  assert(
    pauseEventReceived === true,
    'Orchestrator emitted "confirmation_required" event'
  );
  assert(
    loopResult.status === 'awaiting_confirmation',
    `Orchestrator paused with status "awaiting_confirmation" (actual: ${loopResult.status})`
  );
  assert(
    loopResult.pendingAction?.tool === 'create_calendar_event',
    'Pending action correctly specifies "create_calendar_event"'
  );

  // ----------------------------------------------------
  // Test 6: Rejection Branch Handling in ReAct Loop
  // ----------------------------------------------------
  console.log('\n--- 6. Rejection Branch & Resumption ---');
  const simulatedHistory = [...loopResult.messages];
  simulatedHistory.push({
    role: 'tool',
    name: 'create_calendar_event',
    content:
      'Action execution cancelled: The user explicitly rejected the confirmation request for "create_calendar_event". Do not create this event. Acknowledge the cancellation to the user.',
  });

  const resumeOnRejectionResult = await orchestrator.run({
    goal: writeGoal,
    conversationId: 'phase3_test_pause_conv',
    history: simulatedHistory,
    context: { isConfirmed: false },
    onStepUpdate: (event) => {
      if (event.type === 'final_answer') {
        console.log(`   [FINAL ANSWER ON REJECTION]: ${event.content.slice(0, 110)}...`);
      }
    },
  });

  assert(
    resumeOnRejectionResult.status === 'completed',
    'Agent resumes cleanly and completes after observing user rejection'
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 Phase 3 Verification Suite PASSED flawlessly!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
