# The Opposite of Spoiled — feature ideas for CM Piggybank
Research synthesis · 2026-05-20

Source material: Lieber's book page, NYT/Bloomberg/CNBC coverage, Kitces and AFCPE reviews, Dana Hirt Q&A, Meb Faber podcast transcript, Dinner: A Love Story practitioner review, Wealth of Happiness critical review, Goodreads quote archive. Citations at bottom.

## Lieber's core frameworks (in 1-2 sentences each)

- **Three jars (Spend/Save/Give).** Every dollar a kid handles gets visibly divided into three buckets so allocation becomes a values exercise, not bookkeeping. Each jar teaches a distinct virtue: Spend teaches prudence, Save teaches patience, Give teaches gratitude.
- **Allowance decoupled from chores.** Chores are what family members do for free because they love each other; allowance is a practice instrument for handling money. Mixing them lets a saver "quit the job" and breaks the lesson.
- **"Why do you ask?"** When kids ask "are we rich?" / "how much do you make?", the parent's first move is to surface the underlying anxiety (safety, fairness, comparison) before answering. Conversation is the product; the number is incidental.
- **Artificial deprivation / Dewey's 30th-percentile rule.** Deliberately keep kids around the 30th percentile of stuff in their peer group so they regularly experience wanting-and-waiting. Scarcity is the only thing that forces tradeoffs, and tradeoffs are where character forms.
- **Hours-of-fun-per-dollar.** Before any meaningful purchase, the kid estimates expected hours of enjoyment and divides into price. Reframes consumption from "do I want it?" to "is this the best use of this dollar?"
- **Cooling-off period before big buys.** Wants intense in the moment rarely survive a week. Build in a structural wait so impulse and reflection separate.
- **Empty the Give jar quarterly, kid chooses.** Giving is real, recurring, and child-directed (not parent-directed). Tactile moments — handing a check to a nonprofit, getting thanked — wire generosity to identity.
- **Money conversations as values transmission.** Talk explicitly about why you bought the organic chicken, why this charity over that one, why we don't have the boat. Every line item is a values declaration.
- **The seven virtues.** Curiosity, patience, thrift, modesty, generosity, perseverance, perspective. The book is structurally a virtue-ethics manual that uses money as the teaching surface.
- **Four traits of spoiled kids** (per the Meb Faber interview): no household rules, rules without enforcement, parents who smooth every obstacle, no gratitude. Notably none are about wealth.
- **Gratitude as the inoculation against materialism.** "There's no shame in having more or having less, as long as you're grateful for what you have, share it generously, and spend it wisely."

## Feature ideas mapped to specific frameworks

### 1. Wait-a-Week list (P0)
**Framework:** Cooling-off period before bigger purchases. "Build in cooling-off periods… wanting something intensely in the moment isn't the same as truly valuing it."
**Sketch:** Any withdrawal request from Spend above a family-set threshold (default $15) auto-routes to a "Wait List" with a configurable timer (default 7 days). Kid sees a countdown on the home screen and can cancel any time before it ends — cancellation is celebrated, not penalized ("you saved $X by waiting"). At expiry, kid gets a push asking "still want it?" with one tap to approve or release. Stats over time: % of waited items the kid ultimately bought. This is the single biggest behavioral gap in v1 — without it, the app accelerates impulse rather than slowing it.

### 2. Caretaker charity match on Give withdrawals (P0)
**Framework:** Give jar mechanics + child-directed giving. Lieber's families commonly match or amplify the kid's chosen donation to make the gesture feel weighty.
**Sketch:** When a kid initiates a Give withdrawal to a named recipient, caretaker sees an approval screen with a "Match" toggle (1x/2x/custom, family-configurable cap per quarter). Match comes from caretaker wallet, recorded as a separate attributed line. Kid's confirmation screen shows "Your $8 became $16." Quarterly Give summary highlights total impact including matches. This is the missing multiplier on the Give bucket and the highest-leverage "values transmission" feature.

