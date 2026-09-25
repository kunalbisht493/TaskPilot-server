import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDecisionPath = path.resolve(__dirname, '../../../TaskPilot-client/decision.md');

const adrText = `
---

## ADR-C014: Same-Origin Development Proxy & Cross-Port Session Synchronization

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  In local development, cross-port communication between the client (Port 5174) and server (Port 5001) triggered browser CORS preflight failures when accessed via host variations (e.g. 127.0.0.1 vs localhost) and caused Dev Login to fail. Additionally, slight response contract discrepancies between dev-login and the session inspection endpoint caused authentication state desynchronization.

- **Decision:**
  1. **Vite Development Proxy:** Configured vite.config.js to proxy /api and /socket.io directly to http://localhost:5001, allowing the client to execute same-origin HTTP and WebSocket calls.
  2. **First-Party Cookie Storage:** Same-origin routing ensures HttpOnly session cookies are accepted and sent without third-party cross-site cookie blocking.
  3. **Multi-Host Server Origin Normalization:** Updated backend CORS with a dynamic origin validator supporting any localhost or loopback port.
  4. **Session Contract Alignment:** Updated AuthContext to handle both authenticated and success response payloads, ensuring seamless session persistence upon login.

- **Why Taken:**
  Resolves dev-login failures deterministically across all browser security configurations and host addresses.
`;

fs.appendFileSync(clientDecisionPath, adrText, 'utf8');
console.log('Appended ADR-C014 to TaskPilot-client/decision.md');
