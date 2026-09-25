# TaskPilot — Architecture Decision Records (ADR)

This document tracks every key technical and architectural decision made for the **TaskPilot** project. Each entry details the context, the decision made, the rationale, the alternatives considered, and why those alternatives were rejected. This log is continuously updated as new features, dependencies, or architectural patterns are introduced.

---

## Index of Decisions

- [ADR-001: Architecture Pattern — Hand-Built ReAct Loop vs Frameworks](#adr-001-architecture-pattern--hand-built-react-loop-vs-frameworks)
- [ADR-002: LLM Provider & Execution Mode — Function-Calling API (Gemini / Groq)](#adr-002-llm-provider--execution-mode--function-calling-api-gemini--groq)
- [ADR-003: Safety Guardrail — Human-in-the-Loop Confirmation for Write Actions](#adr-003-safety-guardrail--human-in-the-loop-confirmation-for-write-actions)
- [ADR-004: Tooling Scope — Deliberate 2-Tool Focus (Google Calendar + Internal Tasks)](#adr-004-tooling-scope--deliberate-2-tool-focus-google-calendar--internal-tasks)
- [ADR-005: Safety & Termination — Hardcoded Max-Step Cap (6 Steps)](#adr-005-safety--termination--hardcoded-max-step-cap-6-steps)
- [ADR-006: Real-time Communication — Socket.io over WebSockets](#adr-006-real-time-communication--socketio-over-websockets)
- [ADR-007: Tool Input Validation — Strict Schema Checking via Zod](#adr-007-tool-input-validation--strict-schema-checking-via-zod)
- [ADR-008: Backend Project Structure & Layering](#adr-008-backend-project-structure--layering)
- [ADR-009: Audit Logging Architecture — MongoDB `actionLogs` Collection](#adr-009-audit-logging-architecture--mongodb-actionlogs-collection)
- [ADR-010: Authentication & Session Strategy — JWT HttpOnly Cookies + Google OAuth 2.0](#adr-010-authentication--session-strategy--jwt-httponly-cookies--google-oauth-20)
- [ADR-011: Module System — Native ECMAScript Modules (ESM)](#adr-011-module-system--native-ecmascript-modules-esm)
- [ADR-012: LLM Provider Integration — Unified Adapter Pattern](#adr-012-llm-provider-integration--unified-adapter-pattern)
- [ADR-013: Tool Definition Architecture — Declarative Registry with Zod Schemas](#adr-013-tool-definition-architecture--declarative-registry-with-zod-schemas)
- [ADR-014: Official Google Gemini SDK Selection — @google/generative-ai](#adr-014-official-google-gemini-sdk-selection--googlegenerative-ai)
- [ADR-015: Database Schema Design — Distinct Mongoose Models for Agent Lifecycle](#adr-015-database-schema-design--distinct-mongoose-models-for-agent-lifecycle)
- [ADR-016: Groq Model Selection — openai/gpt-oss-120b](#adr-016-groq-model-selection--openaigpt-oss-120b)
- [ADR-017: Version Control Strategy — Strict .gitignore Rules for Credential Protection](#adr-017-version-control-strategy--strict-gitignore-rules-for-credential-protection)
- [ADR-018: Tool Parameter Nullability & Multi-Provider Schema Normalization](#adr-018-tool-parameter-nullability--multi-provider-schema-normalization)
- [ADR-019: Google OAuth 2.0 Token Lifecycle & Read-Only Calendar Tool Architecture](#adr-019-google-oauth-20-token-lifecycle--read-only-calendar-tool-architecture)
- [ADR-020: Human-in-the-Loop Confirmation State Machine & Write Action Resumption](#adr-020-human-in-the-loop-confirmation-state-machine--write-action-resumption)
- [ADR-021: Internal Task Tooling & Dual-Domain Guardrail Parity](#adr-021-internal-task-tooling--dual-domain-guardrail-parity)

---

## ADR-001: Architecture Pattern — Hand-Built ReAct Loop vs Frameworks

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  TaskPilot requires an agentic execution model capable of receiving natural-language requests, formulating multi-step plans, calling external tools, observing the results, and deciding whether to repeat or finish. We need to decide whether to use an existing agent framework or implement the loop from scratch.

- **Decision:**
  Implement a custom, hand-built ReAct (Reason → Act → Observe → Repeat) loop directly in Node.js/Express without relying on LangChain, LangGraph, LlamaIndex, or CrewAI.

- **Why Taken:**
  1. **High Signal in Interviews:** Demonstrates foundational understanding of agent mechanics (prompt composition, state machines, tool dispatching, observation injection) rather than merely stitching third-party library abstractions.
  2. **Zero Abstraction Bloat:** Eliminates complex dependency chains, breaking API updates, and opaque framework internals.
  3. **Direct WebSocket Streaming:** Full control over every state transition (reasoning output, tool invocation, observation, completion) allows clean, direct Socket.io emissions to the UI.
  4. **Efficient Scoping:** For a 2-tool assistant, hand-rolling the loop is fewer lines of code and far simpler to debug than learning and configuring LangGraph state channels.

- **Alternatives Considered:**
  1. *LangChain.js / LangGraph:* The dominant TypeScript/JavaScript framework for agent orchestration.
  2. *LlamaIndex.ts:* Agentic framework centered around data retrieval and tool orchestration.
  3. *CrewAI / AutoGen:* Multi-agent collaboration frameworks.

- **Why Alternatives Were Not Taken:**
  - *LangChain / LangGraph:* High abstraction overhead, rapid breaking API changes, and masks the core engineering mechanics that interviewers probe for.
  - *LlamaIndex:* Optimized primarily for document search/RAG, which is not the core focus of this action-oriented assistant.
  - *CrewAI / AutoGen:* Built for multi-agent negotiation, which is unnecessary complexity and token waste for a single-user personal productivity assistant.

---

## ADR-002: LLM Provider & Execution Mode — Function-Calling API (Gemini / Groq)

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The agent loop requires an LLM capable of structured tool/function calling (producing structured tool invocations rather than arbitrary conversational text) and streaming responses with minimal latency.

- **Decision:**
  Use Google Gemini (e.g. `gemini-1.5-flash` / `gemini-2.0-flash`) and Groq (`llama-3.3-70b-versatile`) via their native function-calling interfaces, wrapped in a modular LLM service adapter.

- **Why Taken:**
  1. **Low Latency:** Groq and Gemini Flash offer exceptional inference speeds (sub-second response times), crucial for a smooth live reasoning feed in the UI.
  2. **Generous Free/Low-Cost Tiers:** Both providers allow full development, testing, and portfolio demonstrations without mandatory paid credit minimums.
  3. **High Reliability in Tool Calling:** Both natively support tool declarations (JSON schema) and output structured function call objects directly.
  4. **Provider Flexibility:** Decoupling behind an adapter allows toggling between Gemini and Groq if rate limits or outages occur.

- **Alternatives Considered:**
  1. *OpenAI (GPT-4o / GPT-4o-mini):* The industry standard for tool calling.
  2. *Anthropic Claude 3.5 Sonnet:* State-of-the-art reasoning and tool calling.
  3. *Local LLM via Ollama:* 100% private, free local inference.
  4. *Prompt Engineering for Raw JSON Output (No Function Calling API):* Prompting the model to emit raw JSON blocks like `{"tool": "..."}`.

- **Why Alternatives Were Not Taken:**
  - *OpenAI & Anthropic:* Require upfront paid account billing and lack free tiers for developer portfolio projects.
  - *Local Ollama:* Depends heavily on host machine GPU/VRAM, has variable token generation speeds, and complicates cloud deployment to Render/Vercel.
  - *Prompt Engineering for Raw JSON:* Highly brittle, prone to markdown formatting errors, hallucinated keys, and parsing failures compared to native tool-calling APIs.

---

## ADR-003: Safety Guardrail — Human-in-the-Loop Confirmation for Write Actions

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  Agents interacting with external systems (Google Calendar, task databases) can make irreversible errors due to hallucinations or ambiguous inputs. We must ensure actions changing real-world state are safe.

- **Decision:**
  Implement a "Confirm-Before-Write" pattern: any action that mutates state (`create_calendar_event`, `create_task`, `complete_task`) pauses the ReAct loop, persists a pending confirmation record in MongoDB, notifies the frontend via Socket.io, and awaits an explicit user approval (`POST /api/agent/confirm`) before execution proceeds.

- **Why Taken:**
  1. **Prevents Irreversible Side-Effects:** Erroneous calendar invitations or task updates are stopped before execution.
  2. **Industry Best Practice:** Human-in-the-loop (HITL) execution is the benchmark for production-grade agent systems.
  3. **High Portfolio Impact:** Demonstrates understanding of agent safety, guardrails, and stateful workflow management.

- **Alternatives Considered:**
  1. *Autonomous Execution with Undo/Rollback:* Let the agent execute immediately and offer an "Undo" button.
  2. *Terminal/CLI Confirmation:* Prompt the operator in the backend terminal console.
  3. *Post-Execution Notification:* Run the action and simply notify the user afterward.

- **Why Alternatives Were Not Taken:**
  - *Autonomous Execution with Undo:* External mutations (such as emails or calendar invitations sent to other attendees) cannot be cleanly undone without external disruption.
  - *Terminal/CLI Confirmation:* Incompatible with a web application architecture and disconnected from the end user.
  - *Post-Execution Notification:* Does not prevent the mistake from occurring.

---

## ADR-004: Tooling Scope — Deliberate 2-Tool Focus (Google Calendar + Internal Tasks)

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  A common trap in agent projects is attempting to integrate too many APIs (Gmail, Slack, Jira, Search, Weather, Calculator), resulting in a bloated, half-finished codebase burdened by third-party auth hurdles.

- **Decision:**
  Deliberately constrain the tool ecosystem to exactly 2 core domains:
  1. **Google Calendar API:** 1 Read action (`check_calendar_availability`), 1 Write action (`create_calendar_event`).
  2. **Internal Task API:** 1 Write action (`create_task`), 1 Status mutation action (`complete_task`).

- **Why Taken:**
  1. **Full Functional Matrix:** Completely proves an external read tool, an external write tool with OAuth, and an internal persistent database tool with confirmation.
  2. **Feasibility in 8–10 Days:** Allows complete, polished delivery with comprehensive testing and zero unfinished feature stubs.
  3. **Clear Narrative for Interviews:** "I scoped deliberately to prove each distinct category of capability without redundant integration churn."

- **Alternatives Considered:**
  1. *Gmail Integration (Send / Read Email):*
  2. *Web Search Tool (Tavily / Google Search / SerpAPI):*
  3. *File System / Code Sandbox Tool:*

- **Why Alternatives Were Not Taken:**
  - *Gmail Tool:* Requires sensitive Google OAuth verification and complex MIME drafting, while adding no novel architectural pattern beyond what Google Calendar already proves.
  - *Web Search Tool:* Only adds another read tool, offering no new safety or confirmation challenges.
  - *File/Code Sandbox:* Introduces security vulnerabilities and complex sandboxing requirements outside the scope of a personal productivity assistant.

---

## ADR-005: Safety & Termination — Hardcoded Max-Step Cap (6 Steps)

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  An agent loop can get trapped in repetitive loops if tool executions fail or if the LLM enters cyclic reasoning, consuming unlimited tokens and exhausting rate limits.

- **Decision:**
  Hardcode a strict cap of 6 ReAct iterations per user request directly in the orchestrator loop. If step count reaches 6 without the LLM concluding, the loop terminates gracefully, emits an explanatory message to the user, and logs the truncation.

- **Why Taken:**
  1. **Defensive Programming:** Protects API quotas and prevents runaway background processes.
  2. **Sufficient for Scope:** The defined use cases (check calendar + create event + add task) require at most 3–4 steps; 6 steps provides sufficient headroom for a self-correction step without risk of infinite cycling.

- **Alternatives Considered:**
  1. *Time-based Timeout Only (e.g. 60 seconds):*
  2. *Dynamic LLM-Determined Step Budget:*
  3. *Uncapped Execution:*

- **Why Alternatives Were Not Taken:**
  - *Time-based Timeout:* An LLM can fire dozens of rapid API calls within 60 seconds, draining quotas before the timeout triggers.
  - *Dynamic LLM Budget:* An LLM that is hallucinating or confused cannot be trusted to budget its own recovery steps.
  - *Uncapped Execution:* Completely unsafe in production or development.

---

## ADR-006: Real-time Communication — Socket.io over WebSockets

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The frontend requires real-time updates as the agent reasons, executes tools, and requests human confirmation.

- **Decision:**
  Use Socket.io for bi-directional communication between the Express server and the React frontend.

- **Why Taken:**
  1. **Event-driven Simplicity:** Clean named events (`agent:step`, `agent:confirm_request`, `agent:complete`, `agent:error`).
  2. **Room-Based Session Isolation:** Clients join a room mapped to their `conversationId`, ensuring multi-tab or multi-session reasoning streams do not collide.
  3. **Reliability:** Built-in connection management, auto-reconnection, and HTTP long-polling fallback for hosting environments with restrictive WebSocket proxies.

- **Alternatives Considered:**
  1. *Server-Sent Events (SSE):*
  2. *Raw WebSockets (`ws` package):*
  3. *HTTP Polling:*

- **Why Alternatives Were Not Taken:**
  - *SSE:* Strictly one-way communication; handling confirmations would still require separate HTTP paths without unified connection lifecycle tracking.
  - *Raw WebSockets:* Requires writing custom heartbeat, reconnection, and room subscription logic from scratch.
  - *HTTP Polling:* Creates unnecessary request storms, laggy UI updates, and higher database/server load.

---

## ADR-007: Tool Input Validation — Strict Schema Checking via Zod

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  LLMs in tool-calling mode may output invalid date formats, missing arguments, or unexpected data types. Calling external APIs with untrusted parameters leads to unhandled exceptions and brittle code.

- **Decision:**
  Define strict Zod schemas for every tool. When the LLM calls a tool, the orchestrator parses the arguments through the tool's Zod schema before invoking the implementation.

- **Why Taken:**
  1. **Self-Healing Loop:** If validation fails, the Zod error message is formatted and fed directly back to the LLM in the `Observe` phase, enabling the agent to rectify its mistake in the next step.
  2. **Defense in Depth:** Ensures external APIs (Google Calendar) and internal databases receive clean, sanitized, and typed data.

- **Alternatives Considered:**
  1. *Direct Trust (No Validation):* Rely solely on the LLM's adherence to the function declaration.
  2. *Manual `if/else` Checks in Each Tool:*
  3. *Ajv / JSON Schema Validators:*

- **Why Alternatives Were Not Taken:**
  - *Direct Trust:* Results in unpredictable runtime exceptions and crashes.
  - *Manual Checks:* Verbose, inconsistent across tools, and harder to transform into standardized feedback for the LLM.
  - *Ajv:* JSON schema syntax is significantly more verbose and less ergonomic in modern JavaScript than Zod.

---

## ADR-008: Backend Project Structure & Layering

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  We need a clear, scalable folder architecture inside the `server` workspace that isolates agent logic, tools, database models, and web transports.

- **Decision:**
  Organize the backend into a modular service-oriented architecture:
  ```
  server/
  ├── src/
  │   ├── config/          # DB connection, environment variables, OAuth setup
  │   ├── controllers/     # Route handlers for HTTP endpoints
  │   ├── middleware/      # Auth, error handling, validation
  │   ├── models/          # Mongoose schemas (User, Conversation, ActionLog, Task, PendingConfirmation)
  │   ├── orchestrator/    # Core ReAct loop, LLM adapter, step runner, prompt definitions
  │   ├── routes/          # Express route definitions
  │   ├── services/        # Confirmation manager, audit logging, calendar service, task service
  │   ├── sockets/         # Socket.io gateway and event handlers
  │   ├── tools/           # Tool schemas (Zod) and tool executors
  │   └── server.js        # Main entry point: Express app + HTTP server + Socket.io initialization
  ├── decision.md          # Architectural Decision Records (this file)
  ├── architecture.md      # System architecture specification
  ├── projectcontext.md    # Project background and requirements
  ├── package.json
  └── .env.example
  ```

- **Why Taken:**
  1. **Separation of Concerns:** Agent orchestration is completely isolated from HTTP routing and socket dispatching.
  2. **Extensibility:** Adding a new tool only requires adding a file in `tools/` and registering its schema.
  3. **Maintainability:** Standardized Express layering familiar to any professional backend engineer.

- **Alternatives Considered:**
  1. *Flat / Single File Structure (`index.js`):* Everything in one or two files.
  2. *Feature-Sliced / Monorepo setup:* Complex tooling packages.

- **Why Alternatives Were Not Taken:**
  - *Flat structure:* Unmanageable once models, tools, schemas, and sockets interact.
  - *Monorepo setup:* Unnecessary overhead for this standalone backend service.

---

## ADR-009: Audit Logging Architecture — MongoDB `actionLogs` Collection

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  For accountability, debugging, and resume credibility, every action executed by the agent must be recorded with full provenance (timestamp, tool name, input arguments, execution result, user confirmation status).

- **Decision:**
  Persist every tool execution as an immutable document in a dedicated MongoDB collection (`actionLogs`) via an `auditLogger` service.

- **Why Taken:**
  1. **Direct Queryability:** The React UI can fetch recent actions via a clean REST endpoint (`GET /api/audit-logs`) without requiring external log aggregation tools.
  2. **Schema Alignment:** Structured JSON logs fit MongoDB naturally.
  3. **Zero Extra Infrastructure:** Leverages the existing MongoDB Atlas cluster without adding Elasticsearch, Logstash, or Datadog.

- **Alternatives Considered:**
  1. *File-Based Logging (e.g. Winston / Morgan writing to `.log` files):*
  2. *Third-Party APM / Log SaaS (Datadog / Loggly):*
  3. *In-Memory Log Array:*

- **Why Alternatives Were Not Taken:**
  - *File Logs:* Ephemeral on cloud platforms like Render (containers restart and wipe disk), and difficult to serve to the client table UI.
  - *Third-Party SaaS:* Adds external API keys, configuration friction, and potential billing.
  - *In-Memory Logs:* Lost on server restart and doesn't scale.

---

## ADR-010: Authentication & Session Strategy — JWT HttpOnly Cookies + Google OAuth 2.0

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  TaskPilot needs user authentication to isolate user conversations, tasks, and audit logs, plus Google OAuth 2.0 tokens to access the Google Calendar API on behalf of the user.

- **Decision:**
  Use JWTs stored in secure `HttpOnly`, `SameSite=Lax` cookies for application session management, combined with Google OAuth 2.0 (using offline access to obtain a refresh token) for Calendar API authorization.

- **Why Taken:**
  1. **XSS Protection:** HttpOnly cookies prevent client-side JavaScript from accessing session tokens.
  2. **Seamless Calendar Access:** Refresh tokens allow the backend to query calendar availability and create events even across sessions.
  3. **Standard MERN Pattern:** Reuses established patterns, saving time for the core agentic AI layer.

- **Alternatives Considered:**
  1. *JWT stored in `localStorage`:*
  2. *Server-side session store in Redis (`express-session`):*
  3. *Mock Auth (Hardcoded single user ID):*

- **Why Alternatives Were Not Taken:**
  - *LocalStorage JWT:* Vulnerable to XSS token theft.
  - *Redis Sessions:* Adds another stateful infrastructure dependency to host and maintain.
  - *Mock Auth:* Lacks Google Calendar OAuth integration, which is essential to prove the external tool capability.

---

## ADR-011: Module System — Native ECMAScript Modules (ESM)

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  Node.js supports both CommonJS (`require`/`module.exports`) and ECMAScript Modules (`import`/`export`). We must establish the module standard for the backend codebase.

- **Decision:**
  Adopt native ECMAScript Modules (ESM) by configuring `"type": "module"` in `package.json`.

- **Why Taken:**
  1. **Modern Standard:** Official JavaScript standard, aligning with the broader JavaScript/TypeScript ecosystem.
  2. **Top-Level Await:** Enables clean asynchronous initialization (such as connecting to MongoDB or testing scripts) without wrapping code in IIFEs (`(async () => {})()`).
  3. **Seamless Integration:** Modern AI and utility packages (such as `@google/genai`, latest versions of various libraries) are increasingly ESM-first.

- **Alternatives Considered:**
  1. *CommonJS (`require` / `module.exports`):* Traditional Node.js module system.
  2. *TypeScript compilation (`tsc` compiling to CJS):* Using TypeScript build pipeline.

- **Why Alternatives Were Not Taken:**
  - *CommonJS:* Legacy standard; incompatible with many ESM-only packages without awkward dynamic `import()`, and does not support top-level await.
  - *TypeScript compilation:* Adds compilation step, source maps, and build tooling overhead for an 8–10 day JavaScript MERN build.

---

## ADR-012: LLM Provider Integration — Unified Adapter Pattern

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The architecture allows both Google Gemini API and Groq API. Different SDKs use different function declaration schemas, message formats, and response objects. We need a way to support both without coupling the ReAct loop directly to any single provider's proprietary API format.

- **Decision:**
  Implement a provider-agnostic `llmAdapter` service that acts as an abstraction layer between the ReAct orchestrator and specific LLM providers (`gemini` and `groq`).

- **Why Taken:**
  1. **Interchangeable Providers:** Switching between Gemini and Groq (or falling back if an API key hits rate limits) requires changing only one environment variable (`DEFAULT_LLM_PROVIDER=gemini` or `groq`).
  2. **Normalized Tool Calling:** The orchestrator works with a single standardized schema (`{ type: "tool_call", name, args, reasoning }` or `{ type: "final_answer", content }`), shielding the loop logic from vendor-specific response payloads.
  3. **Isolated Upgrades:** Upgrading SDK versions or adding a new provider (e.g. Claude or OpenAI in the future) only touches the adapter, leaving the core ReAct engine intact.

- **Alternatives Considered:**
  1. *Direct Vendor SDK Calls in Orchestrator:* Hardcoding Gemini calls directly in the ReAct loop.
  2. *LangChain Model Wrapper:* Using LangChain's `ChatGoogleGenerativeAI` or `ChatGroq`.

- **Why Alternatives Were Not Taken:**
  - *Direct Vendor Calls:* Tightly couples the agent engine to one vendor, making rate-limit failovers or provider switches messy and error-prone.
  - *LangChain Model Wrapper:* Violates ADR-001 by introducing heavy third-party framework dependencies.

---

## ADR-013: Tool Definition Architecture — Declarative Registry with Zod Schemas

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The agent needs to discover tools, advertise them to the LLM via JSON schema parameters, validate LLM-generated arguments, and execute the corresponding logic with guardrails.

- **Decision:**
  Implement a declarative Tool Registry (`src/tools/index.js`) where every tool registers:
  1. `name`: Unique snake_case string identifier.
  2. `description`: Detailed instructions for the LLM on when and how to call the tool.
  3. `parameters`: JSON Schema representation conforming to OpenAPI/Gemini function declaration specs.
  4. `schema`: Zod validation schema for runtime validation.
  5. `isWriteAction`: Boolean flag declaring whether human confirmation is required prior to execution.
  6. `execute`: Asynchronous execution handler receiving validated arguments and execution context.

- **Why Taken:**
  1. **Single Source of Truth:** Tool description, parameter validation, security classification (`isWriteAction`), and execution logic live together in a coherent definition.
  2. **Automated Conversion:** The registry automatically converts tool definitions into provider-compliant declarations for the LLM adapter.
  3. **Zero-Friction Scalability:** Adding a new tool (e.g., Calendar or Task) is as simple as registering an object without modifying the orchestrator loop.

- **Alternatives Considered:**
  1. *Hardcoded `switch/case` in the Orchestrator:* Hardcoding tool checks in `orchestrator.js`.
  2. *Decorators / Class-based Tool Definitions:* Using TypeScript/ES decorators.

- **Why Alternatives Were Not Taken:**
  - *Hardcoded `switch/case`:* Violates Open/Closed Principle; bloats the orchestrator engine with tool-specific details.
  - *Decorators:* Requires experimental Babel or TypeScript compilation stages, complicating the native Node.js ESM setup.

---

## ADR-014: Official Google Gemini SDK Selection — @google/generative-ai

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  Google offers multiple npm libraries for accessing Gemini models, including `@google/generative-ai` and recently `@google/genai`. We need to select the most reliable package for production tool-calling.

- **Decision:**
  Use the official and battle-tested `@google/generative-ai` SDK (`^0.24.1`).

- **Why Taken:**
  1. **Stability & Maturity:** `@google/generative-ai` is the established, stable SDK with mature function-calling APIs (`generateContent` with `functionDeclarations` and `response.functionCalls()`).
  2. **Ecosystem Support:** Comprehensive documentation, widespread community adoption, and proven compatibility with Node.js 20+.
  3. **Zero Deprecation Risk for Core Capabilities:** Native support for all Gemini 1.5 and 2.0 Flash models.

- **Alternatives Considered:**
  1. *`@google/genai`:* Early/experimental unified package.
  2. *Direct HTTP REST API (`generativelanguage.googleapis.com` via `fetch`):* Calling raw endpoints.

- **Why Alternatives Were Not Taken:**
  - *`@google/genai`:* Version tag instability and breaking changes during rollout.
  - *Direct REST API:* Reinvents authentication, streaming, response parsing, and error schema translation from scratch.

---

## ADR-015: Database Schema Design — Distinct Mongoose Models for Agent Lifecycle

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The agent interacts with multiple distinct stateful entities: user accounts and Google OAuth tokens, conversation and chat reasoning histories, immutable audit logs of tool executions, user to-do tasks, and pending action confirmations awaiting human approval.

- **Decision:**
  Create 5 distinct Mongoose models in `src/models/`:
  - `User`: Handles credentials and Google OAuth tokens.
  - `Conversation`: Persists full session message histories and reasoning status.
  - `ActionLog`: Immutable audit trail for every tool invocation.
  - `Task`: User tasks managed and executed by the agent.
  - `PendingConfirmation`: Stateful approval queue for Human-in-the-Loop write actions.

- **Why Taken:**
  1. **Strict Separation of Concerns:** Read/write actions for audit logs, tasks, and confirmations don't cause locking or race conditions on the main user or conversation documents.
  2. **Audit Immutability:** Isolating `ActionLog` ensures logs cannot be accidentally modified or overwritten when conversations update.
  3. **Performance & Indexing:** Direct indexed lookups by `conversationId`, `userId`, and `status`.

- **Alternatives Considered:**
  1. *Omnibus Embedded Document:* Embedding tasks, logs, and confirmations inside a single giant `User` or `Conversation` document.
  2. *Schemaless MongoDB Collections:* Using raw collection drivers without Mongoose schemas.

- **Why Alternatives Were Not Taken:**
  - *Omnibus Embedded Document:* Rapidly encounters MongoDB's 16MB document size limit as conversation histories and tool logs grow, and causes concurrency update conflicts.
  - *Schemaless:* Omits schema-level type enforcement and default values, leading to data corruption from LLM inaccuracies.

---

## ADR-016: Groq Model Selection — `openai/gpt-oss-120b`

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The TaskPilot agent orchestrator requires a model that combines advanced chain-of-thought (CoT) reasoning for multi-step task decomposition, reliable native function calling, and low-latency token generation to power the live Socket.io feed. The user specifically designated the `openai/gpt-oss-120b` model running on Groq.

- **Decision:**
  Configure Groq with model identifier `openai/gpt-oss-120b` as the default primary LLM provider and model for TaskPilot.

- **Why Taken:**
  1. **Advanced 120B MoE Architecture:** With 120 billion parameters in a Mixture-of-Experts structure, it provides superior multi-step planning, tool selection accuracy, and argument formulation compared to smaller dense models.
  2. **Native Chain-of-Thought (CoT) & Function Calling:** Built specifically with structured output and tool invocation capabilities under an open Apache 2.0 license.
  3. **Large 131k Context Window:** Ample capacity (131,072 tokens) for long conversation sessions, extensive multi-step tool call observations, and detailed system prompts without truncating history.
  4. **Groq LPU Acceleration:** Running on Groq's Language Processing Units provides sub-second time-to-first-token and ultra-high generation speed, ensuring the live reasoning stream in the UI feels instantaneous.

- **Alternatives Considered:**
  1. *`llama-3.3-70b-versatile` (Groq):* Previous default model on Groq.
  2. *`gemini-2.5-flash` / `gemini-1.5-flash` (Google):* Google's fast multimodal function-calling models.
  3. *`deepseek-r1-distill-llama-70b` (Groq):* Reasoning model on Groq.

- **Why Alternatives Were Not Taken:**
  - *`llama-3.3-70b-versatile`:* While capable, 70B dense has a lower reasoning and complex tool orchestration ceiling than the 120B parameter MoE architecture of `openai/gpt-oss-120b`.
  - *`gemini-1.5-flash`:* Kept as a supported secondary adapter option, but Groq provides faster raw inference speed on LPU hardware.
  - *`deepseek-r1-distill`:* R1 distilled models often output `<think>` blocks that interfere with strict OpenAI/Groq function-calling API schemas, requiring custom parsing regexes.

---

## ADR-017: Version Control Strategy — Strict `.gitignore` Rules for Credential Protection

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  The project handles sensitive authentication tokens, Google OAuth 2.0 client secrets, LLM API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`), and JWT secrets in `.env`. Committing these secrets or transient build artifacts to a public GitHub repository would cause security breaches and repo bloat.

- **Decision:**
  Create a strict, comprehensive `.gitignore` file that blocks environment files (`.env*`), private keys, OAuth credential JSONs, `node_modules/`, diagnostic logs, test coverage reports, OS caches (`Thumbs.db`, `.DS_Store`), and IDE temporary workspaces.

- **Why Taken:**
  1. **Zero Secret Leakage:** Ensures API keys and OAuth secrets are never accidentally pushed to git.
  2. **Repository Hygiene:** Keeps the repository lightweight and clone-friendly by excluding heavy `node_modules` (198+ packages) and platform-specific OS cache files.
  3. **Reproducibility:** Forces all environments to declare their dependencies explicitly via `package.json` and configure local variables via `.env.example`.

- **Alternatives Considered:**
  1. *Default / Minimal `.gitignore` (ignoring only `node_modules`):*
  2. *Committing `.env` with dummy values directly into version control:*
  3. *No `.gitignore` (relying on manual stage exclusion):*

- **Why Alternatives Were Not Taken:**
  - *Minimal `.gitignore`:* Misses nested environment variations (`.env.local`), OAuth JSON exports (`credentials.json`), and OS metadata.
  - *Committing `.env`:* Highly dangerous; developers inevitably overwrite dummy values with real production keys and commit them.
  - *No `.gitignore`:* Guarantees accidental leakage of credentials and massive repository bloat.

---

## ADR-018: Tool Parameter Nullability & Multi-Provider Schema Normalization

- **Status:** Accepted
- **Date:** 2026-09-23
- **Context:**
  When executing tool calls, open-weight LLMs like `openai/gpt-oss-120b` frequently output `null` for optional parameters (e.g. `{"timezone": null}`). Groq's server-side tool validator strictly verifies incoming tool parameters and returns a `400 Invalid Request` (`expected string, but got null`) if the schema only specifies `type: "string"`. Conversely, Google Gemini's schema parser expects flat single-type strings with a `nullable: true` attribute rather than union arrays (`type: ["string", "null"]`).

- **Decision:**
  1. Define optional tool parameters with union types (`type: ['string', 'null']`) and `z.string().nullable().optional()` in the core tool definitions.
  2. Implement schema normalization inside `getGeminiFunctionDeclarations()` so that array union types are cleanly converted to single types with `nullable: true` when communicating with Gemini, while preserving native array types for Groq.

- **Why Taken:**
  1. **Zero Validation Errors:** Allows LLMs to pass explicit `null` values without triggering `400 tool_use_failed` errors from Groq's validator.
  2. **Multi-Provider Robustness:** Keeps tool declarations compatible with both Groq (OpenAI schema specification) and Google Gemini (OpenAPI subset specification).
  3. **Natural Fallback Handling:** Tool handlers can safely evaluate `args.param || fallback` where `null` evaluates to false and falls back to system defaults.

- **Alternatives Considered:**
  1. *Prompt Engineering to Forbid `null`:* Adding negative instructions like "Never output null; omit the key entirely."
  2. *Removing Optional Parameters:* Hardcoding defaults in tools and stripping parameters from schemas.
  3. *Post-Processing / Intercepting Groq's Tool Call:* Not possible because Groq's API server validates the tool call before returning the response to our backend.

- **Why Alternatives Were Not Taken:**
  - *Prompt Engineering:* Models frequently ignore negative constraints when generating structured JSON schemas under rapid token generation.
  - *Removing Parameters:* Sacrifices capability (e.g., users cannot ask for the time in a specific timezone like "Asia/Kolkata" or "America/New_York").
  - *Post-Processing:* The validation error occurs on Groq's infrastructure before our server even receives the response.

---

## ADR-019: Google OAuth 2.0 Token Lifecycle & Read-Only Calendar Tool Architecture

- **Status:** Accepted
- **Date:** 2026-09-24
- **Context:**
  TaskPilot requires access to the user's Google Calendar to check availability and schedule meetings. The agent needs to query calendar events on behalf of the user, handle token refreshes transparently, enforce safety classifications between read and write actions, and gracefully guide the user when unauthenticated without throwing unhandled exceptions.

- **Decision:**
  1. **Token Storage & Automatic Refresh:** Store Google OAuth access and refresh tokens directly on the `User` Mongoose document. Instantiate `google.auth.OAuth2` client dynamically per request, attaching an `on('tokens')` listener to persist refreshed access tokens back to MongoDB automatically.
  2. **Read-Only Tool Classification:** Register `check_calendar_availability` as an idempotent read action (`isWriteAction: false`), allowing the ReAct loop to query calendar events autonomously without interrupting the user with confirmation prompts.
  3. **Graceful Degradation for Unauthenticated Invocations:** If an unauthenticated user or an account without linked Google credentials executes a calendar query, the tool returns a clean, structured observation (`{ connected: false, message: "..." }`) rather than throwing a fatal error. This allows the LLM's ReAct cycle to observe the missing connection and politely instruct the user to authenticate via `/api/auth/google`.
  4. **Multi-Provider Schema Nullability:** Apply ADR-018 schema rules so optional parameters (`endDate`, `timeZone`) use union types (`type: ['string', 'null']`) for Groq while mapping to single types with `nullable: true` for Gemini.

- **Why Taken:**
  1. **Zero Session Friction:** Automatic token refresh ensures the agent never fails mid-reasoning due to expired Google access tokens (which expire after 1 hour).
  2. **Frictionless Read Workflows:** Checking availability is purely informational and has no real-world side effects; requiring approval for read operations would degrade the user experience.
  3. **Self-Healing Agent Behavior:** Returning informative tool observations allows the LLM to explain auth prerequisites naturally in conversational English rather than failing with internal server error codes.

- **Alternatives Considered:**
  1. *Requiring Human Confirmation on Read Actions:* Prompting the user with an "Approve/Reject" modal before checking calendar availability.
  2. *Storing Tokens in Redis:* Managing OAuth tokens in an external Redis cache.
  3. *Static Hardcoded Mock Calendar Data Only:* Never connecting real Google Calendar APIs.

- **Why Alternatives Were Not Taken:**
  - *Confirmation on Read Actions:* Creates high user fatigue and contradicts standard agent design patterns (only write/mutating actions require HITL approval).
  - *Redis Token Store:* Introduces unnecessary infrastructure complexity for a single-user portfolio assistant.
  - *Mock Calendar Only:* Fails to prove real third-party OAuth token management, which is a major resume-differentiating capability.

---

## ADR-020: Human-in-the-Loop Confirmation State Machine & Write Action Resumption

- **Status:** Accepted
- **Date:** 2026-09-24
- **Context:**
  When executing write actions like `create_calendar_event` or `create_task`, the agent must not modify external state without explicit user consent (ADR-003). We need a robust state machine that pauses the ReAct loop, persists the pending confirmation record across server reboots, notifies the client UI in real time via Socket.io, accepts approval or rejection via REST (`POST /api/agent/confirm`), and cleanly resumes the ReAct reasoning loop.

- **Decision:**
  1. **Intercept at Tool Registry Level:** In `ToolRegistry.validateAndExecute()`, any tool designated with `isWriteAction: true` checks `context.isConfirmed`. If false, execution is immediately intercepted and returns `{ needsConfirmation: true, tool, args, description }` without invoking the mutating function.
  2. **Clean Orchestrator Pause:** The ReAct loop halts its execution loop, emits a `confirmation_required` event, and returns `{ status: 'awaiting_confirmation', pendingAction, messages, step }`.
  3. **State Persistence in MongoDB:** `confirmationService.createPendingConfirmation()` saves a `PendingConfirmation` document with a unique `confirmationId` (`conf_<timestamp>_<random>`), records the intermediate conversation state (`status: 'awaiting_confirmation'`, `stepsCount`), and emits `agent:confirm_request` over Socket.io.
  4. **Bifurcated Resumption Logic:**
     - *On Rejection (`approved: false`):* Update `PendingConfirmation` status to `'rejected'`, log the rejection in `ActionLog` (`confirmedByUser: false`), inject a cancellation observation into the conversation messages (`role: 'tool'`), and resume the ReAct loop so the LLM gracefully acknowledges the cancellation.
     - *On Approval (`approved: true`):* Update `PendingConfirmation` status to `'approved'`, execute the tool with `{ isConfirmed: true }`, record the success in `ActionLog` (`confirmedByUser: true`), inject the tool output into conversation messages, and resume the ReAct loop so the LLM receives the tool observation and generates its final answer.
  5. **Exact Tool Call ID Preservation:** Persist `toolCallId` across both assistant messages and tool observations to ensure strict tool-call pairing compatibility with Groq/OpenAI APIs.

- **Why Taken:**
  1. **Absolute Safety Guarantee:** External side-effects are physically impossible without an explicit `isConfirmed: true` flag passed to the tool handler.
  2. **Zero Context Loss:** Resuming with full conversation history allows the LLM to understand whether its requested write action succeeded or was vetoed, enabling adaptive follow-up responses.
  3. **High Architectural Signal:** Demonstrates stateful asynchronous workflow orchestration, interruptible agent loops, and dual-transport (HTTP + WebSockets) synchronization.

- **Alternatives Considered:**
  1. *Blocking HTTP Request (Holding connection open until user approves):* Keeping the original `POST /api/agent/task` request hanging for minutes.
  2. *Frontend-Only Simulation:* Performing confirmation entirely on the client before calling the backend.
  3. *Unsupervised Execution with Auto-Cancel Window:* Executing immediately and waiting 10 seconds for user to click "Cancel".

- **Why Alternatives Were Not Taken:**
  - *Blocking HTTP Request:* Fragile; gateway timeouts (e.g. Render 30s timeout, browser timeouts) disconnect the client and drop state.
  - *Frontend Simulation:* Easily bypassed, insecure, and eliminates backend agent autonomy.
  - *Auto-Cancel Window:* External mutations (e.g. sending calendar invitations) cannot be undone cleanly after being dispatched.

---

## ADR-021: Internal Task Tooling & Dual-Domain Guardrail Parity

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  With Google Calendar integrated as the external domain (Phase 2 & 3), TaskPilot requires the internal domain: to-do task management (`create_task`, `complete_task`, `list_tasks`). The assistant must manage tasks stored in MongoDB, enforce the same Confirm-Before-Write safety guardrails across internal database mutations as it does for external calendar events, and support multi-tool workflows (e.g., calendar scheduling paired with task creation).

- **Decision:**
  1. **Dual Action Classification:** Classify `create_task` and `complete_task` as write actions (`isWriteAction: true`), ensuring any mutation to the user's task list undergoes human approval via `PendingConfirmation` and Socket.io events. Classify `list_tasks` as an idempotent read action (`isWriteAction: false`) that executes immediately without pause.
  2. **Flexible Task Resolution:** Support completion by either explicit MongoDB `taskId` or natural-language `title` search (using case-insensitive regex on pending tasks), allowing the agent to resolve tasks colloquially (e.g. "complete the deployment task").
  3. **Multi-Domain Composition:** Allow the ReAct orchestrator to seamlessly chain tools across domains: querying calendar availability, creating an event with confirmation, observing the result, and creating a follow-up to-do task with a second confirmation.
  4. **Direct REST API Parity:** Expose `/api/tasks` endpoints (`GET`, `POST`, `PATCH /:id/complete`, `DELETE /:id`) so the frontend client can render and directly manage task lists in addition to agent-driven actions.

- **Why Taken:**
  1. **Consistent Security Posture:** Applying the same HITL confirmation pattern to internal database mutations proves that guardrails are not an afterthought retrofitted only for third-party APIs, but a fundamental architectural principle.
  2. **Deliberate 2-Tool Completeness:** Fulfills ADR-004's promise of completing both an external tool domain (Google Calendar) and an internal database tool domain with zero unfinished stubs.
  3. **Natural User Experience:** Flexible title-based task completion accommodates how humans actually speak to AI assistants without forcing users to remember or copy MongoDB ObjectIds.

- **Alternatives Considered:**
  1. *Allowing Autonomous Task Creation Without Confirmation:* Treating internal tasks as "low risk" and bypassing confirmation.
  2. *Strict ID-Only Task Completion:* Requiring the LLM to know the 24-character hexadecimal MongoDB ID before completing a task.
  3. *In-Memory Task Store:* Storing tasks in a volatile JavaScript array instead of MongoDB.

- **Why Alternatives Were Not Taken:**
  - *Autonomous Task Creation:* Inconsistent safety model; hallucinated task creations would clutter user task lists without recourse.
  - *Strict ID-Only Completion:* Degrades usability and causes LLM failures when users say "complete the report task" without citing an ID.
  - *In-Memory Tasks:* Lost on server restart and incompatible with production deployments.