### 3. Quarterly Give ceremony (P0)
**Framework:** "Empty the giving jar once a quarter and decide personally where the money goes."
**Sketch:** On Mar/Jun/Sep/Dec 1, the app surfaces a "Give Day" flow: shows Give balance, prompts kid to pick 1–3 recipients (saved from prior quarter or new), generates a printable/PDF "donation letter" with kid's name, and offers a "mark as delivered" step where caretaker uploads a photo or thank-you note. Without a ritual, Give just accumulates — Lieber's whole point is the moment of handover.

### 4. Hours-of-fun calculator on every Spend item (P1)
**Framework:** The Fun Ratio. Kid estimates engagement hours before buying.
**Sketch:** When a kid drafts a Spend withdrawal request, an optional field asks: "How many hours of fun do you think this will give you?" App computes $/hour and shows it next to historical purchases ("last month's slime was $0.12/hour; this would be $4/hour"). Two weeks post-purchase, app pings the kid to record actual hours used. Over time builds a personal "joy-per-dollar" leaderboard. Lightweight, voluntary, but creates the reflective pause Lieber wants.

### 5. "Why do you ask?" conversation prompts in the Sunday digest (P1)
**Framework:** Money conversations as values transmission; "Why do you ask?" technique.
**Sketch:** Sunday digest already exists. Add a rotating "Talk about it" block with one age-calibrated prompt drawn from the week's actual activity: "Mia put $4 into Save toward Lego this week. Ask her: what would make this set feel worth waiting for?" or "Grandma sent $20. Ask: what feels different about money from Grandma vs. allowance?" Pull from a library of ~50 prompts tagged by trigger (big deposit, missed goal, first Give, etc.). This is the cheapest possible upgrade to the digest and converts a financial summary into a dinner-table artifact.

### 6. Goal photo + countdown on Save buckets (P1)
**Framework:** "Visible progress and tangible goals (photos taped to containers)."
**Sketch:** Each Save subcategory gets an image upload slot and a computed "weeks to goal at current pace." Home screen shows the image with a progress ring. When goal hits 50%/75%/100%, app fires a celebration animation and prompts caretaker to mark the actual purchase moment with a second photo (before/after). v1 has subcategories but they're text-only — the photo is what makes patience feel concrete for a 7-year-old.

### 7. Want-vs-need tagger on withdrawal requests (P1)
**Framework:** "Wants vs. needs becomes a lesson in prudence and self-control."
**Sketch:** When kid drafts a Spend withdrawal, they pick a tag: Need / Want / Treat. Caretaker sees the tag in the approval queue. Monthly digest shows distribution ("80% wants, 15% treats, 5% needs — is that the mix you want?"). No blocking, just a mirror. Pairs naturally with the Wait-a-Week feature: tagged "want" + over threshold = auto-wait.

### 8. Comparative spending hints ("4 weeks of treats") (P1)
**Framework:** "Help children understand that life is all about tradeoffs."
**Sketch:** On any Spend withdrawal draft, app computes equivalents from the kid's own history: "$20 = 4 weeks of your usual treats" or "$20 = half of your Lego goal." Pulled from rolling 60-day averages per subcategory, not from generic data. The comparison must be in the kid's own units to land.

### 9. Lieber-amount allowance scheduler (P1)
**Framework:** "$0.50 to $1 per year of age, weekly, starting first grade."
**Sketch:** When a caretaker sets up a recurring allowance, suggest the Lieber band as a default ("Most families using Lieber's guide give $7–10/week at age 7") with a one-tap accept. Schedule to a chosen day and time (default Friday 6pm — pre-weekend so kid can spend Saturday). Auto-increment on birthday with a celebratory notification: "Mia turned 8 — allowance bumped from $7 to $8." Removes the #1 setup-friction point and quietly anchors families to research-backed amounts.

