import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDecisionPath = path.resolve(__dirname, '../../../TaskPilot-client/decision.md');

const adrText = `
---

## ADR-C012: De-homogenized Two-Pane Layout, Single-Accent Discipline & Execution Trace Timeline

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  Earlier builds exhibited repetitive box-in-box card treatments with uniform borders and blue accents applied across all buttons, tabs, and chrome. The user required eliminating this generic templated look in favor of distinct, purposeful surfaces, an authentic timeline trace feed, and strict single-accent discipline.

- **Decision:**
  1. **Structural Tonal Separation:** Eliminated floating cards with identical borders. Adopted an integrated two-pane split workspace (Execution Trace on #111215 canvas, Operations Ledger on #16181c subtle contrast) divided by a clean vertical guide line.
  2. **Single-Accent Constraint:** Reserved the primary action accent (#2563eb) strictly for the primary execution trigger ("Run goal"). Rendered all secondary buttons, tabs, and status badges in neutral zinc/slate tones.
  3. **Timeline Execution Spine:** Redesigned the Reasoning Feed into a continuous activity trace with vertical guide lines, cycle node markers (01, 02), inline command-style tool calls ($ call tool_name), and compact monospace observation blocks.
  4. **Operational Checklist & Semantic Log Table:** Formatted the Task Panel as an authentic checklist with hairline dividers and the Audit Log as a compact data table with column headers.
  5. **Specific Operational Empty States:** Replaced generic filler text with clear functional readiness summaries explaining data persistence and live streaming behavior.

- **Why Taken:**
  Elevates visual credibility to match top-tier engineering tools (Linear, Datadog, GitHub Actions) and proves custom product design rather than an AI-generated template.
`;

fs.appendFileSync(clientDecisionPath, adrText, 'utf8');
console.log('Appended ADR-C012 to TaskPilot-client/decision.md successfully.');
