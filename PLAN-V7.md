# FutureAI V7 Implementation Plan

## Overview
Upgrade V6.3 → V7: Non-profit, public AI impact infrastructure.
No monetization, no fake metrics, no placeholders. Everything fully functional.

---

## STEP 1 — Prisma Schema Upgrade

### New fields on `Challenge`:
- `measurableOutcome String?`
- `geographicScope String?`
- `estimatedBudget String?`
- `implementationPartnerNeeded Boolean @default(false)`
- `verificationMethod String?`

### New fields on `Project`:
- `problemSeverity Int?` (1–10)
- `populationAffected String?`
- `geographicScope String?`
- `implementationReadiness Int?` (IRL 1–9)
- `scalabilityPotential Int?` (1–5)
- `verificationMethod String?`

### New fields on `User`:
- `tier String @default("FREE")` — for feature gating (FREE / NGO_VERIFIED / RESEARCH_VERIFIED / MUNICIPALITY_VERIFIED)

### New model `AuditLog`:
- id, action, targetType, targetId, performedById, metadata (JSON), createdAt
- Tracks governance-relevant actions (role changes, challenge creation, evaluations)

### New model `ConflictDeclaration`:
- id, userId, challengeId, description, createdAt
- Public conflict-of-interest declarations

### DB indexes:
- `Activity` → add `@@index([type])`
- `User` → add `@@index([role])`, `@@index([country])`
- `ChallengeEntry` → add `@@index([userId])`
- `SandboxSession` → add `@@index([updatedAt])`
- `UserApiKey` → already indexed

After schema changes: `prisma db push` + regenerate client + update seed.

---

## STEP 2 — Arena/IDE Real Execution Engine

### 2a. New file: `src/lib/ai-execute.ts`
Provider-agnostic execution engine:
- `executeAI(userId, provider, prompt, mode)` function
- Calls OpenAI (chat completions for code, DALL-E for image)
- Calls Anthropic (messages API for code)
- Calls Mistral (chat completions for code)
- Calls custom endpoint (generic OpenAI-compatible)
- **Timeout**: 30s AbortController
- **Retry**: 1 retry on 429/5xx
- **Error handling**: Returns structured `{ success, result?, error?, provider }` — never throws

### 2b. New API: `POST /api/arena/execute`
- Requires auth
- Body: `{ sessionId, prompt, changelog, provider }`
- Rate limit: max 20 requests/min per user (in-memory counter)
- Fetches user's encrypted API key → decrypts → calls `executeAI`
- Saves result as new SandboxVersion
- Returns result or clean error
- If no API key → returns `{ error: "no_api_key", message: "..." }`

### 2c. New API: `GET /api/arena/providers`
- Requires auth
- Returns list of user's connected providers with status
- For each provider: ping test (lightweight call to verify key validity)
- Returns `{ providers: [{ name, connected, status: "ok"|"error"|"not_connected", lastChecked }] }`

### 2d. New API: `GET /api/health`
- Public endpoint
- Returns platform health: DB connection, version, uptime

### 2e. Update `SandboxSession.tsx`
- Replace mock `setTimeout` generation with real `/api/arena/execute` call
- Add provider selector dropdown (only shows connected providers)
- Add provider status indicator (green/red dot)
- If no provider connected → show clean "Connect API key" CTA linking to `/settings`
- If execution fails → show structured error message (not crash)
- Keep all existing features: version history, diff view, docs, timeline, comments

### 2f. Update `SandboxAI.tsx`
- Same real execution integration for the lightweight sandbox on idea/project pages

---

## STEP 3 — Global Impact Framework

### 3a. Update Project Creation (`projects/create/page.tsx` + API)
- Add Impact Assessment fields to create form:
  - Problem Severity slider (1–10)
  - Population Affected (text estimate)
  - Geographic Scope dropdown (Local/Regional/National/Continental/Global)
  - IRL dropdown (1–9 with labels)
  - Scalability Potential (1–5)
  - Verification Method textarea
- POST `/api/projects` saves these fields

