# Discovery Roadmap

> Last updated 2026-05-20 · post Phase 7 ship · informed by Ron Lieber's
> *The Opposite of Spoiled* research (full notes in
> [`OPPOSITE-OF-SPOILED-NOTES.md`](./OPPOSITE-OF-SPOILED-NOTES.md))

## Working hypothesis (validated by the research)

v1 is structurally aligned with Lieber's framework — three jars, multi-funder
attribution, withdrawal-request approval, reconciliation, caretaker APR,
weekly digest. The book reads almost like a feature spec for what we're
building. **But three of Lieber's load-bearing mechanics are missing from
v1 in ways that subtly invert the product:**

1. **No friction on Spend** → the app could *accelerate* impulse rather than
   slow it
2. **Give is structurally Save 2** → the third leg of the stool is decorative
   unless it has its own ritual, recipient picker, and amplifier
3. **No conversation surface** → v1 is a beautiful financial record; Lieber's
   pedagogy is about the conversation the record provokes

These three gaps are the discovery roadmap's spine. Everything else is
sequencing.

---

## The two reframes

### Reframe 1: "Spreadsheet-killer for caretakers" → "Friction layer for kids"

v1's product thesis is *we're a better spreadsheet* (CEO review path A). The
audience is the caretaker; the win is the caretaker's data hygiene. Lieber
inverts this: the win is the *kid's* character development, and the product
mechanism is structural waiting — Wait-a-Week, cooling-off periods,
want-vs-need tagging.

If we believe Lieber's critique, the next wave of v1.1+ features should be
**kid-facing surfaces that introduce friction**, not caretaker conveniences.
This shifts the sequencing meaningfully.

### Reframe 2: "Money tracking" → "Values transmission"

Lieber's clearest line: *every conversation about money is also about
values.* v1 measures dollars; the Lieber-aligned product measures behaviors
that are *worth* dollars. Concrete:

- **Sunday digest** currently shows numbers. The Lieber upgrade is one
  rotating "Talk about it" prompt per week tied to the week's actual activity.
- **"Mia walked away from a $30 toy at Target"** is not a transaction — but
  it's the most important kind of data the product could capture. There's
  no field for it today.
- **Family values card** ("our family values: generous, content, careful")
  pinned to the digest is a tiny feature with outsized values-anchoring
  effect.

The product's reportable surface area is currently 100% financial. The
Lieber roadmap pushes 20-30% of it toward non-financial values signals.

---

## Sequencing — what to build after v1 launches

### v1.1 (immediately after public launch) — high-leverage, low-cost

Each item is a small addition to an existing surface. None require new
schema beyond what we already have.

| # | Feature | Surface it touches | Estimated effort (CC) |
|---|---|---|---|
| 1.1a | **Wait-a-Week list** for Spend withdrawals over a family threshold | new `/wait` surface + withdrawal request flow | ~1 day |
| 1.1b | **"Talk about it" prompts in Sunday digest** | `/digest/[week]` + a prompts library (~50 templates) | ~half day |
| 1.1c | **Gratitude micro-prompt on gift deposits** | Add Money flow + new `/thank-you/[txn]` route | ~half day |
| 1.1d | **Want / Need / Treat tagger** on withdrawal requests | request schema (1 field) + monthly distribution chart in digest | ~half day |
| 1.1e | **Comparative spending hints** ("$20 = 4 weeks of your treats") | client helper computed from rolling 60-day per-sub averages | ~3 hours |
| 1.1f | **Hours-of-fun calculator** + 2-week followup ping | optional field on Spend withdrawal + light cron | ~half day |

**~4 days total**, all additive. Nothing breaks existing v1 surfaces. The
single highest-leverage one if you only ship one: **1.1b "Talk about it"
prompts** — converts the digest from a financial report into a dinner-table
artifact for the cost of one library file and one render block.

### v1.5 — Give as a first-class citizen

Reshapes the Give bucket from "Save with red icons" into a distinct
behavioral system with its own ceremony and amplifier. This is where the
brand promise lives — if a beta caretaker tells someone "what makes this
different from a spreadsheet," the Give ritual is most likely to be the
answer.

| # | Feature | Notes |
|---|---|---|
| 1.5a | **Recipient picker** for Give withdrawals (saved recipients list per family) | Replaces free-text note with structured destination; enables 1.5b/c |
| 1.5b | **Caretaker charity match** (1x/2x/custom, per-quarter cap) | Approval flow shows the multiplier toggle; recorded as separate attributed line |
| 1.5c | **Quarterly Give ceremony** (Mar/Jun/Sep/Dec 1) | Banner on dashboard fills Phase 7's `banner` slot pattern; printable donation letter |
| 1.5d | **"Mark as delivered" with photo** | Closes the loop on the handover moment |

**~1 week of work**, but it's the biggest values-transmission lever in the
whole roadmap. Worth elevating above v2 owner-UI work if the founder agrees
with the reframe.

### v2 — Owner UI (already in v1 plan) + Lieber additions

v1 plan already commits to the kid-facing UI as v2. The Lieber additions
plug in cleanly:

- **Goal photo + countdown** on Save subcategories (visible patience anchor)
- **Lieber-amount allowance scheduler** (auto-deposit, $0.50–$1/year/week
  default with research band)
- **Family values card** (3-trait selection at onboarding; renders in
  digest and kid home)
