# TaskPilot — Project Context

## What This Is

TaskPilot is a MERN-based AI agent that takes natural-language requests, plans multi-step actions, calls real external tools to execute them, and asks for human confirmation before any irreversible action. It's the third project in a portfolio that already includes a RAG-based document analysis app and a real-time collaborative tracker — this one proves a different, higher-signal capability: **agentic AI (planning + tool execution)**, not just retrieval or CRUD.

## Purpose

Most AI demos can only answer questions. TaskPilot closes the gap between "AI that talks" and "AI that acts" — it reasons through a goal, decides which tool to call, executes it (with your approval), observes the result, and continues until the goal is done. This is the core pattern ("agentic AI") that the industry is currently hiring for.

## Primary Use Case

A personal productivity assistant. Example requests it should handle:
- *"Check if I'm free Tuesday afternoon and schedule a call with my mentor."*
- *"Add a task to finish the deployment by Friday and remind me two days before."*

## Scope for This Build (Deliberately Trimmed)

This is a solo, resume-focused build — scoped to be genuinely finishable in ~8–10 days while still fully proving the agentic pattern. See `architecture.md` for full technical detail. Key scope decisions:

**In scope:**
- Hand-built ReAct loop (Reason → Act → Observe → repeat) — no LangChain/LangGraph, to force real understanding of the mechanism
- Exactly 2 tools: Google Calendar (read: check availability, write: create event) and an internal Task API (write: create/complete task)
- Confirm-before-write guardrail (a modal — Approve/Reject) before any action that changes real state
- Live reasoning stream to the UI via Socket.io
- Basic audit log (MongoDB collection + simple table UI) — every tool call recorded
- JWT (HttpOnly cookies) + Google OAuth 2.0 for auth and Calendar access

**Explicitly out of scope (cut on purpose — be ready to explain why if asked):**
- Gmail integration (send email) — one more OAuth scope + integration for marginal payoff over what Calendar already proves
- Web search tool — doesn't add a new *type* of capability (already have one read tool + one write tool)
- LangChain/LangGraph — hand-rolling the loop is less total effort and stronger to defend in an interview
- Multi-user roles/permissions — single-user personal assistant, not a SaaS product
- Redis rate limiting, retry/backoff logic, encrypted token storage — real production concerns, noted as "future work" in the README rather than built
- Configurable/searchable/exportable audit log — a basic table proves the concept

## Tech Stack (Summary — full detail in architecture.md)

- **Frontend:** React.js, Socket.io-client, Tailwind CSS
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB (Atlas free tier)
- **Auth:** JWT (HttpOnly cookies), Google OAuth 2.0
- **AI/Agent:** Gemini API and/or Groq API (function-calling mode), hand-built orchestration loop
- **External Tools:** Google Calendar API, internal Task API
- **Deployment:** Vercel (client), Render (server)

## Why This Stack

~70% of this reuses skills already proven in earlier projects (React, Node, Express, MongoDB, JWT, OAuth, Socket.io, Vercel/Render deployment pattern). The genuinely new piece is the agent orchestration layer — the ReAct loop and LLM function-calling — which is the actual point of building this project.

## Definition of Done

A live, deployed demo where a user can type a request, watch the agent reason through steps in real time, approve a write action via a confirmation modal, see the action actually happen (event created in Calendar / task created), and view it in the audit log afterward. README explains the architecture and explicitly lists what was cut and why.

## Resume Bullet (once built)

> Built TaskPilot, an AI agent that plans and executes multi-step real-world tasks (calendar scheduling, task management) via natural-language input, using a hand-built ReAct-style reasoning loop with Gemini/Groq function-calling, human-in-the-loop confirmation for write actions, live reasoning stream via Socket.io, and action audit logging (MERN stack, JWT/OAuth 2.0).

## Related Document

See `architecture.md` in this same folder for the full system diagram, component breakdown, request lifecycle sequence diagram, security guardrails, and the day-by-day build order.
