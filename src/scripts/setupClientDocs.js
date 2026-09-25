import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.resolve(__dirname, '../../../TaskPilot-client');

function writeFile(relativePath, content) {
  const fullPath = path.join(clientDir, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Created: ${relativePath}`);
}

console.log('Writing frontend documentation (projectcontext.md, architecture.md, decision.md)...');

// 1. TaskPilot-client/projectcontext.md
writeFile('projectcontext.md', `# TaskPilot Client — Project Context

## What This Is

TaskPilot Client is the interactive, real-time React frontend for **TaskPilot** — an autonomous MERN AI agent that plans, schedules, and executes tasks using a hand-built ReAct (Reason → Act → Observe) loop.

While traditional AI applications are opaque conversational chat boxes ("AI that talks"), the TaskPilot client is an **agentic observability cockpit ("AI that acts")**. It exposes the internal reasoning steps of the agent in real time, intercepts mutating actions before execution via a Human-in-the-Loop (HITL) modal, manages internal database tasks, and streams an immutable audit trail live from MongoDB over WebSockets.

---

## Purpose & UX Philosophy

1. **Demystifying Agent Reasoning:**
   Standard chat UIs hide the AI's internal reasoning. TaskPilot Client renders every ReAct cycle step explicitly:
   - **Reason:** The model's sub-goal plan and internal reflection.
   - **Act:** The structured tool invocation with schema-checked parameters and write-action safety badges.
   - **Observe:** The execution output received from external APIs (Google Calendar) or internal services (Task DB).
   
2. **Safety & User Agency Through HITL Guardrails:**
   Autonomous agents risk unintended state mutation. TaskPilot places the user in control: whenever a write action is proposed, the UI halts the conversation flow with a high-visibility confirmation modal displaying exact action parameters (event times, task titles) for one-click Approval or Rejection.

3. **Dual-Domain Direct Workspace:**
   Provides an interactive workspace where users can monitor their database tasks and action audit logs side-by-side with the live agent stream, allowing users to verify that tool actions immediately take effect.

---

## Primary User Stories

- **As a User**, I want to submit complex scheduling or task management goals in natural language so the agent can execute multi-step workflows.
- **As a User**, I want to watch the agent think, pick tools, and observe results in real time so I have complete confidence in its behavior.
- **As a User**, I want to review and approve or reject any write action before external calendar events or database tasks are modified.
- **As a User**, I want to link my Google Calendar with one click or use Dev Quick Login for rapid offline/local testing.
- **As a User**, I want to view my live to-do list and an immutable audit trail of past agent invocations with performance metrics.

---

## Scope for the Frontend Build

### In Scope:
- **Vite + React 19 SPA:** Ultra-fast bundling, modern hook primitives, and lightning-fast HMR.
- **Tailwind CSS v3 Design System:** Modern dark aesthetics, slate/zinc palette (\`#060911\`, \`#0b101d\`), neon emerald brand accents (\`#10b981\`), glowing glassmorphic panels, and micro-animations.
- **Real-Time Dual Transport:**
  - REST client with automatic \`credentials: 'include'\` for HttpOnly JWT session persistence.
  - Socket.io client connecting to port 5001 with session room management (\`join_conversation\` / \`leave_conversation\`).
- **Interactive Component Suite:**
  - \`Header\`: Real-time health badge, active LLM indicator, Google Calendar connect status, dev login shortcut.
  - \`GoalInput\`: Prompt textarea with keyboard shortcuts (\`Enter\` to submit) and 4 interactive starter suggestion chips.
  - \`ReasoningFeed\`: Live stream visualizer for Reason, Act, and Observe steps, active spinner states, and final answer card.
  - \`ConfirmationModal\`: HITL modal with event/task parameter breakdown and Approve/Reject triggers.
  - \`TaskPanel\`: MongoDB task manager with status filters (\`All\`, \`Pending\`, \`Completed\`), inline creation, and completion toggles.
  - \`AuditLogPanel\`: Live streaming table with aggregated metrics (total calls, confirmed count, success rate) and expandable JSON viewers.
  - \`SystemInfoModal\`: Educational modal breaking down the hand-built ReAct loop architecture and tool schemas.

### Explicitly Out of Scope:
- Heavy component UI libraries (e.g. Material UI, Ant Design) — avoided in favor of Tailwind CSS for full aesthetic control.
- Complex third-party state managers (Redux, MobX) — scoped to lightweight React Context and custom hooks to eliminate boilerplate.
- File upload/attachment inputs — not required since tools are limited to Calendar and Task DB.
- Complex charting libraries — summary metric cards prove analytics without bloat.

---

## Tech Stack Summary

- **Framework:** React 19 (Vite 8)
- **Styling:** Tailwind CSS v3, PostCSS, Autoprefixer
- **Icons:** Lucide React
- **Real-Time Transport:** Socket.io-client
- **Typography:** Inter & JetBrains Mono (Google Fonts)
- **Target Deployment:** Vercel (SPA mode with rewrite rules)

---

## Related Documents

- See \`architecture.md\` for the detailed component hierarchy, state flow diagrams, WebSocket contract, and networking architecture.
- See \`decision.md\` for all Architectural Decision Records (ADRs) explaining technical trade-offs and rationale.
`);

// 2. TaskPilot-client/architecture.md
writeFile('architecture.md', `# TaskPilot Client — Architecture Specification

**A modern, real-time React dashboard visualizing hand-built agentic AI workflows, streaming ReAct loops, and Human-in-the-Loop guardrails.**

---

## 1. High-Level Client Architecture

\`\`\`mermaid
flowchart TB
    subgraph Browser ["Client Application (React 19 + Vite)"]
        UI[App Layout]
        HDR[Header & Auth Bar]
        INP[Goal Input & Quick Chips]
        FEED[Reasoning Feed<br/>Reason -> Act -> Observe]
        CONF[Confirmation Modal<br/>HITL Guardrail]
        TSK[Task Panel<br/>CRUD Tasks]
        AUD[Audit Log Panel<br/>Live Stream + Stats]
        
        CTX_AUTH[AuthContext]
        CTX_SOCK[SocketContext]
        HOOK_AGENT[useAgentSession Hook]
    end

    subgraph Transport ["Dual Transport Layer"]
        REST[REST Client<br/>fetchWithAuth / credentials: include]
        WS[Socket.io Client<br/>Room: conversationId]
    end

    subgraph Backend ["TaskPilot Server (Port 5001)"]
        API[Express REST API]
        SOCK_SRV[Socket.io Gateway]
        ORCH[ReAct Orchestrator]
    end

    UI --> HDR
    UI --> INP
    UI --> FEED
    UI --> CONF
    UI --> TSK
    UI --> AUD

    HDR --> CTX_AUTH
    INP --> HOOK_AGENT
    FEED --> HOOK_AGENT
    CONF --> HOOK_AGENT
    TSK --> REST
    AUD --> REST
    AUD <--> WS

    HOOK_AGENT --> REST
    HOOK_AGENT <--> WS
    CTX_AUTH --> REST
    CTX_SOCK <--> WS

    REST <-->|HTTP / JSON / Cookies| API
    WS <-->|WebSocket Events| SOCK_SRV
    API <--> ORCH
    SOCK_SRV <--> ORCH
\`\`\`

---

## 2. Component Hierarchy & Responsibilities

| Component | File Path | Primary Responsibility |
|---|---|---|
| **App** | \`src/App.jsx\` | Root dashboard layout, 2-column responsive grid, modal management, unauthenticated callout banner. |
| **Header** | \`src/components/Header.jsx\` | App branding, active LLM model indicator, Socket connection pulse, Google Calendar link badge, Dev Login shortcut, and user session menu. |
| **GoalInput** | \`src/components/GoalInput.jsx\` | Controlled multi-line goal input, keyboard submission (\`Enter\`), execution disabled states, and quick-prompt suggestion chips. |
| **ReasoningFeed** | \`src/components/ReasoningFeed.jsx\` | Sequential ReAct step visualizer rendering 🧠 **REASON** (thoughts), ⚡ **ACT** (tools + formatted args), and 👁️ **OBSERVE** (outputs), plus final completion cards. |
| **ConfirmationModal** | \`src/components/ConfirmationModal.jsx\` | Human-in-the-Loop guardrail modal intercepting write actions, displaying formatted parameter previews with **Approve** and **Reject** handlers. |
| **TaskPanel** | \`src/components/TaskPanel.jsx\` | Database to-do manager with status filtering (\`All\`, \`Pending\`, \`Completed\`), inline task creation, completion toggles, and deletion. |
| **AuditLogPanel** | \`src/components/AuditLogPanel.jsx\` | Action audit trail with aggregated metrics (total calls, confirmed count, success rate), expandable JSON inspection, and live WebSocket row insertion. |
| **SystemInfoModal** | \`src/components/SystemInfoModal.jsx\` | Engineering overview modal detailing the hand-built ReAct loop, tool schemas, and security guardrails. |

---

## 3. State Management & Data Flow Architecture

The client adopts a modular, lightweight state architecture combining **React Context** for global singleton concerns and **Custom Hooks** for session-specific state:

### 3.1 Global Contexts
1. **\`AuthContext\` (\`src/context/AuthContext.jsx\`):**
   - Holds \`user\`, \`loading\`, \`health\`, and \`error\` states.
   - Automatically polls \`GET /api/auth/me\` on mount.
   - Provides \`devLogin()\` and \`logout()\` methods.
   - Computes \`isAuthenticated\` and \`isConnectedToCalendar\`.

2. **\`SocketContext\` (\`src/context/SocketContext.jsx\`):**
   - Initializes a singleton \`io()\` connection targeting \`http://localhost:5001\`.
   - Manages connection lifecycle (\`connect\`, \`disconnect\`, \`connect_error\`).
   - Exposes \`socket\` instance and \`isConnected\` boolean.

### 3.2 Session Orchestration Hook (\`useAgentSession\`)
- **Conversation Room Management:** Generates unique \`conversationId\` (\`conv_<timestamp>_<random>\`) and emits \`join_conversation\` / \`leave_conversation\` to ensure messages are isolated to the active session.
- **Event Subscriptions:**
  - \`agent:step\` → Appends new step (\`{ step, thought, tool, args, result, isWriteAction }\`) to the live feed.
  - \`agent:confirm_request\` → Halts active spinner and mounts \`ConfirmationModal\` with \`pendingAction\`.
  - \`agent:complete\` → Sets \`finalAnswer\`, clears pending states, and terminates execution loader.
  - \`agent:error\` → Captures and displays error alert.
- **Actions:**
  - \`submitGoal(goal)\` → Dispatches \`POST /api/agent/task\`.
  - \`submitConfirmation(approved)\` → Dispatches \`POST /api/agent/confirm\`.
  - \`resetSession()\` → Clears state and initializes a clean conversation ID.

---

## 4. WebSocket Event Contract

| Event Name | Direction | Payload Schema | Description |
|---|---|---|---|
| \`join_conversation\` | Client → Server | \`conversationId: string\` | Subscribes client socket to session room |
| \`leave_conversation\` | Client → Server | \`conversationId: string\` | Unsubscribes client socket from session room |
| \`agent:step\` | Server → Client | \`{ step, thought, tool, args, result, isWriteAction, timestamp }\` | Emitted on every Reason, Act, and Observe transition |
| \`agent:confirm_request\` | Server → Client | \`{ confirmationId, tool, args, description, conversationId }\` | Emitted when a write action is paused for human approval |
| \`agent:complete\` | Server → Client | \`{ conversationId, finalAnswer, stepsCount }\` | Emitted when the ReAct loop successfully finishes |
| \`agent:error\` | Server → Client | \`{ conversationId, message, error }\` | Emitted on unrecoverable orchestrator failure |
| \`audit:new_log\` | Server → Client | \`{ _id, tool, status, confirmedByUser, executionDurationMs, createdAt }\` | Global broadcast on every executed tool invocation |

---

## 5. Styling & Visual Design System

The client follows modern design standards to deliver a premium, portfolio-grade user experience:

- **Color Palette:**
  - Deep Dark Base: \`#060911\` (body), \`#0b101d\` (cards), \`#111827\` (nested surfaces).
  - Brand Emerald: \`#10b981\` (primary accents, active indicators, successful tools).
  - Amber Warning: \`#f59e0b\` (HITL confirmation badges, write tool indicators).
  - Indigo AI: \`#6366f1\` (LLM reasoning thoughts, prompt highlights).
  - Rose Danger: \`#f43f5e\` (rejection buttons, execution errors).
- **Glassmorphism:** \`backdrop-blur-md\`, semi-transparent backgrounds (\`rgba(15, 23, 42, 0.75)\`), and subtle border styling (\`border-slate-800/80\`).
- **Typography:**
  - UI Text: \`Inter\` via Google Fonts (clean, modern sans-serif).
  - Data / Tool Arguments: \`JetBrains Mono\` (monospace syntax formatting).
- **Responsive Layout:**
  - Mobile (< 768px): Single column stacked layout with touch-friendly touch targets.
  - Desktop (>= 1024px): 12-column grid with 7 columns for the ReAct stream and 5 columns for the tabbed workspace.

---

## 6. Security & Guardrails

1. **HttpOnly Cookie Persistence:** All REST requests set \`credentials: 'include'\`, preventing JavaScript from accessing JWT secrets directly and preventing XSS token theft.
2. **Schema-Enforced Previews:** Confirmation dialogs safely parse and render tool arguments rather than rendering raw unescaped HTML strings.
3. **Graceful Degradation:** When disconnected from WebSockets or when the backend server is temporarily down, status indicators clearly signal disconnected state without freezing the UI.
`);

// 3. TaskPilot-client/decision.md
writeFile('decision.md', `# TaskPilot Client — Architectural Decision Records (ADRs)

This document records all significant technical and design decisions made for the TaskPilot React frontend.

---

## ADR-C001: Technology Stack — Vite + React 19 SPA vs Next.js vs CRA

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  TaskPilot requires a fast, responsive frontend to visualize live agentic workflows. We needed to choose an application framework that provides instant hot-module replacement (HMR), minimal bundle overhead, native WebSocket support, and effortless single-page deployment on Vercel.

- **Decision:**
  Adopt **Vite 8 + React 19** as a Single-Page Application (SPA).

- **Why Taken:**
  1. **Instant Developer Feedback:** Vite offers sub-second cold starts and rapid module updates compared to legacy webpack or heavyweight Next.js dev servers.
  2. **Zero SSR Overhead for WebSocket-Centric App:** The core feature is real-time client-side WebSocket streaming and stateful session memory; server-side rendering (SSR) adds complexity with zero performance benefit for this use case.
  3. **Clean Vercel Deployment:** Compiles to static assets (\`dist/\`) that deploy globally to Vercel edge CDN with zero serverless cold starts.

- **Alternatives Considered:**
  1. *Next.js (App Router):* Overkill for a single-page agent dashboard; complicates WebSocket state and HttpOnly cookie pass-through during SSR.
  2. *Create React App (CRA):* Deprecated, slow webpack builds, and outdated toolchains.

---

## ADR-C002: Styling Architecture — Tailwind CSS v3 vs Component Libraries

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The frontend must deliver a state-of-the-art visual aesthetic with sleek dark modes, subtle glassmorphism, animated pulse indicators, and responsive panel layouts without boilerplate bloat.

- **Decision:**
  Implement **Tailwind CSS v3** supplemented with custom utility classes (\`.glass-panel\`, \`.glass-panel-elevated\`) and **Lucide React** icons.

- **Why Taken:**
  1. **Aesthetic Precision:** Complete control over color tailoring (dark slate backgrounds, emerald brand highlights, amber warning cards) without fighting library default themes.
  2. **Minimal Bundle Size:** Purges unused CSS classes during production build, resulting in a 24 KB total stylesheet.
  3. **High Architectural Alignment:** Directly fulfills the technical specifications in Section 5 of \`architecture.md\`.

- **Alternatives Considered:**
  1. *Material UI (MUI) / Ant Design:* Heavy bundle footprints (~300 KB+), generic enterprise look that dilutes the agentic AI aesthetic.
  2. *Vanilla CSS Only:* Highly flexible but slower to write and harder to maintain responsive grids and micro-interactions solo.

---

## ADR-C003: Dual-Transport Integration Pattern (REST + Socket.io-client)

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The client must perform synchronous request-response actions (login, goal initiation, confirmations, task CRUD) while simultaneously receiving asynchronous streaming events (reasoning thoughts, tool invocations, audit log broadcasts).

- **Decision:**
  Implement a **Dual-Transport Pattern**:
  1. **HTTP/REST Transport (\`src/api/client.js\`):** Handles command-like mutations (\`POST /api/agent/task\`, \`POST /api/agent/confirm\`, task CRUD).
  2. **WebSocket Transport (\`src/context/SocketContext.jsx\`):** Maintains a persistent bidirectional socket with Port 5001, dynamically subscribing to conversation rooms (\`join_conversation\`) to stream \`agent:step\` and \`agent:confirm_request\` events.

- **Why Taken:**
  1. **Deterministic Request Lifecycle:** Avoids routing complex HTTP authentication and file-like mutations entirely over WebSockets.
  2. **Zero-Latency Stream:** Eliminates HTTP polling for agent reasoning steps and newly dispatched audit logs.
  3. **Resilience:** If the WebSocket briefly reconnects, REST endpoints remain operational, and session state is preserved on the server.

---

## ADR-C004: Explicit ReAct Loop Decomposition in UI (Reason → Act → Observe)

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  Traditional conversational AI interfaces display only a spinner followed by a final text paragraph, hiding the agent's multi-step tool execution logic. To demonstrate genuine agentic AI engineering, the UI must reveal the loop mechanics.

- **Decision:**
  Build a dedicated \`ReasoningFeed\` component that decomposes each step into:
  1. 🧠 **REASON:** The LLM's thought process, sub-goal reasoning, and next-action rationale (highlighted in indigo).
  2. ⚡ **ACT:** Structured tool execution request with argument schema formatting and write-guardrail badge (highlighted in amber).
  3. 👁️ **OBSERVE:** Real output received from external APIs or internal services (highlighted in emerald).
  4. Final synthesized response card upon goal completion.

- **Why Taken:**
  1. **High Portfolio & Interview Signal:** Demonstrates transparent AI engineering and proves the existence of a true ReAct loop rather than a mock chat prompt.
  2. **Trust & Observability:** Users see exactly why the agent chose a tool and what data was retrieved before an action occurs.

---

## ADR-C005: Modal-Based Human-in-the-Loop (HITL) Interception Pattern

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  When the backend pauses execution on write actions (\`create_calendar_event\`, \`create_task\`, \`complete_task\`), the UI must immediately capture the user's attention, present the proposed mutation clearly, and provide simple Approve or Reject controls.

- **Decision:**
  Implement \`ConfirmationModal.jsx\` which activates whenever \`pendingConfirmation\` is received over Socket.io or returned by the task endpoint.
  - Displays tool name, targeted parameters (calendar event time, description, or task title), and a safety advisory.
  - Renders **Approve & Execute** (calls \`POST /api/agent/confirm\` with \`approved: true\`) and **Reject / Cancel** (calls with \`approved: false\`).

- **Why Taken:**
  1. **Fail-Safe UI:** Prevents background execution while ensuring the user understands what mutation is pending.
  2. **Bifurcated User Control:** Allows the user to reject unwanted hallucinations without crashing the conversation; the LLM receives the cancellation observation and can apologize or suggest alternatives.

---

## ADR-C006: Context-Based Global State Architecture

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The frontend requires sharing user session state, backend health metrics, and socket connectivity across multiple components without introducing unnecessary boilerplate.

- **Decision:**
  Use native React Contexts:
  - \`AuthContext\`: User profile, authentication state, Google Calendar link status, Dev Login.
  - \`SocketContext\`: Persistent socket instance, connection status.
  - \`useAgentSession\`: Encapsulated hook managing active conversation state, steps, and pending confirmations.

- **Why Taken:**
  1. **Zero External Dependencies:** Eliminates Redux Toolkit or Zustand packages for a scoped application.
  2. **Simple Testing & Maintenance:** Easy to inspect and debug with standard React DevTools.

---

## ADR-C007: HttpOnly Cookie Transport with \`credentials: 'include'\`

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The backend issues JWT session tokens inside \`HttpOnly\`, \`SameSite=Lax\` cookies. The client needs to authenticate all API requests without exposing tokens to \`localStorage\`.

- **Decision:**
  Configure the centralized fetch wrapper in \`src/api/client.js\` with \`credentials: 'include'\` on all requests.

- **Why Taken:**
  1. **Maximum XSS Protection:** Prevents malicious client-side scripts from reading tokens from storage.
  2. **Seamless Browser Cookie Lifecycle:** Automatically attaches cookies across all origin-compliant requests.

---

## ADR-C008: Real-Time Audit Log Insertion via WebSocket Events

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The Action Audit Trail must reflect newly executed tools immediately without forcing users to click "Refresh" or running periodic background interval polling.

- **Decision:**
  In \`AuditLogPanel.jsx\`, listen directly to the \`audit:new_log\` WebSocket event. When a new log arrives, prepend it to the top of the table in memory and update the total action count.

- **Why Taken:**
  1. **Instant Observability:** Users see the audit entry appear the moment an action is executed.
  2. **Zero Server Polling Load:** Completely eliminates periodic \`GET /api/audit-logs\` HTTP polling overhead.

---

## ADR-C009: Quick Dev-Login Bypass for Accelerated Evaluation

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  During portfolio reviews and local development, setting up and authenticating real Google OAuth credentials can be cumbersome or blocked by redirect URI restrictions.

- **Decision:**
  Implement a prominent "Dev Quick Login" button calling \`POST /api/auth/dev-login\` alongside the standard Google OAuth connect button.

- **Why Taken:**
  1. **Instant Reviewer Accessibility:** Enables hiring managers and interviewers to run and test the complete agent loop in 1 click without OAuth setup.
  2. **Seamless Dual Mode:** Users with valid Google credentials can still click "Connect Calendar" to link real Google Calendar instances.

---

## ADR-C010: Vercel Single-Page Application (SPA) Deployment Strategy

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The client will be deployed to Vercel independently from the backend (which deploys to Render). The client needs proper environment variable wiring and SPA routing rewrite rules.

- **Decision:**
  1. Use \`import.meta.env.VITE_API_URL\` with fallback to \`http://localhost:5001\`.
  2. Maintain \`.env\` and \`.env.example\` in the client root.
  3. Pre-configure clean production builds (\`npm run build\` outputting to \`dist/\`).

- **Why Taken:**
  1. **Separation of Concerns:** Client and Server can scale, deploy, and redeploy independently.
  2. **Zero Configuration for Vercel:** Vite's standard output is automatically recognized by Vercel.
`);

console.log('Frontend documentation files successfully generated.');