- **Caretaker self-modeling** ("Family view" showing Mom's own Spend/Save/Give
  next to Mia's — closes the "parent behavior is the loudest signal" loop)
- **Multi-funder auth** (Grandma logs in directly; v1 plan §8.2 lists this
  as v2)
- **Multi-child households** (one caretaker, multiple piggybanks — schema
  needs the unique constraint change called out in `polish-todo.md`)

### v2.5 — Quarterly meeting agenda + values reinforcement

| Feature | Notes |
|---|---|
| **Quarterly family money meeting agenda** generator | 5-item PDF, caretaker marks items as discussed |
| **"Non-dollar wins" capture** | Free-text "Mia walked away from..." entries that surface in digests |
| **Religious / secular giving presets** | Tithe (10% Give baseline), seasonal patterns, "humans-only" recipient filters |
| **Peer-pressure / subscription tracker** | Critic gap Lieber's book under-addresses; differentiation opportunity |

### v3+ — Real rails (existing plan) + earned-income

- **Stripe Issuing** (CEO review path C; real custodial card, real APR,
  real giving). Big regulatory lift, big moat. Already in v1 plan §8.1.
- **First Job mode** for 13+ kids (per-gig logging, tax-set-aside bucket,
  higher Save default). Distinguishes earned-money psychology from gifted-
  money — Lieber treats these as fundamentally different teaching surfaces.
- **Trust / UGMA / UTMA wrapper** — CEO review path C's natural endpoint.
  Same fiduciary model, real custodial assets.

---

## Product shape changes worth committing to now

These aren't features; they're stance shifts. Worth deciding before we
build more so v1.1+ doesn't paint into a corner.

### Decision 1 — Kid surface language audit

Lieber would push hard: **a 7-year-old should never see the words "void,"
"adjustment," "reconciled," "transaction."** The audit-friendly model is
great for caretakers but the kid UI (v2) needs a dedicated translation
layer. Build a `src/lib/kid-copy.ts` map: every domain term gets a
kid-friendly equivalent. Decide now whether we commit to that or whether
v2 just shows raw labels.

### Decision 2 — Manual vs auto distribution mode

Lieber's families use physical jars precisely so the kid's hand does the
work of dividing. v1's auto-distribute is elegant but removes a teaching
moment. Should the kid UI offer an optional **"divide it yourself"** mode
where the kid drags coins into jars? This is a feature decision but also
a stance — are we optimizing for caretaker convenience (auto) or kid
development (manual)?

### Decision 3 — Non-dollar values capture

If we believe Reframe 2, the product needs at least one non-financial
input field. Simplest: a weekly "values moment" prompt in the caretaker's
digest workflow ("did anything happen this week that's worth noting?").
Stored as a `family_moment` row with kid_profile_id + free text + tags.
Surfaces in the next week's digest. Decision: build this in v1.1 or wait?

### Decision 4 — Recipient policy declaration

Lieber's families have explicit Give philosophies ("we give to humans, not
animals"; "we tithe to our church"; "we support local food banks"). Should
onboarding ask caretakers to declare a Give philosophy, and should the
recipient picker enforce it? Or is that paternalistic overreach? Worth
explicitly deciding — affects 1.5a's UI shape.

### Decision 5 — Caretaker behavior visibility

If parental behavior is the loudest signal, should the caretaker's own
spending show up in the family view? Lieber's research suggests yes; many
caretakers will find this uncomfortable. Pure transparency or opt-in?

---

## What v1 already gets right (don't break these)

- Three buckets with configurable per-family split (Lieber's literal cover)
- Multi-funder attribution (Grandma-money psychologically differs)
- Withdrawal request → caretaker approval (kid practices choosing)
- Reconciliation (jar matches app; weekly ritual)
- Caretaker-funded APR (patience needs a payoff)
- Sunday digest (the kitchen-table artifact)

If a future feature would dilute or contradict any of these, it's the wrong
feature. The roadmap above strengthens all six.

---

## What's NOT on this roadmap (deliberate omissions)

- **Real banking rails** — already in v1 plan as v3 (CEO review path C);
  not pulled forward
- **Investment / brokerage features** — explicitly out of scope per PRD
  §9; Lieber's framework doesn't push toward this either
- **Social / leaderboard features** — counter to the values of the product
  per PRD §9; Lieber explicitly warns against peer comparison
- **Chore tracking with payout** — Lieber's "allowance decoupled from
  chores" framework is non-negotiable on this. v1 plan correctly excludes
- **Generic financial literacy curriculum** — competitive products do this;
  Lieber's whole point is that *talking about your specific money* beats
  abstract lessons. Stay specific

---

## Recommended next call

Founder picks one of three postures for v1.1:

| Posture | What ships first | Defensible because |
|---|---|---|
| **A — Polish-first (safest)** | Live-DB test harness, remaining polish-todo P0/P1s, Phase 8 (Sunday digest) + Phase 9 (Settings/export) before any new behavioral mechanics | Beta cohort is small; bugs cost more than missing features at this stage |
| **B — Wait-a-Week-first (boldest)** | Ship Wait-a-Week immediately after v1 launch (1.1a), bundle it with the digest prompts (1.1b) | Lieber's strongest critique is "no friction on Spend." Closing it before scale is a marketing story |
| **C — Give-first (most differentiated)** | Skip 1.1, jump to 1.5 (Give as first-class). Recipient picker + match + ceremony | The Give system is what makes this not-a-spreadsheet. Marketing copy writes itself |

My read: **B with prompts**. Wait-a-Week is the highest-leverage single
behavioral mechanic; "Talk about it" prompts are the cheapest values upgrade.
Together they convert the product from a tracker into a system in ~1.5 days
of work. Give-first (C) is the most differentiated long-term but harder to
ship cleanly without the recipient picker plumbing — better as v1.5 after
v1.1 stabilizes.

Polish-first (A) is the wrong answer unless beta caretakers are actively
hitting bugs that block usage. As of this session: no P0s open, smoke test
landed clean, first real caretaker logged in successfully.
