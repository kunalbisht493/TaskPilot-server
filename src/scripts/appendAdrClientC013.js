import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDecisionPath = path.resolve(__dirname, '../../../TaskPilot-client/decision.md');

const adrText = `
---

## ADR-C013: High-Contrast White Surface Theme & Header Telemetry Simplification

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  To achieve a crisp, high-signal professional aesthetic comparable to top-tier enterprise software (Stripe, Linear, Vercel), the interface required migrating to a high-contrast white canvas (#ffffff) with cool gray tonal surfaces (#f9fafb), crisp charcoal typography (#0f172a), and clean hairline borders (#e5e7eb). Concurrently, the user requested removing the LLM provider telemetry badge from the navigation bar to eliminate extraneous visual clutter.

- **Decision:**
  1. **White Surface Hierarchy:** Standardized on pure white (#ffffff) for primary workspaces, subtle cool gray (#f9fafb) for secondary ledger panes and parameter boxes, and crisp neutral gray (#e5e7eb) for hairline divider rules.
  2. **Header Telemetry Streamlining:** Removed the explicit LLM provider indicator from the top navigation bar, preserving only functional connection states (real-time stream health and calendar link status).
  3. **Monochromatic Primary Action:** Assigned solid charcoal (#0f172a) as the singular accent for the primary execution trigger ("Run goal") and confirmation actions, ensuring all secondary buttons remain calm and neutral.

- **Why Taken:**
  Creates an unmistakably custom, polished product appearance that eliminates generic dark-mode AI template tells while improving legibility and focus.
`;

fs.appendFileSync(clientDecisionPath, adrText, 'utf8');
console.log('Appended ADR-C013 to TaskPilot-client/decision.md successfully.');
