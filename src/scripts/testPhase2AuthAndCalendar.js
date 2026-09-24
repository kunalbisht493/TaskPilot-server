import jwt from 'jsonwebtoken';
import { toolRegistry } from '../tools/index.js';
import { config } from '../config/env.js';
import { calendarService } from '../services/calendarService.js';
import { orchestrator } from '../orchestrator/orchestrator.js';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('🧪 TaskPilot — Phase 2 Verification Test Suite');
  console.log('   (OAuth Token Handlers & Calendar Read Tool)');
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
  // Test 1: Tool Registry Registration
  // ----------------------------------------------------
  console.log('\n--- 1. Tool Registry Verification ---');
  const calTool = toolRegistry.getTool('check_calendar_availability');
  assert(calTool !== undefined, 'Tool "check_calendar_availability" is registered');
  assert(calTool.isWriteAction === false, 'Tool is marked as read-only (isWriteAction: false)');
  assert(typeof calTool.execute === 'function', 'Tool has an executable handler function');

  // ----------------------------------------------------
  // Test 2: Multi-Provider Schema Generation (ADR-018 Compliance)
  // ----------------------------------------------------
  console.log('\n--- 2. Multi-Provider Schema Normalization ---');
  const geminiDecls = toolRegistry.getGeminiFunctionDeclarations();
  const geminiCal = geminiDecls.find((t) => t.name === 'check_calendar_availability');
  assert(geminiCal !== undefined, 'Gemini function declaration exists for calendar tool');
  assert(
    geminiCal.parameters.properties.endDate.nullable === true,
    'Gemini schema correctly normalizes optional endDate with nullable: true'
  );

  const groqDecls = toolRegistry.getGroqToolDeclarations();
  const groqCal = groqDecls.find((t) => t.function.name === 'check_calendar_availability');
  assert(groqCal !== undefined, 'Groq tool declaration exists for calendar tool');
  assert(
    Array.isArray(groqCal.function.parameters.properties.endDate.type),
    'Groq schema preserves union type ["string", "null"] for endDate'
  );

  // ----------------------------------------------------
  // Test 3: Unauthenticated Fallback Behavior
  // ----------------------------------------------------
  console.log('\n--- 3. Unauthenticated Execution Guard ---');
  const unauthResult = await toolRegistry.validateAndExecute('check_calendar_availability', {
    startDate: '2026-09-24',
  }, {});
  assert(unauthResult.success === true, 'Tool handles unauthenticated context without crashing');
  assert(unauthResult.result.connected === false, 'Reports connected: false when no user is logged in');
  assert(
    unauthResult.result.message.includes('No authenticated user session'),
    'Provides descriptive guidance to authenticate via Google OAuth'
  );

  // ----------------------------------------------------
  // Test 4: Zod Parameter Validation
  // ----------------------------------------------------
  console.log('\n--- 4. Zod Schema Validation ---');
  const invalidResult = await toolRegistry.validateAndExecute('check_calendar_availability', {
    // Missing required startDate
  }, {});
  assert(invalidResult.success === false, 'Rejects invocation when required startDate is missing');
  assert(invalidResult.isValidationError === true, 'Flags error as validation issue for ReAct self-correction');

  // ----------------------------------------------------
  // Test 5: JWT Token Lifecycle
  // ----------------------------------------------------
  console.log('\n--- 5. JWT Generation & Verification ---');
  const mockUserId = '654321654321654321654321';
  const mockEmail = 'test@example.com';
  const token = jwt.sign({ id: mockUserId, email: mockEmail }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  assert(typeof token === 'string' && token.length > 20, 'Generates valid JWT token string');

  const decoded = jwt.verify(token, config.jwtSecret);
  assert(decoded.id === mockUserId && decoded.email === mockEmail, 'Decodes and verifies JWT payload correctly');

  // ----------------------------------------------------
  // Test 6: ReAct Loop Tool Selection (End-to-End Test)
  // ----------------------------------------------------
  console.log('\n--- 6. ReAct Agent Orchestration with Calendar Tool ---');
  const testGoal = 'Check if I have any scheduled meetings on 2026-09-24.';
  console.log(`🎯 Test Goal: "${testGoal}"`);

  let toolWasInvoked = false;

  const agentResult = await orchestrator.run({
    goal: testGoal,
    conversationId: 'phase2_test_conv',
    context: {
      user: null, // Test how the LLM handles unauthenticated calendar check response
    },
    onStepUpdate: (event) => {
      if (event.type === 'tool_call') {
        console.log(`   [ACT] LLM selected tool: "${event.tool}" with args:`, event.args);
        if (event.tool === 'check_calendar_availability') {
          toolWasInvoked = true;
        }
      } else if (event.type === 'tool_observation') {
        console.log(`   [OBSERVE] Result received:`, JSON.stringify(event.result || event.error));
      } else if (event.type === 'final_answer') {
        console.log(`   [FINAL ANSWER]`, event.content.slice(0, 120) + '...');
      }
    },
  });

  assert(
    toolWasInvoked === true,
    'Agent correctly reasoned and invoked "check_calendar_availability" tool'
  );
  assert(
    agentResult.status === 'completed',
    `ReAct loop completed successfully (status: ${agentResult.status})`
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 Phase 2 Verification Suite PASSED flawlessly!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