### 10. Gratitude micro-prompt on deposits over a threshold (P2)
**Framework:** Gratitude as the inoculation against materialism. Four-traits-of-spoiled includes "no gratitude."
**Sketch:** When a non-allowance deposit lands (birthday cash from Grandma, etc.), kid sees a one-screen prompt: "Grandma sent $25. Want to send her a thank-you?" One tap generates a pre-filled note the kid can edit, sent via the caretaker's preferred channel (text, email). Tracks % of gift deposits acknowledged. Tiny feature, large character work.

### 11. Family "money values" card (P2)
**Framework:** Money conversations as legacy/values transmission; "every conversation about money is also about values."
**Sketch:** Caretaker onboarding includes a 3-question setup: "What do we want our kids to feel about money? Pick 3 from: secure, generous, careful, free, fair, content." Selected values appear on a card at the top of the digest and on each kid's home ("Our family values: generous, content, careful"). When the kid uses Give, the "generous" card lights up. Visible reinforcement of explicit values.

### 12. Caretaker-funded APR with rate ceremony (already exists — proposed upgrade, P2)
**Framework:** Patience as a learnable virtue.
**Sketch:** v1 has APR. Upgrade: monthly "interest day" notification ("Mia earned $0.37 this month for waiting — that's a slice of pizza for doing nothing"). Optional caretaker rate-change moments at milestones ("you hit $50 saved — APR bumped from 5% to 8% on the next $50"). Turns a silent feature into a recurring teaching moment.

### 13. Quarterly family money meeting agenda (P2)
**Framework:** Lieber's case studies repeatedly feature recurring family money conversations.
**Sketch:** Once a quarter, app generates a 5-item meeting agenda PDF: spending category drift, savings goals on/off track, Give recipients to discuss, allowance review, one open question ("should we change our jar split?"). Caretaker can mark agenda items as discussed. Cheap, but it's the ritual scaffold most families never build themselves.

### 14. "First job" mode for older kids (P2)
**Framework:** "Let kids work. Employment outside the family teaches real-world accountability."
**Sketch:** For kids 13+, an optional mode that handles non-allowance income (babysitting, lawn-mowing) with: per-gig logging, tax-set-aside bucket (even at $0 owed — practice), and a higher Save default. Distinguishes earned-money psychology from gifted-money psychology — Lieber treats these as fundamentally different teaching surfaces.

## What v1 already nails (Lieber would approve)

- **Three-bucket model with configurable per-family split.** This is the literal book cover. Configurable percentages let families weight generosity-forward (e.g. 50/30/20 toward Give) which Lieber explicitly endorses.
- **Multi-funder attribution.** Grandma-money psychologically differs from earned-money. Separating them at the data layer enables the conversation Lieber wants ("how do you feel about gift money vs. allowance?").
- **Withdrawal request → caretaker approval flow.** Mirrors Lieber's "lots of occasions to make financial choices themselves" — the kid practices proposing, the caretaker practices honoring (not overriding) the choice.
- **Reconciliation / "check the jar."** Lieber's whole pedagogy assumes the money is visible and counted. Weekly reconciliation = the digital equivalent of pouring out the jar on the kitchen table.
- **Caretaker-funded APR.** Patience needs a payoff to be learnable. The APR feature makes Save concretely better than Spend over time — exactly what Lieber argues compounding does for adult savers.
- **Sunday digest.** This is the kitchen-table artifact. Lieber's case studies almost always feature a recurring conversation cadence; the digest gives families a forcing function.

## What v1 has wrong or risks getting wrong

