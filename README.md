# CodeDetective

Paste a bug, get a verdict. CodeDetective runs a multi-agent investigation through live documentation, shared memory, and your tech stack — then returns a structured case file with a hypothesis, evidence, and a fix you can copy.

## How it works

1. You paste an error or bug description
2. Three agents go to work over a Server-Sent Events stream:
   - **Hermes** — reasons through the problem, forms a hypothesis, writes the conclusion
   - **TinyFish** — searches and fetches live documentation and relevant sources
   - **Supermemory** — retrieves your saved tech stack to personalize the investigation
3. You watch the live feed as each step completes
4. A case file lands with a confidence rating, evidence list, and a copyable fix

### Hivemind

Before starting a fresh investigation, CodeDetective checks shared memory for a similar bug. If a match is found, you get the result instantly — no investigation needed. Every completed investigation is added to the shared pool.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Convex** — database for cases, steps, and shared memory
- **SSE** — streams investigation steps to the client in real time
- **Lucide React** — icons

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will create your Convex project and generate the `convex/_generated` files.

### 3. Environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# AI agents
HERMES_API_KEY=your_hermes_key
TINYFISH_API_KEY=your_tinyfish_key
SUPERMEMORY_API_KEY=your_supermemory_key
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── investigate/page.tsx      # Main investigation UI
│   ├── history/page.tsx          # Past cases by device
│   ├── case/[caseId]/page.tsx    # Shareable case detail
│   └── api/
│       ├── investigate/route.ts  # SSE stream — runs the agent loop
│       └── memory/stack/route.ts # Saves user's tech stack
├── components/investigate/
│   ├── BugInput.tsx              # Bug submission form
│   ├── LiveFeed.tsx              # Streaming step feed
│   ├── FeedItem.tsx              # Individual step card
│   ├── CaseFile.tsx              # Verdict display
│   ├── SharedHit.tsx             # Hivemind match banner
│   ├── StackSetup.tsx            # Tech stack modal
│   └── ShareButton.tsx           # Copy case link
├── lib/
│   ├── agent-loop.ts             # Orchestrates the multi-agent run
│   ├── hermes.ts                 # Hermes API client
│   ├── tinyfish.ts               # TinyFish search/fetch client
│   ├── supermemory.ts            # Supermemory client
│   └── sse.ts                    # SSE encoding helpers
└── types/
    └── agent.ts                  # InvestigationStep, Verdict types

convex/
├── schema.ts                     # cases, steps, sharedCases, memory tables
├── cases.ts                      # Case mutations and queries
├── steps.ts                      # Step mutations
└── memory.ts                     # Shared memory queries and mutations
```

## Features

- **Live investigation feed** — every agent action streams to the UI in real time
- **Structured verdicts** — hypothesis, evidence with source citations, confidence level (high / medium / low), and a copyable conclusion
- **Hivemind** — shared bug memory across all users; skip re-investigating known bugs
- **Stack memory** — save your tech stack once, get stack-aware answers on every investigation
- **Shareable cases** — every investigation gets a permanent URL at `/case/[id]`
- **History** — full list of past investigations per device
