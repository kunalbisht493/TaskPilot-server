import { toolRegistry } from '../tools/index.js';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { taskService } from '../services/taskService.js';

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🧪 TaskPilot — Phase 4 Verification Test Suite');
  console.log('   (Internal Task Management Tools & Dual Domain Guardrails)');
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
  // Test 1: Task Tools Registration & Classification
  // ----------------------------------------------------
  console.log('\n--- 1. Task Tool Registry Verification ---');
  const createTaskTool = toolRegistry.getTool('create_task');
  const completeTaskTool = toolRegistry.getTool('complete_task');
  const listTasksTool = toolRegistry.getTool('list_tasks');

  assert(createTaskTool !== undefined, 'Tool "create_task" is registered');
  assert(createTaskTool.isWriteAction === true, '"create_task" is strictly classified as a write action');

  assert(completeTaskTool !== undefined, 'Tool "complete_task" is registered');
  assert(completeTaskTool.isWriteAction === true, '"complete_task" is strictly classified as a write action');

  assert(listTasksTool !== undefined, 'Tool "list_tasks" is registered');
  assert(listTasksTool.isWriteAction === false, '"list_tasks" is classified as read-only');

  // ----------------------------------------------------
  // Test 2: Multi-Provider Schema Generation (ADR-018)
  // ----------------------------------------------------
  console.log('\n--- 2. Multi-Provider Schema Normalization ---');
  const geminiDecls = toolRegistry.getGeminiFunctionDeclarations();
  const geminiCreate = geminiDecls.find((t) => t.name === 'create_task');
  assert(geminiCreate !== undefined, 'Gemini schema contains "create_task" declaration');
  assert(
    geminiCreate.parameters.properties.description.nullable === true,
    'Gemini schema correctly flags optional description with nullable: true'
  );

  const groqDecls = toolRegistry.getGroqToolDeclarations();
  const groqCreate = groqDecls.find((t) => t.function.name === 'create_task');
  assert(groqCreate !== undefined, 'Groq schema contains "create_task" declaration');
  assert(
    Array.isArray(groqCreate.function.parameters.properties.description.type),
    'Groq schema preserves union type ["string", "null"] for description'
  );

  // ----------------------------------------------------
  // Test 3: Input Validation via Zod
  // ----------------------------------------------------
  console.log('\n--- 3. Zod Schema Validation ---');
  const invalidTaskResult = await toolRegistry.validateAndExecute('create_task', {
    // Missing required "title"
    priority: 'high',
  }, { isConfirmed: true });
  assert(invalidTaskResult.success === false, 'Rejects "create_task" when title is omitted');
  assert(invalidTaskResult.isValidationError === true, 'Flags failure as a validation issue');

  // ----------------------------------------------------
  // Test 4: Write Action Guardrail Protection
  // ----------------------------------------------------
  console.log('\n--- 4. Confirm-Before-Write Safety Guardrails ---');
  const unconfirmedCreate = await toolRegistry.validateAndExecute('create_task', {
    title: 'Review production logs',
    priority: 'high',
  }, { isConfirmed: false }); // Unconfirmed!

  assert(unconfirmedCreate.success === false, 'create_task blocked when isConfirmed is false');
  assert(unconfirmedCreate.needsConfirmation === true, 'create_task sets needsConfirmation: true');
  assert(unconfirmedCreate.tool === 'create_task', 'Identifies correct tool requiring approval');

  const unconfirmedComplete = await toolRegistry.validateAndExecute('complete_task', {
    title: 'Review production logs',
  }, { isConfirmed: false }); // Unconfirmed!

  assert(unconfirmedComplete.success === false, 'complete_task blocked when isConfirmed is false');
  assert(unconfirmedComplete.needsConfirmation === true, 'complete_task sets needsConfirmation: true');

  // Read-only tool should execute immediately without needing confirmation
  const readExecution = await toolRegistry.validateAndExecute('list_tasks', {}, { isConfirmed: false });
  assert(readExecution.success === true, 'list_tasks executes immediately without pausing for confirmation');

  // ----------------------------------------------------
  // Test 5: Direct Execution with Confirmation
  // ----------------------------------------------------
  console.log('\n--- 5. Direct Execution When Approved ---');
  const approvedCreate = await toolRegistry.validateAndExecute('create_task', {
    title: 'Automated Test Task',
    description: 'Created during test verification suite',
    priority: 'medium',
  }, { isConfirmed: true });

  assert(approvedCreate.success === true, 'create_task executes successfully when confirmed');
  assert(approvedCreate.result.title === 'Automated Test Task', 'Task title matches input');
  assert(approvedCreate.result.status === 'pending', 'Newly created task has status "pending"');

  const createdTaskId = approvedCreate.result.id;
  const approvedComplete = await toolRegistry.validateAndExecute('complete_task', {
    taskId: createdTaskId,
    title: 'Automated Test Task',
  }, { isConfirmed: true });

  assert(approvedComplete.success === true, 'complete_task executes successfully when confirmed');
  assert(approvedComplete.result.status === 'completed', 'Task status is updated to "completed"');

  // ----------------------------------------------------
  // Test 6: ReAct Agent Orchestration with Task Creation
  // ----------------------------------------------------
  console.log('\n--- 6. ReAct Agent Orchestration with Task Tool ---');
  const taskGoal = 'Add a high-priority task titled "Refactor database indexing" to my to-do list.';
  console.log(`🎯 Test Goal: "${taskGoal}"`);

  let pauseDetected = false;

  const agentResult = await orchestrator.run({
    goal: taskGoal,
    conversationId: 'phase4_test_conv',
    context: { isConfirmed: false },
    onStepUpdate: (event) => {
      if (event.type === 'tool_call') {
        console.log(`   [ACT] LLM requested write action: "${event.tool}"`);
        console.log(`         Args:`, JSON.stringify(event.args));
      } else if (event.type === 'confirmation_required') {
        pauseDetected = true;
        console.log(`   🛑 [GUARDRAIL TRIGGERED] Execution paused awaiting confirmation for "${event.tool}".`);
      }
    },
  });

  assert(pauseDetected === true, 'Orchestrator emitted "confirmation_required" for task creation');
  assert(
    agentResult.status === 'awaiting_confirmation',
    `Orchestrator paused with status "awaiting_confirmation" (actual: ${agentResult.status})`
  );
  assert(
    agentResult.pendingAction?.tool === 'create_task',
    'Pending action correctly specifies "create_task"'
  );
  assert(
    agentResult.pendingAction?.args?.title.toLowerCase().includes('refactor'),
    'Arguments capture the requested task title accurately'
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 Phase 4 Verification Suite PASSED flawlessly!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
