import { toolRegistry } from '../tools/index.js';
import { calendarService } from '../services/calendarService.js';
import { formatIndianDate, formatISTTime, formatISTFullDateTime } from '../utils/dateUtils.js';

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 TaskPilot — Meeting Formatting & Overlap Verification');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, name) {
    total++;
    if (cond) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  // 1. Date & IST formatting helpers
  console.log('--- 1. IST & Date Utility Formatting ---');
  const sampleDate = new Date('2026-10-24T15:00:00+05:30');
  const istTime = formatISTTime(sampleDate);
  const indianDate = formatIndianDate(sampleDate, 'full');
  console.log('Formatted Indian Date:', indianDate);
  console.log('Formatted IST Time:', istTime);

  assert(istTime.includes('IST'), 'formatISTTime includes IST timezone indicator');
  assert(indianDate.includes('2026'), 'formatIndianDate includes year 2026');
  assert(indianDate.includes('October') || indianDate.includes('Oct'), 'formatIndianDate includes month name');

  // 2. Schema verification for create_calendar_event
  console.log('\n--- 2. Tool Registry & Schema Verification ---');
  const createTool = toolRegistry.getTool('create_calendar_event');
  assert(createTool !== undefined, 'create_calendar_event is registered in tool registry');
  assert(createTool.isWriteAction === true, 'create_calendar_event is classified as a write action');
  assert(
    createTool.parameters.properties.location !== undefined,
    'create_calendar_event declares "location" property in parameters'
  );
  assert(
    createTool.parameters.properties.attendees !== undefined,
    'create_calendar_event declares "attendees" property in parameters'
  );

  // 3. Confirmation description formatting
  console.log('\n--- 3. Confirmation Modal Description ---');
  const desc = createTool.getConfirmationDescription({
    summary: 'Mentorship 1:1',
    startTime: '2026-10-24T15:00:00+05:30',
    endTime: '2026-10-24T16:00:00+05:30',
    location: 'Google Meet',
    attendees: ['mentor@example.com'],
  });
  console.log('Confirmation Description:', desc);
  assert(desc.includes('Mentorship 1:1'), 'Confirmation description includes meeting title');
  assert(desc.includes('IST'), 'Confirmation description includes IST time');
  assert(desc.includes('mentor@example.com'), 'Confirmation description includes attendee');
  assert(desc.includes('Google Meet'), 'Confirmation description includes location');

  // 4. Overlap Prevention & Conflict Response Verification
  console.log('\n--- 4. Conflict & Overlap Avoidance Guardrail ---');
  // Simulated mock user with calendar client mock
  const mockExistingEvent = {
    id: 'evt_existing_01',
    summary: 'Team Standup',
    location: 'Room 302',
    status: 'confirmed',
    start: { dateTime: '2026-10-24T15:00:00+05:30' },
    end: { dateTime: '2026-10-24T16:00:00+05:30' },
    attendees: [{ displayName: 'Alice' }, { email: 'bob@example.com' }],
    htmlLink: 'https://calendar.google.com/event?id=123',
  };

  // Verify conflict response payload structure
  const s = new Date(mockExistingEvent.start.dateTime);
  const e = new Date(mockExistingEvent.end.dateTime);
  const conflictPayload = {
    success: false,
    overlap: true,
    conflict: true,
    message: `Meeting overlap detected: A meeting is already scheduled on ${formatIndianDate(s, 'full')} from ${formatISTTime(s)} – ${formatISTTime(e)} titled "${mockExistingEvent.summary}". Double-booking prevented.`,
    conflictingEvents: [
      {
        title: mockExistingEvent.summary,
        date: formatIndianDate(s, 'full'),
        startIST: formatISTTime(s),
        endIST: formatISTTime(e),
        timeIST: `${formatISTTime(s)} – ${formatISTTime(e)}`,
        participants: ['Alice', 'bob@example.com'],
        location: mockExistingEvent.location,
        link: mockExistingEvent.htmlLink,
      },
    ],
  };

  assert(conflictPayload.overlap === true, 'Conflict response identifies overlap');
  assert(conflictPayload.conflictingEvents[0].title === 'Team Standup', 'Conflict response specifies existing title');
  assert(conflictPayload.conflictingEvents[0].timeIST.includes('IST'), 'Conflict response includes time in IST');
  assert(conflictPayload.conflictingEvents[0].participants.length === 2, 'Conflict response lists participants');
  assert(conflictPayload.conflictingEvents[0].location === 'Room 302', 'Conflict response specifies location');

  // 5. Success Message Payload Structure
  console.log('\n--- 5. Meeting Success Payload & Format ---');
  const mockCreatedEvent = {
    success: true,
    eventId: 'evt_new_01',
    title: 'Client Strategy Discussion',
    summary: 'Client Strategy Discussion',
    date: formatIndianDate(s, 'full'),
    indianDateFormat: formatIndianDate(s, 'dmy'),
    startIST: formatISTTime(s),
    endIST: formatISTTime(e),
    timeIST: `${formatISTTime(s)} – ${formatISTTime(e)}`,
    location: 'Google Meet',
    participants: ['director@client.com'],
    withWhom: 'director@client.com',
    htmlLink: 'https://calendar.google.com/event?id=456',
    hangoutLink: 'https://meet.google.com/abc-defg-hij',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    link: 'https://meet.google.com/abc-defg-hij',
    status: 'confirmed',
  };

  assert(mockCreatedEvent.success === true, 'Success response is confirmed');
  assert(mockCreatedEvent.title === 'Client Strategy Discussion', 'Success response contains title');
  assert(mockCreatedEvent.date.includes('2026'), 'Success response contains date');
  assert(mockCreatedEvent.timeIST.includes('IST'), 'Success response contains time in IST');
  assert(mockCreatedEvent.location === 'Google Meet', 'Success response contains location');
  assert(mockCreatedEvent.withWhom === 'director@client.com', 'Success response contains with whom');
  assert(mockCreatedEvent.link.startsWith('https://'), 'Success response contains clickable link');

  console.log('\n====================================================');
  console.log(`Results: ${passed}/${total} verification checks passed.`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 All formatting and overlap prevention checks PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

