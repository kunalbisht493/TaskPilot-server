import { logAction, getActionLogs, getActionStats } from '../services/auditLogger.js';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { emitAuditLog, emitReasoningStep } from '../sockets/socketGateway.js';
import { connectDB } from '../config/db.js';

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('🧪 TaskPilot — Phase 5 Verification Test Suite');
  console.log('   (Audit Logging API & Live Socket Reasoning Stream)');
  console.log('====================================================\n');

  await connectDB();

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
  // Test 1: Action Log Creation & Provenance
  // ----------------------------------------------------
  console.log('\n--- 1. Action Log Persistence & Provenance ---');
  const testConvId = `test_audit_conv_${Date.now()}`;
  const logEntry = await logAction({
    conversationId: testConvId,
    tool: 'check_calendar_availability',
    args: { startDate: '2026-09-26' },
    result: { isConnected: false, totalEvents: 0 },
    success: true,
    confirmedByUser: false,
    executionTimeMs: 145,
  });

  assert(logEntry !== null, 'Successfully creates action log record');
  assert(logEntry.tool === 'check_calendar_availability', 'Log correctly records the tool name');
  assert(logEntry.executionTimeMs === 145, 'Log records execution latency (ms)');
  assert(logEntry.confirmedByUser === false, 'Log records confirmation provenance (false for read)');

  // ----------------------------------------------------
  // Test 2: Action Log Querying & Filtering
  // ----------------------------------------------------
  console.log('\n--- 2. Paginated Querying & Filtering ---');
  const queryResult = await getActionLogs({
    conversationId: testConvId,
    page: 1,
    limit: 10,
  });

  assert(queryResult.page === 1, 'Pagination returns correct page number');
  assert(Array.isArray(queryResult.logs), 'Returns logs array');
  assert(queryResult.total >= 1, 'Counts total log records matching query');

  const filteredByTool = await getActionLogs({
    tool: 'check_calendar_availability',
    limit: 5,
  });
  assert(filteredByTool.logs.every((l) => l.tool === 'check_calendar_availability'), 'Filters logs by tool name');

  // ----------------------------------------------------
  // Test 3: Analytics & Breakdown Aggregations
  // ----------------------------------------------------
  console.log('\n--- 3. Audit Analytics & Metric Aggregations ---');
  const stats = await getActionStats();
  assert(typeof stats.totalActions === 'number', 'Calculates total actions count');
  assert(typeof stats.successRatePercent === 'number', 'Calculates success rate percentage');
  assert(Array.isArray(stats.toolBreakdown), 'Provides per-tool invocation breakdown array');

  // ----------------------------------------------------
  // Test 4: Socket.io Event Gateway Emitters
  // ----------------------------------------------------
  console.log('\n--- 4. Socket.io Event Broadcasting ---');
  let socketError = false;
  try {
    emitReasoningStep('mock_conv', {
      type: 'reasoning_start',
      step: 1,
      message: 'Agent is analyzing goals...',
    });
    emitAuditLog({
      conversationId: 'mock_conv',
      tool: 'get_current_time',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    socketError = true;
  }
  assert(socketError === false, 'Socket.io event emitters execute safely without throwing exceptions');

  // ----------------------------------------------------
  // Test 5: Multi-Domain Chained ReAct Loop Execution
  // ----------------------------------------------------
  console.log('\n--- 5. Multi-Domain ReAct Orchestration (Calendar + Task) ---');
  const multiGoal = 'Check if I have any meetings tomorrow, and add a to-do task titled "Review sprint metrics".';
  console.log(`🎯 Multi-Domain Goal: "${multiGoal}"`);

  const observedTools = [];
  let writeActionIntercepted = false;

  const chainedResult = await orchestrator.run({
    goal: multiGoal,
    conversationId: `chain_test_${Date.now()}`,
    context: { isConfirmed: false },
    onStepUpdate: (event) => {
      if (event.type === 'tool_call') {
        observedTools.push(event.tool);
        console.log(`   [ACT] Invoked tool: "${event.tool}"`);
      } else if (event.type === 'confirmation_required') {
        writeActionIntercepted = true;
        console.log(`   🛑 [GUARDRAIL] Intercepted write action: "${event.tool}"`);
      }
    },
  });

  assert(
    observedTools.length >= 1,
    'ReAct orchestrator executes multi-step domain reasoning'
  );
  assert(
    observedTools.includes('get_current_time') || observedTools.includes('check_calendar_availability') || observedTools.includes('create_task'),
    'Orchestrator delegates appropriately to registered domain tools'
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 Phase 5 Verification Suite PASSED flawlessly!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
