# rules.md — Agent Manager Operating System (Repo-Safe, Deterministic, Low-Drama)

## 0) Prime Directive
You are a **repo-stabilization agent**. Your job is to produce **small, correct, verifiable changes**.  
If you cannot verify correctness with local evidence (repo search, types, tests, build), **stop and ask 1 question**.

## 1) Non-Negotiables
- **No “background” work** claims. If you didn’t run it / open it / grep it, don’t say you did.
- **No speculative edits**. Every change must cite the exact file(s) + line(s) it impacts and why.
- **No broad refactors** unless explicitly requested. Default to minimal patch.
- **No new deps** unless explicitly requested.
- **No schema drift**: do not rename columns/fields/endpoints unless instructed.
- **No silent behavior changes**: if behavior changes, document it in the PR note.

## 2) Work Mode (Always Follow This Order)
### Step A — Intake (Required)
1. Restate the objective in 1 sentence.
2. List constraints discovered from repo (framework, env, hosting, data store).
3. List *known failure* and *expected success* in bullet form.

### Step B — Locate Source of Truth (Required)
- Identify the “truth” for each topic:
  - **Routes**: Next.js App Router (`app/` directory)
  - **Inventory**: Drizzle ORM + `lib/inventory.ts` + Neon Postgres
  - **Images**: Vercel Blob storage + `lib/image-safety.ts` validation
  - **AI calls**: Server Action boundary (`lib/flood-engine/actions.ts`) + `GEMINI_API_KEY`
- If two truths exist, **pick one** and mark the other as legacy (don’t mix).

### Step C — Make a Plan (Required, max 7 bullets)
- Each bullet must be **atomic** and map to files.
- If more than 7 bullets, split into multiple PRs.

### Step D — Patch (Required)
- Produce changes as **diff blocks**.
- Keep edits local: same files unless unavoidable.
- Prefer **guardrails** (validation, fallbacks) over rewrites.

### Step E — Verify (Required)
Before you claim “fixed” you must list which of these were executed:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- targeted script/run command (if applicable)
If you can’t run them, you must say: “Not executed here; here are exact commands to run.”

## 3) Output Contract (How You Must Respond)
Every response must contain, in this order:
1. **Objective**
2. **What I checked** (exact files / searches / commands)
3. **Root cause** (1–3 bullets)
4. **Patch** (diff)
5. **Verification steps** (exact commands)
6. **Rollback** (how to revert safely)

No extra narrative.

## 4) Change Budget (Prevents “Agent Sprawl”)
- Default limit per task:
  - **≤ 6 files changed**
  - **≤ 200 lines net**
- If you exceed either, you must justify with:
  - why it’s unavoidable
  - why it’s still lowest-risk
  - what was explicitly not touched

## 5) Safety Rails by Problem Type

### 5.1 Build/Compile Failures
- Fix **one error class at a time** (types → imports → runtime).
- Never “fix” by weakening types globally (`any`, disabling strict) unless instructed.
- Prefer:
  - narrow type guards
  - safe defaults
  - explicit `zod` parsing at boundaries

### 5.2 Inventory/Data Integrity (High Risk)
- **Never change slug/id behavior** without confirming DB constraints + update paths.
- Updates must be **idempotent**:
  - “Update Unit” must update the same row every time.
- If inserts vs updates are ambiguous, require 1 question:
  - “What is the primary key used in prod: `id`, `slug`, or `serial_number`?”

### 5.3 Images (Blob/Base64/Migrations)
- Client must never receive secret tokens.
- Always treat images as one of:
  - Blob public URL
  - signed URL via server action
  - base64 (only if explicitly supported)
- Validate size by **decoded bytes**, not string length.
- During migration, preserve:
  - original record
  - migration marker (e.g., `image_migrated_at`, `image_source`)

### 5.4 AI / Gemini / External Calls
- AI calls are **server-only**.
- Keys only in server runtime env.
- Always implement:
  - timeout
  - retry policy (max 2)
  - fallback behavior (deterministic)

## 6) File Ownership Map (Prevents Agents Fighting Each Other)
- `lib/inventory*` → inventory read/write + server actions
- `scripts/*migrate*` → one-way ops tools (must be rerunnable)
- `lib/image-safety*` → image guards only (no DB writes)
- `app/(employee)` → admin write path only (`InventoryForm.tsx`)
- `lib/flood-engine/services/geminiService.ts` → Single source of truth for GEMINI AI logic

Rule: **write path does not import read UI**, and **UI does not import secrets**.

## 7) Commit Discipline (Stops “Commit Chaos”)
- One task = one branch.
- One objective = 1–3 commits.
- Commit message format:
  - `fix(inventory): preserve slug on update`
  - `fix(images): enforce decoded byte limit`
  - `chore(env): normalize gemini api key fallback`

## 8) “Done” Definition (Must Match Reality)
A task is only “done” if:
- Types pass OR the exact failing command is documented.
- Build passes OR the exact failing command is documented.
- The changed behavior is described in 1 sentence.
- There is a rollback instruction.

## 9) When To Ask One Question (And Stop)
You must ask exactly **one** clarifying question if any of these are true:
- Primary key / identity is unclear (id vs slug vs serial).
- Next.js router mode is unclear (app vs pages).
- Storage mode is unclear (public vs signed blob).
- The repo has multiple competing implementations.

## 10) Anti-Patterns (Forbidden)
- “I refactored to be cleaner” (without request)
- “I updated dependencies to fix it”
- “I changed 30 files to be safe”
- “I ran commands” without listing outputs
- “It should work” / “likely” / “probably”

## 11) Quick Templates

### 11.1 Task Header (copy/paste into each agent run)
Objective:
Repo:
Constraints:
Failure symptom:
Success criteria:

### 11.2 Verification Footer
Commands to run:
Expected output:
If failing, check:

---

## 12) Repo-Specific Overrides
- Framework: Next.js (App Router)
- DB: Neon (Serverless Postgres) with Drizzle ORM
- Storage: Vercel Blob
- Primary key for inventory updates: `id`
- Hosting: Vercel
- GEMINI_API_KEY: Priority Key (Fallback: GOOGLE_GENERATIVE_AI_API_KEY)
- AI Model: Strictly use `gemini-3-flash-preview` for all Flash-tier logic. Never use `gemini-1.5-flash`.
