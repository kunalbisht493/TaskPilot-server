import fs from 'fs';
import path from 'path';

const clientPath = path.resolve('../TaskPilot-client/decision.md');

const adr = `
---

## ADR-C017: ReAct Cycle Folding, Confirmation Extraction & Time Formatting Parity

- **Status:** Accepted
- **Date:** 2026-09-28
- **Context:**
  When streaming ReAct execution events, granular sub-step events (reasoning_start, tool_call, confirmation_required) created duplicate "Cycle 1" cards in the timeline feed. In addition, submitGoal attempted to read res.pendingAction instead of res.pendingConfirmation, causing the confirmation modal to fail to open when the ReAct loop paused for approval on create_calendar_event.

- **Decision:**
  1. **Cycle Event Folding Aggregator:** Updated useAgentSession.js to fold multiple granular WebSocket events for the same cycle number into a single, cohesive cycle node containing reasoning, tool details, approval status, and observation results.
  2. **Universal Confirmation Payload Normalization:** Updated useAgentSession.js to inspect res.pendingConfirmation || res.pendingAction || res.result?.pendingAction and extract confirmation IDs across both confirmationId and _id schemas.
  3. **Human-Readable Timestamp Formatting:** Enhanced ConfirmationModal.jsx to parse startTime, endTime, startDateTime, and endDateTime into localized, formatted date/time strings with dedicated clock icons.

- **Why Taken:**
  1. Eliminates noisy, duplicated step headers in the live execution feed.
  2. Guarantees that the Human-in-the-Loop confirmation modal immediately appears whenever write tools are triggered.
  3. Presents unambiguous start/end times during approval review.
`;

fs.appendFileSync(clientPath, adr, 'utf8');
console.log('Appended ADR-C017 to:', clientPath);
