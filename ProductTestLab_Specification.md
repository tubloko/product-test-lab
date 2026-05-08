# ProductTestLab — MVP Product Specification

**Version:** 1.0  
**Status:** Draft for review  
**Purpose:** Single source of truth for ProductTestLab MVP. From this document, the team derives epics, tasks, and Claude Code prompts.

---

## Table of Contents

1. [Vision & Positioning](#part-1-vision--positioning)
2. [Core Principles](#part-2-core-principles)
3. [User Journeys](#part-3-user-journeys)
4. [Feature Modules](#part-4-feature-modules)
5. [Data Model](#part-5-data-model)
6. [AI Prompts Library](#part-6-ai-prompts-library)
7. [Design Principles](#part-7-design-principles)
8. [Implementation Roadmap](#part-8-implementation-roadmap)
9. [Out of Scope](#part-9-out-of-scope)

---

# Part 1: Vision & Positioning

## 1.1 The Problem

Dropshippers and media buyers waste money testing products without a real plan. The typical cycle:

1. See a product on TikTok / spy tool / AliExpress
2. Get excited, throw it into a Notion table or Google Sheet
3. Maybe think about audience, maybe not
4. Launch ads with whatever angle felt right that day
5. Test fails or barely succeeds
6. Move on to the next product, never knowing what they actually learned

The pain isn't lack of ideas. The pain is lack of **structured thinking before spending money** and **lack of memory after the test**. Every test starts from zero. Every loss feels arbitrary. Every win is hard to replicate.

Existing tools don't solve this:
- **Spy tools** (Minea, AdSpy, PiPiADS) tell you WHAT others are running, not WHY or HOW to position it for your situation
- **Notion / Google Sheets** are blank canvases — they store information but don't enforce thinking
- **ChatGPT** can suggest avatars, but everything is ephemeral — no history, no structure, no link to results
- **AdTestLab** (the sister product) covers post-test analysis, but only after launch

There's a missing layer between product discovery and ad testing: **the strategy workspace**.

## 1.2 The Solution

**ProductTestLab is the strategy workspace between product discovery and ad testing.**

It helps users:
- Decide whether a product is worth testing at all (viability check)
- Build structured test hypotheses with avatar + angle + landing match (the trinity)
- Track expected vs actual KPIs to learn from every test
- Iterate on hypotheses through versioning (v2 builds on what v1 taught)
- Use AI as a co-pilot for ideation and learning, not as an oracle

The product is opinionated: it doesn't give you a blank canvas. It gives you rails. Those rails encode best practices that experienced media buyers already know but rarely apply consistently.

## 1.3 Positioning Statement

> ProductTestLab turns product ideas into structured test hypotheses — with viability checks, AI-assisted avatars and angles, message-matched landings, and versioned learnings that compound over time.

## 1.4 Differentiation

| Dimension | Notion/Sheets | Spy Tools | ChatGPT | ProductTestLab |
|---|---|---|---|---|
| Stores ideas | ✓ | ✓ | ✗ | ✓ |
| Shows competitor data | ✗ | ✓ | ✗ | ✗ (use spy tools as input) |
| Suggests avatars/angles | ✗ | ✗ | ✓ (no memory) | ✓ (with context) |
| Enforces message-match | ✗ | ✗ | ✗ | ✓ |
| Tracks expected vs actual KPIs | manual | ✗ | ✗ | ✓ |
| Versions hypotheses | ✗ | ✗ | ✗ | ✓ |
| Compounds learnings | ✗ | ✗ | ✗ | ✓ |
| Connects to test results | ✗ | ✗ | ✗ | ✓ (via AdTestLab) |

The key wedge: **enforces structured thinking + builds memory across tests**.

## 1.5 Target Users

Two segments matter, with different jobs-to-be-done:

### Segment A: Less experienced (running 1–3 products at a time)

- **Pain:** Lack of structure. Doesn't know what questions to ask before testing.
- **Value they get:** Trinity enforcement teaches them to think correctly. Viability check saves them from wasting money on bad products. AI removes the blank-page problem.
- **Behavior:** Will accept opinionated workflow. Reads the tooltips. Goes through wizard step-by-step.

### Segment B: Experienced (running 10+ products, often with a small team)

- **Pain:** Fragmentation across 5–7 tools (Notion, Trello, Slack, Triple Whale, ad platforms, spy tools). Hypothesis lives in one place, results in another. Loop is broken.
- **Value they get:** Single source of truth for the full decision loop. Versioned hypothesis history. AdTestLab integration (V2).
- **Behavior:** Will resist excessive hand-holding. Wants speed, keyboard shortcuts, bulk operations, the option to skip the wizard.

**MVP design choice:** Build for Segment A first. Ensure Segment B is not blocked architecturally (data model supports bulk ops, hypothesis schema is flexible). Segment B is the second wave once social proof exists.

## 1.6 Relationship to AdTestLab

ProductTestLab and AdTestLab are two products that solve adjacent problems for the same user:

- **ProductTestLab** = before launch (strategy)
- **AdTestLab** = after launch (diagnosis)

The full loop:

```
Product idea → Viability check → Build hypotheses (avatar + angle + landing) → 
Launch ads → AdTestLab analyzes results → Verdict + learnings → 
New hypothesis version with learnings applied → Loop
```

In MVP, the integration is **manual** — user writes actual KPIs and learnings into the hypothesis themselves. In V2, AdTestLab pushes results automatically into the linked hypothesis.

The two products are deployed as **separate Firebase projects** with separate domains. Cross-product features (auth, data sync) happen via API calls in V2, not shared infrastructure.

---

# Part 2: Core Principles

These principles inform every design and product decision. When trade-offs come up, refer here.

## 2.1 AI as default, manual as fallback

In 2026, users expect AI to do the heavy lifting. The product is built so that AI is the **first path** for any creative task: avatars, angles, landing message suggestions, learning analysis. Manual entry is always available — for editing AI output or skipping AI entirely — but it's not the default flow.

This is a deliberate inversion of how most "AI-assisted" tools work, where AI is a sidebar feature on top of forms. Here, AI is in the main artery.

## 2.2 Opinionated workflow

The product makes hard choices about what good thinking looks like and enforces them at the data layer:

- A hypothesis cannot be marked "ready to test" if avatar pain, angle hook, or landing hero are empty
- Viability check is the first step in the wizard (skippable but flagged)
- Expected KPIs must be filled before a hypothesis enters "testing" status
- Hypothesis versioning carries forward learnings explicitly

This is the opposite of "flexible." Flexibility is what Notion offers. The product's competitive moat is **inflexibility around the right things**.

## 2.3 Trinity: avatar + angle + landing match

The single most important concept in the product. Every test hypothesis is a bet on:

- **WHO** buys this (avatar — specific, situated, urgent pain)
- **WHY** they buy this (angle — the emotional frame that resonates)
- **HOW it shows up on the page** (landing match — the page must continue the angle, not contradict it)

Most failed tests in dropshipping fail because one of these three is missing or inconsistent with the others. The product makes these three explicit and connected.

## 2.4 Learning loop via versioning

Hypotheses are versioned. v2 of a hypothesis is created from v1 with explicit learnings carried forward. This produces a tree of decisions over time, not a flat list.

The user sees their own evolution of thinking. The AI can help by reading v1's learnings and suggesting what to change in v2.

## 2.5 Capture vs Discovery modes

Two valid mental modes for adding products:

- **Capture mode** (Quick Add): "I just saw 10 products on a spy tool, I want to dump them in my backlog before I forget. I'll think about them later."
- **Discovery mode** (Wizard): "I want to seriously evaluate this one product right now — viability, hypotheses, the works."

The same user uses both modes at different times. Neither is "for beginners" — it depends on the moment.

## 2.6 Privacy-first single-user (for MVP)

In MVP, every user owns their own data. No teams, no sharing, no public marketplace. This simplifies security, billing, and feature scope. Multi-user is V2+ territory.

## 2.7 No fake intelligence

The AI does not score products on a 1–10 scale. It does not predict winners. It does not pretend to know what will work in your market.

The AI generates **suggestions** (avatars, angles, landing copy directions) that the user evaluates and edits. The AI also **synthesizes** (summarizes viability check answers, proposes v2 changes from v1 learnings). It never adjudicates.

Reason: fake confidence destroys trust. A "this product scores 7/10" output sets the user up to either over-trust the system or dismiss it once they catch a wrong call. Suggestions and synthesis are durable; adjudication is not.

## 2.8 Time investment honors the user

Every wizard, every form, every modal has explicit "save & exit" — no work is ever lost. Wizard sessions persist as standalone entities. Coming back tomorrow picks up exactly where the user left off.

This matters because the user's primary distraction-source (their phone, their team, their day job) interrupts them constantly.

---

# Part 3: User Journeys

This section walks through end-to-end scenarios. Each journey is written from the user's perspective, in present tense, with explicit emotional and decision context. These journeys drive the feature module specifications in Part 4.

## Journey 1: First-time user → first hypothesis (Discovery mode)

**Context:** Anna is a side-hustle dropshipper. She holds a regular job and runs ads in evenings. She found ProductTestLab via a Reddit thread on r/dropship. She just saw a cordless lunch box go viral on TikTok and wants to evaluate it seriously.

**Step 1 — Sign up and onboarding**

Anna signs up with Google. She lands on a welcome screen with three cards:

1. "Add product ideas — save products you want to test"
2. "Build hypotheses — define WHO buys, WHY, and HOW"
3. "Test and learn — track results, save what works"

CTA: "Add my first product." She clicks.

**Step 2 — Choose mode**

A modal asks: how do you want to add this?

- **+ Guided setup** (recommended): "Build a full hypothesis with viability check and AI assistance. ~10 minutes."
- **+ Quick add**: "Just save the idea, fill details later."

Anna picks Guided setup.

**Step 3 — Wizard starts**

A full-screen card flow begins. Progress bar at top: ●○○○○○○○○

**Card 1: Product basics.**
- Name: "Cordless Electric Lunch Box"
- Source URL: pastes TikTok link
- Image: pastes URL
- (Behind the scenes: backend tries to scrape OG metadata from the source URL, fills missing fields if successful. Anna doesn't have to wait — UI doesn't block on scraping.)

**Card 2: Niche & price context.**
- Niche: "Lifestyle / Workwear" (from autocomplete)
- Selling price: $59
- Supplier cost: $14

A small inline calculation appears: "Margin: $45 (76%)"

**Card 3: Viability check (light + AI assisted).**

A new screen with the framing: "Before we build hypotheses, let's check if this product is worth testing. Takes ~3 minutes. **Strongly recommended — it saves money on bad products.**" There's a Skip button.

She clicks Continue. 8 questions appear in a single scrollable form (not card-by-card — too slow):

1. **Saturation:** "How long has this product been viral? Search TikTok with the product name." Options: <1 month / 1–3 months / 3–6 months / 6+ months / unsure
2. **Competition:** "Open Facebook Ad Library. Search the product. How many active advertisers?" Options: 0–5 / 5–20 / 20+ / unsure
3. **Brand risk:** "Is this a branded product?" Options: Generic / Branded by 1 company / Branded by multiple / Unsure
4. **Sourcing:** "Can you find this on AliExpress / CJ / Zendrop?" Options: Yes — fast shipping / Yes — slow shipping / No / Unsure
5. **Creative availability:** "Are there UGC videos / reviews / demos available?" Options: Plenty / Some / Very little / None
6. **Wow moment:** "Does the product have an obvious visual moment that grabs attention in a video?" Options: Yes / Sort of / Not really
7. **Affordable CPA:** Calculator with margin from Card 2 — shows "At 2x ROAS target, your max CPA is $X. Is that realistic for your market?" Yes / No / Unsure
8. **Free notes:** "Anything else worth flagging?" (textarea, optional)

She fills it. Most are 🟡 medium, two are 🟢 good, one is 🟡 unsure.

She clicks "Run viability summary." AI processes for ~5 seconds with rotating status messages: "Reading your inputs... Cross-checking risk patterns... Building summary..." (intentionally a bit dramatic — this is the *performative AI* moment).

**Card 3b: Viability scorecard.**

```
Viability Check — Cordless Lunch Box

Saturation:        🟡 Medium (1–3 months viral)
Competition:       🟡 Medium (5–20 advertisers)
Brand risk:        🟢 None (generic product)
Sourcing:          🟢 Good (AliExpress fast shipping)
Creatives:         🟢 Good (plenty of UGC available)
Wow moment:        🟢 Strong (visible heating + portability)
Margin:            🟢 Healthy ($45 margin allows $25 CPA at 2x ROAS)

Overall: 🟢 Viable — proceed with caveats

Risk flags:
- Saturation moderate. Differentiation matters more than volume of ads.
- 5–20 active advertisers means top-funnel angle is being saturated. 
  Consider unconventional angle (e.g. specific avatar) over broad lifestyle angle.

Recommendation: Worth testing. Focus your hypothesis on a specific 
underserved avatar rather than the obvious mass-market angle.
```

Below: **Continue to hypotheses →** and **Save & exit** (saves wizard state).

Anna feels validated. She continues.

**Card 4: Generate avatars.**

Big center button: "🪄 Generate 5 buyer avatars." She clicks.

AI thinks for ~6 seconds with rotating messages: "Reading product context... Considering viability flags... Mapping pain points... Generating avatars..."

5 avatar cards appear with fade+slide-up, ~200ms apart.

Each card:
- Name (e.g. "Night-shift nurse, 28–45")
- Pain point (1–2 sentences, specific)
- Reasoning (1 sentence: why this avatar, what angle fits)
- Checkbox to select

Footer: "Select 1–3 avatars to build hypotheses for." (Not picking a single one — multi-select.)

She picks 2: night-shift nurse and truck driver. Clicks Next.

**Card 5: Generate angles for each avatar.**

The card splits into a tab-like view. Tabs at top: "Nurse" / "Truck driver." She's on the Nurse tab.

Big button: "🪄 Generate 5 angles for this avatar." She clicks. AI generates 5 angles tailored to nurse + product.

She picks **money-saving angle** for nurse. 

Switches to Truck driver tab. Clicks generate. Picks **convenience angle**.

(In the underlying data model, two draft hypotheses are now being shaped, one per avatar.)

**Card 6: Landing match for each hypothesis.**

Tabs again. On the Nurse tab, AI has *pre-filled* draft landing fields based on the chosen angle (no separate generate button — it's automatic from prior context).

- Hero message: "Stop spending $600/month on 3 AM DoorDash"
- Primary benefit: "Heat real meals anywhere — no microwave, no break room war"
- Proof element: "UGC of nurses + price comparison calculator"
- CTA: "Get mine — save $500+ this month"

Anna edits the hero to make it more her voice: "The 3AM lunch box every night-shift nurse is talking about." She continues.

Truck driver tab — similar flow.

**Card 7: Offer for each hypothesis.**

Tabs. Pre-filled from Card 2 price. She fills structure and urgency for each:
- Nurse hypothesis: "1 for $59 / 2 for $99 (save $19). Free shipping ends midnight."
- Truck driver hypothesis: "1 for $59 + free 12V car adapter ($15 value). Limited time."

**Card 8: Expected KPIs.**

Tabs. She fills expected CTR, CPC, ATC, ROAS for each. Takes 1 minute.

There's a button "🪄 Suggest baselines" which she clicks for the nurse hypothesis. AI returns: "For a nurse-targeted niche with money-saving angle on a mid-priced lifestyle product, typical baselines are CTR 2–3%, CPC $0.60–1.20, ATC 6–10%, ROAS 1.4–2x on cold traffic. These are starting points — your specific creative and offer can shift this significantly." She uses these as anchors.

**Card 9: Review.**

Two collapsed sections: "Nurse hypothesis" and "Truck driver hypothesis." She expands each, sees the full summary. She can click any field to jump back and edit.

Status selectors per hypothesis: **Save as draft** / **Mark ready to test**.

Both are complete (trinity is filled), so she marks both ready.

Clicks "Save & finish."

**Step 4 — Outcome.**

Success animation. Redirects to the product detail page (`/product/[id]`). The Hypotheses tab now shows two hypothesis cards. The product status is "Brief Ready" (auto-set because at least one hypothesis is ready to test).

Anna feels she did real strategy work in 12 minutes. She closes the laptop.

---

## Journey 2: Returning user → Quick Add 8 products from spy tool (Capture mode)

**Context:** Anna comes back two days later. She just spent an hour on a spy tool and has a list of 8 product candidates. She has 15 minutes before bed. She wants to dump them all in.

**Step 1 — Dashboard.**

She lands on /dashboard. Pipeline kanban shows her existing products. Top-right buttons: **+ Quick add** | **+ Guided setup**.

She clicks Quick add.

**Step 2 — Quick add table.**

A modal opens with an editable table. Columns: Image / Name / Source URL / Niche / Price / Notes.

She types the first product name, hits Tab, fills source URL, hits Tab, etc. After Enter, a new empty row appears.

For one product, she pastes a list of names from her clipboard (one per line). The table auto-creates rows with names pre-filled.

For another, she pastes a TikTok URL — backend OG-scrapes in the background and fills name + image automatically. (If scraping fails, she fills manually.)

She fills 8 rows in 6 minutes. Clicks **Save all**.

**Step 3 — Outcome.**

8 products are created in status "Idea" with no hypotheses. She's redirected back to the dashboard. The Idea column now has 8 new cards.

Anna closes laptop. Tomorrow evening, she'll pick one and run the Guided wizard.

---

## Journey 3: Returning user → resumes interrupted wizard

**Context:** Anna started the Guided wizard yesterday for product X. She got to Card 5 (angle generation), then her kid woke up. She closed the laptop. Now she's back.

**Step 1 — Dashboard.**

A banner at top of dashboard: "⏳ You have 1 wizard in progress — Resume Cordless Lunch Box (step 5 of 9)" with Resume and Discard buttons.

She clicks Resume.

**Step 2 — Wizard re-opens.**

The wizard resumes at Card 5 with all prior state intact: selected avatars, generated angles, etc.

She continues from where she stopped.

**Edge case:** if she clicks Discard, the wizard session is deleted but the **product itself is preserved** (with whatever state was already saved — viability check if completed, basic info from cards 1–2). She can later open the product directly and either run the wizard again or build hypotheses manually.

---

## Journey 4: After failed test → create v2 with learnings (Versioning + AI)

**Context:** Anna ran the nurse hypothesis (h1). She spent $150. CTR was great (3.1%), but ATC was poor (4%). ROAS came in at 0.9x. She wants to iterate.

**Step 1 — Open the hypothesis.**

She navigates to /product/[id]/hypothesis/h1.

**Step 2 — Fill actual results.**

The "Actual Results" section was previously collapsed. She expands it. Fills the actual numbers. 

Verdict: she selects **Fix** (not Kill — the audience clicked, the angle resonated, the funnel broke later).

Learnings (markdown textarea):
> Audience and angle confirmed. CTR 3.1% and CPC $0.65 prove nurses click on money-saving angle.
> ATC 4% vs expected 8% — landing page failed to convert.
> Hypothesis: $59 price feels high after "save money" promise. Need price anchoring on first screen.
> Next test: same audience, same angle, same hook — new landing with savings calculator on hero.

She saves. Hypothesis status auto-changes to "Tested."

**Step 3 — Create v2.**

A button appears at the bottom: **🪄 Create v2 from learnings**.

She clicks. A modal opens:

> AI suggests changes for v2 based on your v1 learnings:
> 
> **Keep (working):**
> - Avatar (nurse) — high CTR confirms fit
> - Angle (money-saving) — emotional frame resonates
> - Hook — CPC $0.65 means creative is solid
> 
> **Change (broken):**
> - Landing hero: lead with explicit savings calculator showing "DoorDash $25/night × 30 nights = $750/month vs lunch box one-time $59"
> - Primary benefit: emphasize "pays for itself in 2 nights"
> - Offer structure: consider single-unit only at $39 to remove price-anchoring shock — bundle as upsell post-purchase
> - Expected ATC: lower from 8% to 6% (more realistic given the price-shock pattern)
> 
> [Create v2 with these changes] [Edit before creating] [Cancel]

She clicks **Edit before creating**. Goes into a hypothesis editor pre-filled with v2 (carrying forward unchanged fields, AI suggestions applied to changed fields, all editable). She tweaks two things, then saves as draft.

**Step 4 — Outcome.**

In the Hypotheses tab of the product, the cards now show a tree:

```
h1 [Tested - Fix] Nurse + Money-saving
  └─ h2 [Draft] Nurse + Money-saving — landing rebuild
h3 [Scaling] Truck driver + Convenience
```

(In MVP this might render as nested cards or indented list — see Module 4 for UX details.)

Anna feels she's not starting over. She's continuing.

---

## Journey 5: Viability check fails → kill before testing

**Context:** Anna runs the wizard for a new product (a phone case with a unique design). At Card 3 (viability), she fills the questions and gets the AI summary:

```
Overall: 🔴 Risky — reconsider before testing

Risk flags:
- Saturation HIGH (6+ months viral, 50+ active advertisers)
- Competition HIGH (saturated market)  
- Brand risk MEDIUM (similar designs trademarked by 3 companies)
- Margin TIGHT ($8 margin doesn't allow viable CPA at 2x)

Recommendation: This product is in late-cycle and over-competitive. 
Margins won't support paid acquisition at scale. Consider passing or 
finding a differentiated angle/audience that justifies a premium.
```

She has options:
- **Continue anyway** (some users will, and that's their right)
- **Save product as Killed** (she clicks this — the product stays in her account with the viability check preserved, status goes to "Killed", wizard exits)
- **Save & exit** (keeps as Idea, can revisit)

She clicks **Save as Killed**. Wizard ends. She saved $150 on a doomed test. This is the most valuable money she didn't spend.

---

## Journey 6: Compare hypotheses on same product

**Context:** Anna has 3 tested hypotheses on her lunch box product. She wants to see which avatar/angle worked best.

**Step 1 — Product detail page.**

She opens the product. The Hypotheses tab now has a "Compare" toggle in the top-right.

She clicks it. The cards re-render as a table:

| | h1 (v1) Nurse | h1 (v2) Nurse | h2 Truck driver |
|---|---|---|---|
| Avatar | Night-shift nurse | Night-shift nurse | Truck driver |
| Angle | Money-saving | Money-saving | Convenience |
| Hero | $600/month DoorDash | Calc: pays for itself | Eat hot meals on the road |
| Expected ROAS | 1.8x | 1.4x | 1.6x |
| Actual ROAS | 0.9x | 1.7x | 2.1x |
| Verdict | Fix | Continue | Scaling |

Visual indicators on actual vs expected (green if ≥, red if <).

This view tells Anna: truck driver outperformed nurse even on iteration. Worth doubling down there.

(In MVP: simple compare table, max 5 columns. V2: visual chart, filtering.)

---

# Part 4: Feature Modules

Each module is specified independently. From each module, the team derives epics and tasks. Modules have explicit dependencies stated in Section 8.

Modules:
1. [Auth & User Management](#module-1-auth--user-management)
2. [Pipeline Dashboard](#module-2-pipeline-dashboard)
3. [Quick Add (Capture Mode)](#module-3-quick-add-capture-mode)
4. [Wizard Engine (Discovery Mode)](#module-4-wizard-engine-discovery-mode)
5. [Viability Check](#module-5-viability-check)
6. [AI Service Layer](#module-6-ai-service-layer)
7. [Hypothesis Editor (Power Mode)](#module-7-hypothesis-editor-power-mode)
8. [Results & Learnings + Versioning](#module-8-results--learnings--versioning)
9. [Settings & Account](#module-9-settings--account)

---

## Module 1: Auth & User Management

### What it does

Handles signup, login, logout, session management. Mirrors AdTestLab patterns (see `.claude/skills/firebase-patterns`).

### User scenarios

- New user signs up with Google or email/password
- Returning user logs in
- User logs out (clears session)
- User accesses protected routes (redirected to login if unauthenticated)
- User resets password (email/password flow)

### Data structure

```
users/{userId}
  - email: string
  - displayName: string
  - createdAt: Timestamp
  - lastActiveAt: Timestamp
  - source: 'manual' | 'wizard' | 'extension' | 'api'  // for analytics, future
```

### UX details

- Login and signup pages mirror AdTestLab styling exactly
- Email/password + Google OAuth as auth providers (match AdTestLab)
- After signup, redirect to /welcome (3-card onboarding screen)
- After login, redirect to /dashboard
- Protected routes: /dashboard, /product/*, /settings — redirect unauthenticated to /login

### Acceptance criteria

- User can sign up, log in, log out
- Sessions persist across page reloads
- Unauthenticated users cannot access protected routes
- Firestore security rules enforce: user can only read/write `users/{their_uid}/...`
- Auth state is reflected globally via `useAuth()` hook

### Open questions / TBD

- Email verification on signup: required or optional in MVP?
- Account deletion flow: should it cascade-delete all user data? (Yes for GDPR compliance — needs Cloud Function.)

---

## Module 2: Pipeline Dashboard

### What it does

The home screen after login. Shows all user's products as a kanban board grouped by status.

### User scenarios

- User sees all their products at a glance, grouped by stage
- User drags a product card from one column to another to change its status
- User clicks a product card to open its detail page
- User clicks "+ Quick add" or "+ Guided setup" to add new products
- User sees a banner if there's an in-progress wizard session (with Resume action)
- User filters to show/hide killed and scaling products
- User sees an empty state on first visit (no products)

### Data structure

Reads from:
```
users/{userId}/products/{productId}
  - name: string
  - sourceUrl: string?
  - imageUrl: string?
  - niche: string?
  - status: 'idea' | 'researching' | 'brief_ready' | 'testing' | 'tested' | 'killed' | 'scaling'
  - source: 'manual' | 'wizard' | 'extension'
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

Aggregates (computed on read):
- `hypothesesCount`: total hypotheses for this product
- `testedCount`: hypotheses with status='tested'

### UX details

- 5 default columns visible: Idea / Researching / Brief Ready / Testing / Tested
- Toggle filters at top: "Show killed" "Show scaling" — adds those columns when on
- Each card shows: image (or placeholder), name, niche tag, "N hypotheses" "M tested"
- Drag-drop between columns updates `status` immediately (optimistic UI)
- Real-time listener — changes in another tab reflect within seconds
- Empty state: illustration + "Add your first product" + 1-line explainer
- In-progress wizard banner at top if any active wizard session exists for this user
- Top-right buttons: "+ Quick add" (opens table modal) | "+ Guided setup" (starts wizard, asks "for which product?" — choose existing or create new)

### Acceptance criteria

- All user's products render in correct columns by status
- Drag-drop updates status in Firestore and re-renders
- Real-time updates work across tabs
- Empty state shows when 0 products
- In-progress wizard banner appears if `wizardSessions` exists with `status='in_progress'`
- Mobile: kanban transforms into a vertical list with status filter chips

### Open questions / TBD

- "+ Guided setup" from dashboard: does it open a "select product" modal first, or jump to "create new product" by default? (Recommendation: jump to create new, with option to "use existing product instead.")

---

## Module 3: Quick Add (Capture Mode)

### What it does

Bulk-add products without filling hypotheses. For when the user is in capture mode — saw a list of candidates, wants to dump them, will think later.

### User scenarios

- User pastes a list of product names from clipboard → table auto-populates rows
- User pastes a single TikTok/AliExpress/Amazon URL → backend scrapes OG metadata in background, fills name + image
- User fills 5–10 products manually in the table view
- User saves all rows → products created in status "Idea" with no hypotheses

### Data structure

Creates entries in `users/{userId}/products/{productId}` with:
- Required: name
- Optional: sourceUrl, imageUrl, niche, price, notes
- Auto-set: status='idea', source='manual', createdAt, updatedAt

### UX details

- Modal opens from "+ Quick add" button on dashboard
- Spreadsheet-like table inside modal
- Columns: Image (drop zone or URL), Name*, Source URL, Niche, Price, Notes, [delete row]
- Tab key moves to next cell, Enter creates new row
- Paste behavior:
  - Single URL → tries to scrape, fills name/image
  - Multi-line text → splits by newline, creates one row per line, treats each line as Name
  - Multi-column tab/comma-separated → parses as TSV/CSV
- Bulk import button: "Import from CSV" — file picker, parses CSV with column mapping
- Footer: "[X] products will be created" with Save button
- After save: toast "X products added", modal closes, dashboard refreshes

### Acceptance criteria

- User can fill 1–50 products in one session
- Multi-line clipboard paste creates rows correctly
- URL paste triggers async scrape (UI does not block)
- All saved products appear in Idea column on dashboard
- Validation: name min 2 chars, sourceUrl is valid URL if provided
- CSV import handles common formats (with / without headers)

### Open questions / TBD

- OG scraping: own backend or 3rd-party API (Microlink, Linkpreview)? Recommendation: 3rd-party in MVP (cheaper, faster), own backend in V2 if cost becomes issue.
- Max products per Quick Add session: 50? 100? Should there be a limit?

---

## Module 4: Wizard Engine (Discovery Mode)

### What it does

The flagship UX of the product. Guides the user through full product evaluation: viability check + multi-avatar selection + multi-angle generation + landing match + offer + KPIs. Outputs 1–3 fully-formed hypotheses.

This is **the most important module** in the product. Treat it accordingly.

### User scenarios

- User starts wizard from dashboard with new product
- User starts wizard from dashboard for existing product (e.g. one previously Quick-Added)
- User completes full 9-step wizard in one session
- User pauses at any step ("Save & exit") — state persists, can resume
- User resumes wizard from dashboard banner — state fully restored
- User abandons wizard (closes tab without explicit save) — state still persists from last auto-save
- User skips viability check (Skip button at start of Card 3)
- User picks 1 avatar in multi-select (creates 1 hypothesis on completion)
- User picks 3 avatars (creates 3 hypotheses on completion, one per avatar)
- User regenerates AI suggestions (within rate limit)
- User edits AI suggestions before continuing
- User finishes wizard with hypotheses in "Draft" or "Ready to test" status

### Data structure

**Wizard session** (separate entity from hypothesis):

```
users/{userId}/wizardSessions/{sessionId}
  - productId: string  // links to created/existing product
  - currentStep: number (1–9)
  - status: 'in_progress' | 'completed' | 'abandoned'
  - 
  - productBasics: { name, sourceUrl, imageUrl }  // step 1
  - context: { niche, sellingPrice, supplierCost }  // step 2
  - viability: ViabilityCheckData | null  // step 3 (null if skipped)
  - selectedAvatars: AvatarSuggestion[]  // step 4 (1–3 items)
  - selectedAngles: { [avatarIndex]: AngleSuggestion }  // step 5
  - landingMatches: { [avatarIndex]: LandingData }  // step 6
  - offers: { [avatarIndex]: OfferData }  // step 7
  - expectedKPIs: { [avatarIndex]: KPIData }  // step 8
  - 
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - completedAt: Timestamp?
```

On completion, the session writes N hypothesis documents (one per selected avatar) into `users/{uid}/products/{productId}/hypotheses/`.

### UX details

**Visual style:**
- Full-screen card layout, one card per step
- Smooth horizontal slide animation between cards
- Top progress bar with 9 dots, current dot highlighted
- Top-right: "Save & exit" button (always visible)
- Bottom of each card: "Back" "Next" buttons (Next disabled until card requirements met)
- Mobile: vertical card stack, swipe between cards

**Card-by-card spec:**

**Card 1 — Product basics**
- Inputs: Name*, Source URL, Image (drop / URL)
- Background: if Source URL pasted, attempt OG scrape, auto-fill missing fields with "Suggested from URL — accept?" prompt
- Next disabled until Name has min 2 chars

**Card 2 — Niche & price**
- Inputs: Niche (autocomplete), Selling price ($), Supplier cost ($) (optional)
- Inline calc: "Margin: $X (Y%)"
- All optional except niche-or-skip

**Card 3 — Viability check (see Module 5 for full spec)**
- Header: "Before we build hypotheses, let's check if this product is worth testing. Strongly recommended."
- Skip button: "Skip viability check" → leads directly to Card 4
- Otherwise: 8-question form → AI summary card with risk flags
- After viability summary, options: Continue / Save product as Killed / Save & exit

**Card 4 — Generate avatars**
- Big center button: "🪄 Generate 5 buyer avatars"
- AI thinks ~5–8s with rotating performative-AI status messages
- 5 avatar cards animate in with staggered fade+slide-up
- Each avatar card: name, demographics, painPoint, context, reasoning, [select checkbox]
- Footer: "Select 1–3 avatars to build hypotheses for. You picked: X"
- Buttons: "🔄 Regenerate" (regenerates 5 fresh avatars, prior selections lost) / "✏️ Add manual avatar" (opens form to add custom avatar)
- Next disabled until ≥1 avatar selected, max 3

**Card 5 — Generate angles per avatar**
- Tab UI at top, one tab per selected avatar (e.g. "Nurse" / "Truck driver" / "Office worker")
- Each tab independently:
  - Big button: "🪄 Generate 5 angles for this avatar"
  - AI generates 5 angles using avatar context
  - 5 angle cards with type tag, hook, valueProposition, reasoning, [select radio]
  - Manual angle option
  - Next button on this card requires angle selected for ALL tabs

**Card 6 — Landing match per hypothesis**
- Tab UI again, one tab per (avatar, angle) pair
- AI auto-generates draft landing fields from prior context (no separate generate button)
- Editable fields: Hero message, Primary benefit, Proof element (with dropdown of options), CTA
- Header hint: "This must continue the angle. If your ad promises X, the landing must lead with X — not features."
- Next requires hero filled per tab

**Card 7 — Offer per hypothesis**
- Tab UI
- Pre-filled price from Card 2
- Inputs: Price, Structure, Urgency
- Next requires price per tab

**Card 8 — Expected KPIs per hypothesis**
- Tab UI
- Inputs: CTR, CPC, ATC, ROAS
- Per-tab button: "🪄 Suggest baselines" — AI returns range based on niche/avatar/angle, user can accept or override
- Optional — can leave blank, but flagged as "Recommended"

**Card 9 — Review**
- Single screen showing collapsed summary per hypothesis
- Each summary expandable
- Click any field → jumps back to that card with state preserved
- Status selector per hypothesis: "Save as draft" / "Mark ready to test" (latter requires trinity complete)
- Footer: "Save & finish" → creates N hypotheses, marks session complete, redirects to product detail

**Save & exit behavior:**
- At any card, "Save & exit" persists current state to `wizardSessions/{sessionId}`
- Auto-save also runs after each card transition
- On dashboard, session shows as "in progress" banner with Resume button
- Resume opens wizard at last completed card with all state restored

**Animation choices:**
- AI generation has performative loading states (4–8 seconds, rotating messages)
- Generated cards animate in with staggered timing (200ms between cards)
- Card transitions are smooth horizontal slides (~300ms)
- No jarring spinners; loading states feel deliberate

### Acceptance criteria

- User completes wizard end-to-end with 1, 2, and 3 avatars selected (covers all multi-select scenarios)
- Wizard session persists at every step; user can close tab and return without data loss
- Resume from dashboard banner restores exact state including AI-generated content
- Skipping viability still produces valid hypotheses
- All AI-generated suggestions are editable before commit
- On completion, N hypotheses are created in Firestore with correct linkage
- Trinity validation: hypothesis with empty avatar/angle/landing-hero cannot be marked "ready to test" at Card 9
- Mobile: wizard flow works on 375px-wide viewport with vertical card stack

### Open questions / TBD

- Regenerate AI suggestions: how many times per session? (Recommendation: unlimited within MVP since AI is unlimited; track count for analytics)
- If user picks 3 avatars at Card 4, then deselects one at Card 5: do we lose the angles/landing for the deselected? (Recommendation: yes, with confirmation modal "Removing this avatar will discard its hypothesis data. Continue?")
- "Save product as Killed" from viability: should we ask why? (Recommendation: optional 1-line reason, useful for analytics)

---

## Module 5: Viability Check

### What it does

A structured pre-test gating step. User answers 8 questions about a product's market viability; AI synthesizes a scorecard with risk flags and a recommendation.

This is the **second most important opinionated piece** of the product (after trinity). It saves money on bad products before any test runs.

### User scenarios

- User goes through viability as part of wizard (default flow)
- User skips viability check (button always visible)
- User reviews viability later from product detail page (Viability tab)
- User sees risk flags and decides: Continue / Save as Killed / Save & Exit
- User edits answers after AI summary (re-runs summary on save)

### Data structure

```
users/{userId}/products/{productId}/viability/{viabilityId}
  - answers: {
      saturation: 'lt_1_month' | '1_3_months' | '3_6_months' | '6_plus_months' | 'unsure',
      competition: '0_5' | '5_20' | '20_plus' | 'unsure',
      brandRisk: 'generic' | 'single_brand' | 'multi_brand' | 'unsure',
      sourcing: 'fast' | 'slow' | 'none' | 'unsure',
      creativeAvailability: 'plenty' | 'some' | 'little' | 'none',
      wowMoment: 'strong' | 'sort_of' | 'none',
      affordableCPA: 'yes' | 'no' | 'unsure',
      notes: string?
    }
  - summary: {
      overall: 'viable' | 'risky' | 'pass',
      flags: Array<{ category, severity, message }>,
      recommendation: string  // AI-generated paragraph
    } | null
  - generatedAt: Timestamp?
  - createdAt, updatedAt
```

(One viability record per product. Re-running overwrites the previous summary; answers are preserved as a history if needed in V2.)

### UX details

**Within wizard (default flow):**

- Card 3a: framing message + Skip button + Continue
- Card 3b: 8-question form (single scrollable page, not card-by-card)
- Each question is a labeled radio group with helper text
- Question 1 (Saturation): "How long has this product been viral? Search the product on TikTok and check oldest viral video." — radios with date ranges
- Question 7 (Affordable CPA) shows live calculation based on Card 2 supplier cost: "At 2x ROAS target, your max CPA is $X."
- Submit button: "Run viability summary"
- Loading state with performative messages (~5s)
- Card 3c: Scorecard view
  - Per-category icon: 🟢 / 🟡 / 🔴
  - Overall: 🟢 Viable / 🟡 Mixed / 🔴 Risky
  - Risk flags listed with severity color
  - AI-generated recommendation paragraph (2–4 sentences)
  - Buttons: "Continue to hypotheses →" | "Edit answers" | "Save product as Killed" | "Save & exit"

**Outside wizard (product detail tab):**
- Product detail page has a Viability tab
- If never run: empty state with "Run viability check" button
- If completed: shows scorecard + "Re-run" button
- Editing answers re-runs AI summary

**AI processing:**
- AI is given: product name, niche, all 8 answers
- AI returns structured JSON with flags array and recommendation
- If AI fails / errors: show fallback "Summary unavailable, please retry" with retry button (don't block the user from continuing)

### Acceptance criteria

- User can fill all 8 questions and get AI summary
- Skipping viability does not block wizard progress
- Editing answers re-runs summary
- Risk flags render with correct color severity
- Killed status from viability redirects user to dashboard with toast confirmation
- Viability persists per product, can be revisited
- AI failure does not break the flow — graceful fallback

### Open questions / TBD

- Should there be a "thresholds" customization for advanced users? (E.g. user defines own ROAS target.) MVP: no, hard-coded 2x.
- Should viability be re-runnable anytime, or locked once a hypothesis exists? (Recommendation: re-runnable. Markets change. Maybe in V2 we version it.)

---

## Module 6: AI Service Layer

### What it does

Central server-side service for all AI calls. Handles auth, rate limiting (deferred for MVP — unlimited), logging, error handling, prompt management. All AI features in the product call into this layer.

### User scenarios

- AI is invoked invisibly throughout the product (avatars, angles, landing suggestions, viability summary, KPI baselines, v2 suggestions from learnings)

### Architecture

- All AI calls go through server-side endpoints (Next.js API routes or Cloud Functions — match AdTestLab pattern)
- API key (ANTHROPIC_API_KEY) lives only in server env, never exposed to client
- Each endpoint:
  - Verifies Firebase ID token (user must be authenticated)
  - Logs the call with metadata (no full prompts in DB) to `users/{uid}/aiUsage/{logId}` for analytics
  - Applies rate limit (MVP: unlimited; check counter for analytics)
  - Calls Anthropic API with system + user message
  - Parses JSON response (with one retry on parse failure)
  - Returns structured data to client

### Endpoints (MVP)

| Endpoint | Purpose | Module |
|---|---|---|
| POST /api/ai/suggest-avatars | Generate 5 avatars from product context | 4 |
| POST /api/ai/suggest-angles | Generate 5 angles for a product + avatar | 4 |
| POST /api/ai/suggest-landing | Generate landing match draft for product + avatar + angle | 4 |
| POST /api/ai/suggest-baselines | Suggest expected KPI ranges for niche/avatar/angle | 4 |
| POST /api/ai/viability-summary | Synthesize viability scorecard from 8 answers + product context | 5 |
| POST /api/ai/v2-suggestions | Suggest changes for hypothesis v2 based on v1 learnings | 8 |

(All system prompts in Part 6.)

### Error handling

- Rate limit reached (deferred for MVP, but stub it): 429 with clear message
- AI API error / timeout: 500 with message "AI temporarily unavailable, please retry"
- JSON parse failure: retry once with reminder prompt; if still fails, return 500
- All errors logged to Sentry-equivalent for debugging

### Acceptance criteria

- All 6 endpoints functional, called only by authenticated users
- API key never exposed in client bundle
- All AI calls logged to user's aiUsage subcollection
- Errors handled gracefully with user-facing messages
- AI responses are valid JSON matching expected schema

### Open questions / TBD

- Streaming responses: do we want streaming for performative effect, or non-streaming with rotating UI messages?
  - Recommendation: non-streaming + rotating UI messages. Simpler, more controllable UX.
- Caching: do we cache AI responses (e.g. same product → same avatars)?
  - Recommendation: no caching in MVP. Each call is fresh. Caching adds complexity and reduces variability of suggestions.

---

## Module 7: Hypothesis Editor (Power Mode)

### What it does

Full-page editor for a single hypothesis with all fields visible at once. Used for:
- Editing a hypothesis after it's been created (post-wizard)
- Creating a hypothesis manually without wizard (for power users)
- Reviewing a tested hypothesis with its actual results
- Creating v2 of a hypothesis (with carry-forward fields)

### User scenarios

- User opens an existing hypothesis from product detail page
- User edits any field; changes auto-save
- User changes status (draft → ready_to_test → testing → tested)
- User cannot mark "ready to test" if trinity incomplete (toast block)
- User fills actual results post-test
- User clicks "Create v2 from learnings" → opens editor pre-filled with AI suggestions
- User invokes AI on individual sections (regenerate avatars / angles / etc.)
- Manual hypothesis creation: user clicks "+ Hypothesis (manual)" on product page → empty editor opens

### Data structure

```
users/{userId}/products/{productId}/hypotheses/{hypothesisId}
  - version: number  // 1, 2, 3...
  - parentHypothesisId: string | null  // for v2+, points to v1
  - 
  - avatar: { name, demographics, painPoint, context }
  - angle: { type, hook, valueProposition }
  - landingMatch: { heroMessage, primaryBenefit, proofElement, cta }
  - offer: { price, structure, urgency }
  - expectedKPIs: { ctr, cpc, atc, roas }
  - actualResults: { ctr, cpc, atc, roas, verdict, learnings } | null
  - 
  - status: 'draft' | 'ready_to_test' | 'testing' | 'tested'
  - linkedAdTestLabId: string | null
  - 
  - createdFrom: 'wizard' | 'manual' | 'v2_from_learnings'
  - createdAt, updatedAt
```

### UX details

**Layout:**
- Full-page editor (route: /product/[id]/hypothesis/[hypothesisId])
- Left side: section navigator (Avatar / Angle / Landing / Offer / KPIs / Results)
- Right side: form sections, all visible (not tabs — scrollable)
- Sticky footer: status selector, "Saved" auto-save indicator, "Back to product"
- Sticky header: hypothesis name (auto-generated: "Avatar X + Angle Y"), version badge ("v2"), parent link if v2+

**Section behaviors:**
- Each section is a Card with header + AI button (where applicable) + form fields
- AI buttons re-call generation with current context (e.g. regenerate angles uses current avatar)
- Trinity fields visually marked as required (small * indicator + tooltip)
- Auto-save 2 seconds after last edit; "Saved" indicator updates

**Status transitions:**
- Status dropdown in footer
- Selecting "ready_to_test" with incomplete trinity → toast error, status reverts
- Selecting "testing" → optionally prompt to enter launch date (optional)
- Selecting "tested" → expands Actual Results section, requires actual KPIs filled

**v2 creation flow:**
- On a hypothesis with status='tested', a button appears: "🪄 Create v2 from learnings"
- Click opens modal with AI-suggested changes (see Module 8)
- User can Accept, Edit, or Cancel
- On accept/edit, new hypothesis created with version=v1.version+1, parentHypothesisId=v1.id, fields populated from v1 + AI changes
- New hypothesis opens in editor at status='draft'

### Acceptance criteria

- All hypothesis fields editable
- Trinity enforcement blocks ready_to_test status if incomplete
- Auto-save works without flicker
- AI section regeneration works in-place (replaces section content with confirmation modal)
- v2 flow correctly carries forward and creates linked hypothesis
- Mobile: sections stack vertically, sticky footer remains accessible

### Open questions / TBD

- Should manual hypothesis creation skip viability? (It's already part of wizard; for manual creation, viability is separate via product detail tab.) Yes, skip — viability is product-level, not hypothesis-level.
- Should we allow inline AI assistance (e.g. "rewrite this hook" button per field)? MVP: no, only section-level regeneration. V2: per-field AI.

---

## Module 8: Results & Learnings + Versioning

### What it does

Post-test workflow. User enters actual KPIs and learnings. AI helps create v2 by reading learnings and suggesting changes. Hypothesis tree is rendered visually.

This module is what makes the product **compounding** rather than transactional.

### User scenarios

- User completes a test, opens hypothesis, fills actual results
- User writes learnings in markdown
- User selects verdict (kill / fix / continue / scale)
- User triggers "Create v2 from learnings" — sees AI suggestions, accepts or edits
- User views hypothesis tree on product page (h1 → h2 → h3, sibling branches)
- User compares hypotheses side-by-side via Compare toggle

### Data structure

```
hypothesis.actualResults: {
  ctr: number | null,
  cpc: number | null,
  atc: number | null,
  roas: number | null,
  verdict: 'kill' | 'fix' | 'continue' | 'scale' | null,
  learnings: string,  // markdown
  testEndedAt: Timestamp?
}

hypothesis.parentHypothesisId: string | null  // links v2 to v1
```

### UX details

**Actual Results section in hypothesis editor:**
- Collapsed by default (until status='tested')
- Expanded shows:
  - 4 number inputs (actual CTR, CPC, ATC, ROAS) with live comparison vs expected (delta % + green/red indicator)
  - Verdict radio (kill / fix / continue / scale) with brief tooltip on each
  - Learnings markdown editor (with preview tab)
- "Create v2 from learnings" button appears after verdict selected (any verdict, even 'kill' — sometimes you want to retry a different angle on the same product)

**v2 suggestion modal:**
- Triggered by "Create v2 from learnings" button
- AI is given: full v1 hypothesis + actualResults + learnings
- AI returns structured suggestions:
  - **Keep section:** what worked, list of fields to carry forward unchanged
  - **Change section:** what's broken, list of fields to change with proposed new values
  - Recommendation paragraph (2–4 sentences)
- User actions:
  - **Create v2 with these changes** — creates hypothesis with all suggestions applied
  - **Edit before creating** — opens editor with suggestions applied, user tweaks then saves
  - **Cancel** — closes modal, no v2 created

**Hypothesis tree on product page:**
- Hypothesis tab on product detail
- Default view: card list, but versioned hypotheses are visually nested (h2 indented under h1)
- Tree icon next to parent indicates lineage
- Each card shows: avatar.name, angle.type, status badge, verdict badge (if tested), version label
- Compare toggle: switches list to a comparison table (max 5 hypotheses; if more, paginate)

**Compare table:**
- Columns: one per hypothesis (label "h1", "h1.v2", "h2", etc.)
- Rows: avatar.name, angle.type, hero, expected ROAS, actual ROAS, verdict
- Visual deltas: green if actual ≥ expected, red if less
- Sort option: by actual ROAS desc (default), by version, by date

### Acceptance criteria

- Actual results auto-save on edit
- Verdict selection unlocks "Create v2 from learnings" button
- v2 modal correctly displays AI suggestions with diff visualization
- v2 creation correctly links parent and increments version
- Tree view renders nested hypotheses correctly (up to 5 levels deep)
- Compare table works for up to 5 hypotheses

### Open questions / TBD

- v2 from a 'killed' verdict: should it default to creating a fresh hypothesis (no carry-forward) or partial carry-forward? Recommendation: ask user "Keep avatar / angle / both / neither?" — flexible.
- How deep can hypothesis trees go? MVP: no hard limit, but tree view limits to ~5 levels visually. Beyond that, we collapse with "+N more."
- Compare across products: V2 feature. MVP only compares within same product.

---

## Module 9: Settings & Account

### What it does

User can view/edit basic account info, see AI usage stats, log out, delete account.

### User scenarios

- User updates display name
- User views AI usage (stats only — no billing in MVP)
- User logs out
- User deletes account (with confirmation, cascades all data)

### Data structure

Reads from `users/{userId}` and `users/{userId}/aiUsage/`.

### UX details

- /settings route, simple form-based page
- Sections: Profile / AI Usage / Danger Zone
- Profile: email (read-only), display name (editable)
- AI Usage: counter "X AI calls this month" (informational, no limits in MVP)
- Danger Zone: Logout button + Delete account button (with email confirmation modal, then Cloud Function deletes all user data)

### Acceptance criteria

- User can update display name
- AI usage counter shows accurate count
- Account deletion cascades all user data (products, hypotheses, viabilities, wizard sessions, ai usage)
- Logout clears session and redirects to /login

---

# Part 5: Data Model

Full Firestore schema. This is the canonical reference.

## 5.1 Collections overview

```
users/{userId}
  └─ products/{productId}
      ├─ hypotheses/{hypothesisId}
      └─ viability/{viabilityId}    // singleton: one per product
  ├─ wizardSessions/{sessionId}
  └─ aiUsage/{logId}
```

## 5.2 Detailed schemas

### `users/{userId}`

```typescript
{
  email: string,
  displayName: string,
  createdAt: Timestamp,
  lastActiveAt: Timestamp,
  // For analytics: how the account was created
  source: 'signup_email' | 'signup_google'
}
```

### `users/{userId}/products/{productId}`

```typescript
{
  name: string,                   // required, min 2 chars
  sourceUrl: string | null,
  imageUrl: string | null,
  niche: string | null,
  sellingPrice: number | null,
  supplierCost: number | null,
  notes: string | null,           // markdown
  status: ProductStatus,           // see below
  source: 'manual' | 'wizard' | 'extension' | 'api',
  killedReason: string | null,    // optional, set when status='killed'
  createdAt: Timestamp,
  updatedAt: Timestamp
}

type ProductStatus = 
  | 'idea' 
  | 'researching' 
  | 'brief_ready' 
  | 'testing' 
  | 'tested' 
  | 'killed' 
  | 'scaling'
```

### `users/{userId}/products/{productId}/hypotheses/{hypothesisId}`

```typescript
{
  version: number,                          // 1, 2, 3...
  parentHypothesisId: string | null,        // null for v1, points to parent for v2+
  
  avatar: {
    name: string,
    demographics: string,
    painPoint: string,
    context: string
  },
  angle: {
    type: 'pain' | 'money_saving' | 'convenience' | 'comparison' | 'lifestyle' | 'gift' | 'other',
    hook: string,
    valueProposition: string
  },
  landingMatch: {
    heroMessage: string,
    primaryBenefit: string,
    proofElement: string,
    cta: string
  },
  offer: {
    price: number,
    structure: string,
    urgency: string | null
  },
  expectedKPIs: {
    ctr: number | null,
    cpc: number | null,
    atc: number | null,
    roas: number | null
  },
  actualResults: {
    ctr: number | null,
    cpc: number | null,
    atc: number | null,
    roas: number | null,
    verdict: 'kill' | 'fix' | 'continue' | 'scale' | null,
    learnings: string,           // markdown
    testEndedAt: Timestamp | null
  } | null,
  
  status: 'draft' | 'ready_to_test' | 'testing' | 'tested',
  linkedAdTestLabId: string | null,         // V2 integration field
  
  createdFrom: 'wizard' | 'manual' | 'v2_from_learnings',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `users/{userId}/products/{productId}/viability/{viabilityId}`

(Singleton: typically one per product, ID can be deterministic like `current`.)

```typescript
{
  answers: {
    saturation: 'lt_1_month' | '1_3_months' | '3_6_months' | '6_plus_months' | 'unsure',
    competition: '0_5' | '5_20' | '20_plus' | 'unsure',
    brandRisk: 'generic' | 'single_brand' | 'multi_brand' | 'unsure',
    sourcing: 'fast' | 'slow' | 'none' | 'unsure',
    creativeAvailability: 'plenty' | 'some' | 'little' | 'none',
    wowMoment: 'strong' | 'sort_of' | 'none',
    affordableCPA: 'yes' | 'no' | 'unsure',
    notes: string | null
  },
  summary: {
    overall: 'viable' | 'risky' | 'pass',
    flags: Array<{
      category: string,
      severity: 'low' | 'medium' | 'high',
      message: string
    }>,
    recommendation: string                  // AI-generated paragraph
  } | null,
  generatedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `users/{userId}/wizardSessions/{sessionId}`

```typescript
{
  productId: string,                         // links to existing or just-created product
  currentStep: number,                       // 1–9
  status: 'in_progress' | 'completed' | 'abandoned',
  
  // Step-by-step state — null until that step is reached
  productBasics: { name, sourceUrl, imageUrl } | null,
  context: { niche, sellingPrice, supplierCost } | null,
  viability: ViabilityCheckData | null,      // null if skipped
  selectedAvatars: AvatarSuggestion[] | null,
  selectedAngles: { [avatarIndex: number]: AngleSuggestion } | null,
  landingMatches: { [avatarIndex: number]: LandingData } | null,
  offers: { [avatarIndex: number]: OfferData } | null,
  expectedKPIs: { [avatarIndex: number]: KPIData } | null,
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt: Timestamp | null
}
```

### `users/{userId}/aiUsage/{logId}`

```typescript
{
  endpoint: string,                          // e.g. 'suggest-avatars'
  productId: string | null,
  hypothesisId: string | null,
  status: 'success' | 'error',
  errorType: string | null,
  durationMs: number,
  timestamp: Timestamp
}
```

## 5.3 Security rules outline

```
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  
  match /{document=**} {
    allow read, write: if request.auth.uid == userId;
  }
}
```

(Detailed rules will refine field-level validation in implementation.)

## 5.4 Indexes

Composite indexes needed:
- `products` collection group: `status` ASC, `updatedAt` DESC (for kanban filter)
- `hypotheses` collection group: `status` ASC, `updatedAt` DESC
- `wizardSessions`: `status` ASC, `updatedAt` DESC (for in-progress banner)

---

# Part 6: AI Prompts Library

All system prompts, ready to copy-paste into the AI service layer. These are V1 prompts; expect to iterate after observing real user data.

## 6.1 Suggest Avatars

**Endpoint:** POST /api/ai/suggest-avatars  
**Module:** 4 (Wizard, Card 4)  
**Inputs:** product name, niche, sellingPrice, viability summary (if available)  
**Output:** 5 avatars

```
You are a senior dropshipping strategist helping an ecommerce founder identify buyer avatars for a product they're considering testing.

Your job: generate 5 DISTINCT, REALISTIC buyer avatars. Each avatar must be a different type of person with a different reason to buy.

Rules:
1. Avatars must be SPECIFIC, not generic. "People who like cooking" is bad. "Busy parents who meal-prep on Sundays for the whole work week" is good.
2. Pain point must be SPECIFIC and URGENT. "Wants to save time" is bad. "Spends 45 minutes every weekday packing kids' lunches and arrives late to work" is good.
3. Context must explain WHERE and WHEN the pain happens — this drives ad creative direction.
4. Avoid demographic stereotypes. Focus on situation and behavior.
5. If viability flags suggest the market is saturated, lean toward UNDERSERVED avatars (specific niches, occupations, life situations) rather than mass-market.
6. Each avatar gets a "reasoning" field — 1 sentence on WHY this avatar would buy and what angle would work.

Output STRICT JSON, no markdown, no preamble:
{
  "avatars": [
    {
      "name": "Short label (e.g. 'Night-shift nurse, 28-40')",
      "demographics": "Age range, gender skew, income, location type",
      "painPoint": "Specific, urgent pain — 1-2 sentences",
      "context": "Where and when this pain occurs",
      "reasoning": "Why this avatar buys + which angle fits"
    }
  ]
}
```

## 6.2 Suggest Angles

**Endpoint:** POST /api/ai/suggest-angles  
**Module:** 4 (Wizard, Card 5)  
**Inputs:** product name, niche, avatar (name, painPoint, context)  
**Output:** 5 angles

```
You are a senior dropshipping copywriter helping an ecommerce founder choose sales angles for a product test.

Your job: generate 5 DISTINCT sales angles for the given avatar. Each angle is a different way to sell the same product to the same buyer.

Rules:
1. EVERY angle must be relevant to the specific avatar provided. Don't drift to generic angles.
2. Hook must be 1-2 sentences, written as it would sound in an ad — not a description of the angle.
3. Value proposition explains the FULL promise behind the hook — what the buyer gets and why they should care.
4. Angle types: pain | money_saving | convenience | comparison | lifestyle | gift | other. Use 'other' only if none fit.
5. Reasoning: 1 sentence on WHY this angle would work for this avatar and what landing page treatment it needs to convert.
6. Avoid clichés. "Game-changer" and "revolutionary" are banned. Be specific.

Output STRICT JSON, no markdown:
{
  "angles": [
    {
      "type": "pain | money_saving | convenience | comparison | lifestyle | gift | other",
      "hook": "1-2 sentence hook in ad voice",
      "valueProposition": "Full promise, 2-4 sentences",
      "reasoning": "Why it works for this avatar + landing page direction"
    }
  ]
}
```

## 6.3 Suggest Landing Match

**Endpoint:** POST /api/ai/suggest-landing  
**Module:** 4 (Wizard, Card 6)  
**Inputs:** product name, avatar, angle, offer (price)  
**Output:** Landing fields

```
You are a senior conversion copywriter helping an ecommerce founder build a landing page that matches their ad.

Critical rule: the landing page must CONTINUE the angle from the ad. If the ad promises "stop wasting money on takeout," the landing must lead with money-saving framing — not features, not lifestyle, not generic benefits.

Your job: draft the first-screen content for a landing page given the avatar and angle.

Rules:
1. Hero message: 1 sentence, leads with the same emotional frame as the ad hook. Specific and concrete (numbers > vague claims).
2. Primary benefit: 1 sentence, the single biggest payoff for this avatar.
3. Proof element: pick from [UGC video / customer reviews / before-after / demo / expert / comparison table]. Choose what fits avatar + angle.
4. CTA: action-oriented, specific. "Get mine — save $500+ this month" beats "Buy now."

Output STRICT JSON:
{
  "heroMessage": "...",
  "primaryBenefit": "...",
  "proofElement": "UGC video | customer reviews | before-after | demo | expert | comparison table",
  "cta": "..."
}
```

## 6.4 Suggest KPI Baselines

**Endpoint:** POST /api/ai/suggest-baselines  
**Module:** 4 (Wizard, Card 8)  
**Inputs:** niche, avatar, angle, sellingPrice  
**Output:** Suggested KPI ranges

```
You are a media buyer with experience in dropshipping benchmarks.

Your job: suggest realistic KPI baselines for a cold-traffic test on Meta ads given this niche, avatar, angle, and price point.

Be honest. Don't sandbag, don't inflate. Provide RANGES, not point estimates.

Output STRICT JSON:
{
  "ctr": { "min": number, "max": number, "note": "1 sentence rationale" },
  "cpc": { "min": number, "max": number, "note": "..." },
  "atc": { "min": number, "max": number, "note": "..." },
  "roas": { "min": number, "max": number, "note": "..." }
}

Notes are 1 sentence each. CPA implied by CPC × (1/ATC) should make sense given the price point.
```

## 6.5 Viability Summary

**Endpoint:** POST /api/ai/viability-summary  
**Module:** 5  
**Inputs:** product name, niche, all 8 viability answers  
**Output:** Scorecard structure

```
You are a senior product analyst evaluating whether a dropshipping product is worth testing.

Given the user's answers to the 8-question viability check, synthesize:
1. An overall verdict: 'viable' (proceed) | 'risky' (proceed with caution) | 'pass' (don't test).
2. A list of risk flags — specific concerns derived from the answers.
3. A 2-4 sentence recommendation that explains the verdict and gives actionable advice.

Rules:
- Be honest. If the product is in trouble, say so.
- Risk severities: 'low' (worth noting), 'medium' (must address), 'high' (likely deal-breaker).
- Don't invent flags not supported by the answers.
- Recommendation should give concrete next steps, not platitudes.

Output STRICT JSON:
{
  "overall": "viable | risky | pass",
  "flags": [
    {
      "category": "Saturation | Competition | Brand risk | Sourcing | Creatives | Wow moment | Margin",
      "severity": "low | medium | high",
      "message": "1 sentence describing the specific concern"
    }
  ],
  "recommendation": "2-4 sentence actionable summary"
}
```

## 6.6 v2 Suggestions from Learnings

**Endpoint:** POST /api/ai/v2-suggestions  
**Module:** 8  
**Inputs:** full v1 hypothesis (avatar, angle, landing, offer, expectedKPIs, actualResults, learnings, verdict)  
**Output:** Carry-forward + change suggestions

```
You are a senior media buyer helping iterate on a hypothesis after a test.

You have v1 of a hypothesis with its actual results, verdict, and the user's learnings. Your job is to suggest v2 — what to KEEP (working) and what to CHANGE (broken), with specific proposed values for changes.

Rules:
1. Read the verdict and learnings carefully. The user's own analysis is the strongest signal.
2. KEEP what worked. CHANGE what broke. Don't change everything — that's not iteration, that's starting over.
3. For each CHANGE, propose a specific new value, not a vague direction.
4. If KPIs deviated significantly, suggest revised expectedKPIs for v2.
5. Recommendation: 2-4 sentences on the iteration logic.

Output STRICT JSON:
{
  "keep": ["avatar", "angle", "hook"],   // list of fields/sections to carry forward unchanged
  "change": [
    {
      "field": "landingMatch.heroMessage",
      "currentValue": "...",
      "proposedValue": "...",
      "reasoning": "Why this change addresses the v1 problem"
    }
  ],
  "revisedExpectedKPIs": { "ctr": number, "cpc": number, "atc": number, "roas": number } | null,
  "recommendation": "2-4 sentence iteration summary"
}
```

---

# Part 7: Design Principles

## 7.1 Reuse from AdTestLab

All visual design tokens, components, and patterns are inherited from AdTestLab via the four skills:

- `.claude/skills/code-style/SKILL.md`
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/firebase-patterns/SKILL.md`
- `.claude/skills/ai-prompting/SKILL.md`

Do not reinvent. Copy components verbatim. Same buttons, same modals, same colors, same typography. The two products should feel like siblings.

## 7.2 New patterns introduced in ProductTestLab

These are NEW for ProductTestLab and need to be designed:

- **Wizard card layout** — full-screen, horizontal slide transitions, progress dots
- **Performative AI loading** — rotating status messages over 4–8 seconds
- **Staggered AI result reveal** — cards animate in 200ms apart
- **Hypothesis tree view** — nested/indented cards showing version lineage
- **Compare table** — horizontal hypothesis comparison
- **Viability scorecard** — colored severity indicators + flags list

For each new pattern, build a small reference implementation in the design system (under a "ProductTestLab patterns" subsection) before applying broadly.

## 7.3 Mobile

- Desktop-first for MVP
- Wizard works on mobile (vertical card stack, swipe transitions)
- Pipeline kanban transforms to vertical list with status filter chips on mobile
- Tables (Quick Add, Compare) become horizontally scrollable with sticky first column on mobile
- All other screens are responsive but not mobile-optimized in MVP

## 7.4 Tone of voice

The product talks to the user like a knowledgeable colleague, not a coach or guru:

- "Strongly recommended — saves money on bad products" — direct, evidence-based
- Not: "Don't worry, we'll guide you!" — patronizing
- Not: "Our AI will find your winning product!" — overpromising

Tooltips and helper text use concrete examples, not abstractions:

- ✓ "Pain Point: 'Spends 45 minutes packing lunch every day' — good."
- ✗ "Pain Point: A specific pain your avatar experiences."

---

# Part 8: Implementation Roadmap

## 8.1 Epics

The work breaks into 9 epics. Within each epic, tasks roughly map to one Claude Code prompt each.

| Epic | Module | Estimated tasks | Dependencies |
|---|---|---|---|
| E0: Skills extraction | (foundation) | 1 | none |
| E1: Project bootstrap | (foundation) | 2 | E0 |
| E2: Auth & user mgmt | M1 | 2 | E1 |
| E3: Data layer | M1, M2, M7, M8 | 4 | E2 |
| E4: Pipeline dashboard | M2 | 3 | E3 |
| E5: Quick Add | M3 | 2 | E3, E4 |
| E6: AI service layer | M6 | 3 | E2 |
| E7: Wizard engine | M4 | 6 | E3, E6 |
| E8: Viability check | M5 | 2 | E6 (subset of E7 if integrated tightly) |
| E9: Hypothesis editor | M7 | 3 | E3, E6 |
| E10: Results & versioning | M8 | 3 | E9 |
| E11: Settings | M9 | 1 | E2 |
| E12: Polish & deploy | (cross-cutting) | 2 | all |

Total: ~34 tasks, each ~2–6 hours of focused work.

## 8.2 Suggested order

The order is partly serial (dependencies), partly parallelizable. For a single developer:

1. E0 → E1 → E2 → E3 (foundation, blocking everything)
2. E4 (pipeline visible) — first user-facing milestone
3. E5 (quick add) — first end-to-end feature for capture mode
4. E6 (AI layer) — unblocks all AI features
5. E7+E8 (wizard with embedded viability) — flagship UX
6. E9 (hypothesis editor) — for power-users and v2 creation
7. E10 (results & versioning) — closes the loop
8. E11 → E12 (polish)

**Earliest demoable point:** after E5 (capture mode works end-to-end). Show this to 3–5 alpha users for feedback before investing in wizard.

**Earliest "complete MVP" point:** after E12. Ready for broader alpha (10–20 users).

## 8.3 Risk areas

Areas where things are most likely to go wrong:

- **Wizard state persistence** (E7) — most complex stateful logic. Test resume thoroughly.
- **AI JSON parsing reliability** (E6) — Anthropic occasionally returns invalid JSON. Retry logic is essential.
- **Trinity enforcement** (E3, E9) — must be enforced at data layer (Zod), not just UI.
- **Real-time listeners** (E3, E4) — Firestore costs and quota awareness.

---

# Part 9: Out of Scope

Explicit list of what is NOT in MVP. These are deferred consciously, not forgotten.

## 9.1 V2 candidates (next 3 months after MVP launch)

- **AdTestLab integration** — auto-pull actual results from AdTestLab into hypothesis
- **Chrome extension** — capture products from TikTok/Aliexpress/Amazon with one click
- **Mobile-optimized capture** — quick add via mobile-friendly UI
- **Per-field AI assistance** — "rewrite this hook" inline buttons
- **AI brief critique** — flags inconsistencies (angle vs hero mismatch)
- **Niche templates** — preset avatars/angles for popular niches
- **Launch brief export** — PDF/Notion export
- **Cross-product compare** — compare hypotheses across different products

## 9.2 V3 candidates (further future)

- **Teams & collaboration** — invite, share, comment
- **Public benchmarks** — anonymized aggregated niche data
- **Readiness scoring** — 8-factor calibrated score (requires 100+ tested hypotheses for calibration)
- **Creative generation** — hooks, UGC scripts, page copy from hypothesis
- **Multi-language** — UI in non-English markets

## 9.3 Explicitly never

- **AI-as-oracle features** — "this product will succeed" predictions
- **Spy tool functionality** — we are not a competitor scraper
- **Ad management** — we don't run ads, AdTestLab analyzes them post-hoc

---

# Appendix A: Definition of Done for MVP

The MVP is "done" when:

1. All 9 modules are implemented per spec
2. A new user can complete this end-to-end flow without errors:
   - Sign up
   - Quick-add 5 products
   - Run wizard on one of them with viability + 2 avatars + angles + landings + offers + expected KPIs
   - Get 2 hypotheses created
   - Mark one as "Tested," fill actual results and learnings
   - Use "Create v2 from learnings" to generate a v2 hypothesis
3. All AI endpoints return valid responses 95%+ of the time
4. Wizard sessions correctly resume after interruption
5. Trinity enforcement works (cannot mark ready_to_test without trinity)
6. Mobile responsive on 375px viewport for at least: dashboard, product page, hypothesis editor
7. 5 alpha users tested it and confirmed:
   - The flow makes sense
   - AI suggestions are useful
   - They would use it again

---

# Appendix B: Open Questions for Resolution

A consolidated list of TBDs scattered through the spec. To address before/during implementation:

- [ ] Email verification on signup: required or optional?
- [ ] Account deletion: cascade-delete via Cloud Function (yes, for GDPR)
- [ ] OG scraping: 3rd-party service or own backend? (Recommendation: 3rd-party in MVP)
- [ ] Quick Add max products per session: cap at 100?
- [ ] Wizard regenerate count: track but don't limit in MVP
- [ ] Deselecting an avatar at Card 5: confirmation modal needed
- [ ] "Save as Killed" reason: optional 1-line input
- [ ] Manual hypothesis creation skips viability (yes, viability is product-level)
- [ ] Per-field AI assistance: V2 only
- [ ] v2 from killed verdict: ask "carry forward what?"
- [ ] Hypothesis tree depth limit: visual collapse beyond 5 levels
- [ ] AI streaming vs non-streaming: non-streaming + UI rotation (decided)
- [ ] AI response caching: no caching in MVP (decided)
- [ ] Viability customization (custom ROAS target): no in MVP

---

**End of specification.**