### 3b. Impact Index Computation (`src/lib/impact.ts`)
New pure function:
```
computeImpactIndex(project) → {
  impactIndex: number (0–100),
  breakdown: { severity, reach, readiness, scalability },
  tier: "exploratory" | "promising" | "high-impact" | "transformative"
}
```
Formula:
- severity (25%) + populationReach (25%) + readiness (25%) + scalability (25%)
- Each normalized 0–25
- Tier thresholds: <25 exploratory, <50 promising, <75 high-impact, >=75 transformative

### 3c. New page: `/impact-dashboard`
- Public page (no auth required)
- Top stats: Total projects, countries represented, total contributors, estimated reach
- Project impact grid: cards showing each project's impact index + breakdown
- Filter by geographic scope, impact tier, category
- Methodology section (inline, not a separate page — links to /public-methodology)
- Data fetched server-side from Prisma

### 3d. Update Project Detail page
- Add Impact Assessment section showing severity, IRL, scalability, geographic scope
- Show computed Impact Index with visual bar + tier badge

### 3e. Update `/api/users` leaderboard
- Impact score calculation now incorporates project impact indices

---

## STEP 4 — Challenge Framework Upgrade

### 4a. Update Challenge Creation form + API
Add new structured fields:
- measurableOutcome textarea
- geographicScope dropdown
- estimatedBudget text input
- implementationPartnerNeeded checkbox
- verificationMethod textarea
- SDG alignment multi-select (17 SDG goals checkboxes)

### 4b. Update Challenge Detail page
- Display all new structured fields in organized sections
- SDG alignment shown as colored badges with official numbers/names
- Geographic scope with icon
- Verification method section

### 4c. New API: `GET /api/challenges/[id]/export`
- Requires auth
- Returns structured JSON report of challenge + all entries + evaluations
- Content-Disposition: attachment for download
- Clean JSON structure suitable for institutional reporting

---

## STEP 5 — Institution & NGO Mode

### 5a. Update roles system
Add to `User.role` enum: `NGO_VERIFIED`, `RESEARCH_VERIFIED`, `MUNICIPALITY_VERIFIED`
- These are set by ADMIN via the admin panel (already has role dropdown)
- Update admin panel dropdown to include new roles

### 5b. Update Admin Panel
- Add "Verified Institutions" section/filter
- Show verification status indicators
- Allow assigning institution roles

### 5c. Institution features (role-gated)
- Verified institutions can create challenges with `institutionalPartnerId` set
- Their challenges show a "Verified Institution" badge
- They can access `/api/challenges/[id]/export` for their challenges

---

## STEP 6 — Governance & Trust

### 6a. New page: `/governance`
- Public page showing:
  - Platform governance structure (council model, decision process)
  - Ethical AI statement
  - How experts are selected
  - How scoring works (links to /public-methodology)
  - Data handling principles

### 6b. Conflict-of-interest system
- New API: `POST /api/governance/conflicts` — submit declaration
- New API: `GET /api/governance/conflicts?challengeId=X` — list declarations
- On challenge detail: show conflict declarations from panel members
- Panel members prompted to declare conflicts when accepting panel invite

### 6c. Audit Log
- New API: `GET /api/governance/audit-log` — public, paginated
- Logs: role changes, challenge creation/closure, evaluation submissions, user verification changes
- Displayed on `/governance` page in a timeline

### 6d. Update existing GDPR features
- Already have: data export, account deletion, consent banner
- Add: link to governance page from settings
- Ensure audit log entries for deletions

---

## STEP 7 — Movement Layer Enhancements

### 7a. Update WorldMap (`/map`)
- Add challenge markers (different color/icon from project markers)
- Add contributor density heatmap layer toggle
- Show active challenges by region

### 7b. Update Home page public counters
- Already has: Projects, Innovators, Countries, Challenges
- Add: "Estimated Lives Impacted" counter (sum of populationAffected across projects)
- Make counters animate on scroll

### 7c. Badge system updates
- Add new badges: "Verified Impact Builder", "Institutional Collaboration", "Top 1% Global"
- Seed these new badges
- Award logic:
  - Verified Impact Builder: project with IRL >= 5
  - Institutional Collaboration: contributed to a verified institution challenge
  - Top 1% Global: in top 1% of points leaderboard

