import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDecisionPath = path.resolve(__dirname, '../../../TaskPilot-client/decision.md');

const adrText = `
---

## ADR-C015: Direct WebSocket Transport Architecture & Elimination of Vite WS Proxy Choke

- **Status:** Accepted
- **Date:** 2026-09-26
- **Context:**
  Proxying WebSockets through Vite's development server (ws: true on /socket.io) caused "Error: write ECONNABORTED" socket exceptions whenever browser tabs reloaded, HMR triggered, or engine.io ping-pong intervals closed abruptly.

- **Decision:**
  1. **Direct Socket.io Connection:** Configured SocketContext.jsx to connect directly to the backend server (http://localhost:5001) using native cross-origin credentials, eliminating Vite's intermediate WebSocket proxy.
  2. **Dedicated HTTP REST Proxying:** Retained the Vite proxy exclusively for /api REST endpoints to maintain same-origin first-party cookie benefits while decoupling real-time transport from Vite's internal HMR server.

- **Why Taken:**
  Completely resolves write ECONNABORTED proxy crashes and guarantees resilient real-time streaming during page reloads and HMR updates.
`;

fs.appendFileSync(clientDecisionPath, adrText, 'utf8');
console.log('Appended ADR-C015 to TaskPilot-client/decision.md');