- **No friction on Spend.** v1's per-deposit auto-split is elegant but the moment money lands in Spend, nothing slows the kid down before it leaves. Lieber's central claim is that *waiting* is where the lesson happens. Without Wait-a-Week or similar, the app could accelerate impulse spending by making it easier and prettier.
- **Give jar is structurally identical to Save.** Lieber treats Give as categorically different — it has its own ceremony (quarterly emptying), its own decision (which recipient), its own emotional payoff (the thank-you). If Give in v1 just sits there accumulating with no recipient picker, no match, no ritual, it becomes "Save 2" and the third leg of the stool collapses.
- **Audit-friendly transaction model risks adult-finance framing.** Soft-delete, void/adjustment, 30-day recovery are great for caretakers but could leak into the kid UI as accounting language. Lieber would push hard for the kid surface to feel like a jar, not a ledger. Worth auditing every label a kid sees against "would a 7-year-old say this word?"
- **Auto-distribution removes a teaching moment.** 60/20/20 on every deposit is correct as a default but the *act* of dividing the dollar is part of the lesson. Consider an optional "manual divide" mode that asks the kid to allocate each deposit themselves with the family default pre-selected. Lieber's families use physical jars precisely so the kid's hand does the work.
- **No way for caretakers to model their own behavior.** Lieber repeatedly notes that parental behavior (overspending on travel sports, secrecy about salary) is the loudest signal. No surface in v1 invites the caretaker to share their own Spend/Save/Give split. A "family view" where Mom's own monthly Give shows up next to Mia's would close this loop.
- **No materialism-counterweight content.** v1 measures dollars. Lieber's whole stack is values. At minimum the digest should occasionally name a non-dollar win: "Mia chose to walk away from a $30 toy at Target this weekend — that's worth noting."

## Demographic notes

- **Starting age: first grade (~6).** Lieber's recommended start point. v1 should have an explicit "Lieber-style first-grade starter" preset (small allowance, big visual jars, photos on Save goals, light Give amounts).
- **Allowance amounts: $0.50–$1 per year of age, weekly.** Onboarding should anchor on this band rather than asking caretakers to invent a number.
- **Multi-caretaker households are central.** Lieber's case studies include divorced parents, grandparent contributors, and step-parents. Multi-funder attribution is correctly central — extend it so funders can be invited with scoped permissions (Grandma can deposit but not approve withdrawals).
- **Religious/secular giving traditions vary widely.** Some families tithe (10% Give baseline), some give seasonally, some give only to specific cause types. The Give bucket needs both percentage presets *and* the ability to declare a recipient policy ("we give to humans, not animals" was a concrete example from the Dana Hirt Q&A).
- **Peer-pressure and social media gaps.** Critics note Lieber's book under-addresses teen peer dynamics and digital subscription bloat. CM Piggybank can fill this with the want-vs-need tagger and subscription tracking as differentiation, especially as users age up.
- **US-centric framing.** Currency, charity tax treatment, and allowance norms in the book are US. International onboarding should not assume USD or 501(c)(3) recipient categories.

---

Sources consulted:
- [ronlieber.com — The Opposite of Spoiled](https://ronlieber.com/books/the-opposite-of-spoiled/)
- [AFCPE review (2016)](https://www.afcpe.org/news-and-publications/the-standard/2016-1/the-opposite-of-spoiled-raising-kids-who-are-grounded-generous-and-smart-about-money/)
- [Meb Faber Episode 62 — Lieber interview](https://mebfaber.com/2017/07/19/episode-62-ron-lieber-not-right-kinds-conversations-kids-money/)
- [Dana Hirt Q&A with Ron Lieber](https://danahirtparenting.com/new-blog/2021/7/20/how-to-raise-generous-kids-a-qampa-with-nyt-columnist-ron-lieber)
- [Dinner: A Love Story — practitioner review](https://www.dinneralovestory.com/book-review-the-opposite-of-spoiled/)
- [Wealth of Happiness — critical review](https://www.wealthofhappiness.com/the-opposite-of-spoiled/)
- [Northstar FP review](https://northstarfp.com/blog/book-review-the-opposite-of-spoiled-by-ron-lieber)
- [Goodreads quotes](https://www.goodreads.com/work/quotes/41626047-the-opposite-of-spoiled-raising-kids-who-are-grounded-generous-and-sm)
- [Princeton Global — allowance breakdown](https://www.princetonglobal.com/the-opposite-of-spoiled-part-2-allowance/)
- [CNBC — Lieber's radical money lessons](https://www.cnbc.com/2015/02/24/ron-lieber-offers-radical-money-lessons-for-kids.html)