---

## STEP 8 — Performance & Optimization

### 8a. DB indexing (already planned in Step 1)

### 8b. Leaderboard caching
- In `/api/users?leaderboard=true`: add in-memory cache with 60s TTL
- Return cached data if available, refresh in background

### 8c. Arena optimization
- SandboxSession queries: select only needed fields
- Pagination for sessions list (limit 20, offset)

### 8d. Responsive audit
- Already good from V6.3 (44px touch targets, viewport meta, responsive map)
- Verify all new pages (impact-dashboard, governance) are fully responsive
- Ensure new forms work on mobile

---

## STEP 9 — Translation Updates

Add translation keys to both `fr.ts` and `en.ts` for:
- Impact dashboard page
- Governance page
- New challenge fields
- New project impact fields
- Arena execution states (connecting, executing, error, no key)
- Provider status labels
- New badges
- Audit log
- Conflict declarations
- SDG goal names (1–17)
- IRL level labels (1–9)

---

## STEP 10 — Seed Data Update

Update `prisma/seed.ts`:
- Add impact fields to existing projects (problemSeverity, populationAffected, etc.)
- Add new structured fields to existing challenges
- Add new badges (Verified Impact Builder, Institutional Collaboration, Top 1% Global)
- Add sample audit log entries
- Update version marker to "V7"

---

## STEP 11 — Navbar & Routing

- Add "Impact" link to navbar (pointing to /impact-dashboard)
- Add "Governance" link to footer
- Update nav ordering: Projects, Challenges, Ideas, Leaderboard, Arena, Impact, Map
- Ensure all new routes compile and render

---

## STEP 12 — Build & Verify

1. `prisma db push` — apply schema changes
2. `prisma db seed` — reseed with V7 data
3. `npm run build` — zero TypeScript errors required
4. Start dev server and verify ALL pages:
   - Homepage with updated counters
   - /impact-dashboard (new)
   - /governance (new)
   - /arena — test with no API key (graceful error)
   - /arena — test execution flow
   - /challenges — new fields visible
   - /challenges/create — new fields in form
   - /projects/create — impact assessment fields
   - /projects/[id] — impact index display
   - /admin — new institution roles
   - /map — challenge markers
   - Mobile responsive on all new pages
5. Zero console errors, zero server crashes

---

## Files to Create (new):
1. `src/lib/ai-execute.ts` — AI execution engine
2. `src/lib/impact.ts` — Impact index computation
3. `src/app/api/arena/execute/route.ts` — Arena execution API
4. `src/app/api/arena/providers/route.ts` — Provider status API
5. `src/app/api/health/route.ts` — Health check
6. `src/app/api/challenges/[id]/export/route.ts` — Challenge export
7. `src/app/api/governance/conflicts/route.ts` — Conflict declarations
8. `src/app/api/governance/audit-log/route.ts` — Audit log
9. `src/app/impact-dashboard/page.tsx` — Impact dashboard
10. `src/app/governance/page.tsx` — Governance page

## Files to Modify:
1. `prisma/schema.prisma` — New fields + models
2. `prisma/seed.ts` — V7 seed data
3. `src/components/SandboxSession.tsx` — Real execution
4. `src/components/SandboxAI.tsx` — Real execution
5. `src/components/Navbar.tsx` — Impact link
6. `src/components/Footer.tsx` — Governance link
7. `src/components/WorldMap.tsx` — Challenge markers
8. `src/app/projects/create/page.tsx` — Impact fields
9. `src/app/projects/[id]/page.tsx` — Impact display
10. `src/app/challenges/create/page.tsx` — New fields
11. `src/app/challenges/[id]/page.tsx` — New fields display
12. `src/app/admin/page.tsx` — Institution roles
13. `src/app/api/projects/route.ts` — Save impact fields
14. `src/app/api/challenges/route.ts` — Save new fields
15. `src/app/api/admin/users/route.ts` — New roles
16. `src/app/page.tsx` — Lives impacted counter
17. `src/i18n/translations/fr.ts` — New keys
18. `src/i18n/translations/en.ts` — New keys

## Estimated: ~18 modified files + ~10 new files = 28 files total
