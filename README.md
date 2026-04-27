# Schonfeld Recruiting Assistant — Demo

A working sketch of an internal AI assistant that turns Schonfeld's recruiting history — interview notes, pod debriefs, ATS records, Slack threads, decline conversations — into something the recruiting team can actually query.

> **This is a mock.** No real data, no real candidates, no backend. It's a self-contained static demo built to make the idea tangible in a 5-minute conversation.

---

## The problem

Every recruiting cycle generates a huge amount of valuable information, but it ends up scattered across:

- Greenhouse / the ATS
- Pod debrief docs
- Recruiter inboxes
- `#recruiting` Slack channels
- Individual team members' memories

When a recruiter asks "have we spoken to this candidate before?" or "which schools have had the highest yield over three years?", the answer usually requires asking around or digging through old files.

## The idea

A private, secure assistant that knows Schonfeld's recruiting history. Recruiters ask questions the way they would ask a colleague. The assistant pulls together a clear answer in seconds, **with the underlying source documents cited** so anything sensitive can be verified by hand.

## What this demo shows

The demo answers the five canonical example questions from the brief, each with cited "sources":

| Question | What you'll see |
|---|---|
| **Have we interviewed this candidate before?** | A candidate card showing every prior cycle, the pod, score, summary, and decline reason if applicable. Try `Sahil Bhattacharya` (two cycles) or `Nico Alvarez` (returning candidate from 2023). |
| **What feedback did a specific pod give on last summer's interns?** | A list of every intern who rotated through that pod last summer, scores, summaries, and pod-debrief citations. Try the Fundamental Equity, Quantitative, or Tactical Trading pods. |
| **Which schools have had the highest offer-to-acceptance rates?** | A sortable stats table across the past three cycles. |
| **What are the most common reasons strong technical candidates decline our offers?** | Decline reasons grouped into themes (research culture, training program, comp, geography) with the underlying exit-conversation notes. |
| **Find past candidates whose backgrounds look similar.** | A simple similarity ranker over school, major, and pod fit. |

Plus a fallback "generic" response for unrecognized queries that explains how a real deployment would handle them.

## How to run

It's a static site. No build step, no install.

```bash
# Option 1: just open the file
open index.html       # macOS
xdg-open index.html   # Linux

# Option 2: serve it locally (better for some browsers)
python3 -m http.server 8080
# then visit http://localhost:8080
```

Or push to GitHub Pages (Settings → Pages → Deploy from `main`) and share the URL.

## What's in the repo

```
.
├── index.html      # Layout: topbar, sidebar of suggested questions, chat, composer
├── styles.css      # Visual style — clean, navy-and-warm-accents, professional
├── app.js          # Query routing + answer renderers (with citations)
├── data.js         # Mock dataset: 28 candidates, 4 strategy pods (Schonfeld's public structure), 13 schools, 25 source documents
└── README.md       # You are here
```

## How it works under the hood

The query layer is intentionally simple — keyword + entity matching — so the demo runs entirely in the browser with zero dependencies. In a real deployment, this layer would be:

1. **Retrieval** — search the firm's recruiting corpus (ATS, pod debriefs, interview notes, Slack, exit conversations) for the most relevant chunks.
2. **Synthesis** — an LLM stitches the retrieved chunks into a 3-sentence answer.
3. **Citation** — every claim links back to the source document so anything sensitive can be verified.
4. **Permissioning** — recruiters only see what their role allows; PII handled per the firm's data policy.

The data shape in `data.js` is structured the way a real ingestion pipeline would store it: candidates linked to cycles, cycles linked to pods and source documents, sources tagged by type (Interview Note, Pod Debrief, ATS Record, Slack Thread, Decline Note).

## Why this matters

- **Speed.** Less time hunting through files, more time talking to candidates.
- **Consistency.** New and tenured recruiters share the same institutional memory.
- **Better candidate experience.** Knowing a candidate's history makes every conversation feel personal.
- **Smarter pod matching.** Surface candidates who fit what a specific pod is looking for, faster.
- **Faster onboarding.** A new recruiter can ramp in days instead of months.

## Try these prompts

Click any suggested question on the left, or type:

- `Have we interviewed Sahil Bhattacharya before?`
- `Show me Fundamental Equity pod intern feedback`
- `Which schools have the highest accept rates?`
- `Why do strong technical candidates decline our offers?`
- `Find candidates like a Princeton ORFE student interested in fundamental equities`
- `Have we spoken with Nico Alvarez before?`
- `What did the Quantitative pod say about last summer's interns?`

## What you'll notice in the demo

Beyond the chat itself, three details are worth pointing out — they reflect choices a real deployment would need to make:

- **Reasoning trace.** Every answer has a "How I found this answer" panel — click it to see the retrieval/synthesis steps. Trust depends on showing your work, not on a confident tone.
- **Proactive insights.** The sidebar surfaces things the recruiter didn't ask for ("Princeton ORFE converting at 100%," "research-culture theme in quant declines"). The product gets more valuable when it volunteers patterns.
- **Privacy &amp; deployment.** A small panel summarizes how this would actually live inside Schonfeld's network — VPC-isolated, self-hosted models, role-based access, full audit log, source-cited only.

## Roadmap — what would come next

If this got real funding, here's how I'd phase it.

### Phase 1 — Foundation (weeks 1–6)

Goal: replace "asking around" with "asking the assistant," for read-only lookups.

- **Ingestion connectors** for Greenhouse (or whichever ATS), Google Drive / SharePoint pod-debrief docs, and `#recruiting` Slack channels.
- **Chunking + embedding pipeline** with a re-indexing job that runs nightly.
- **Hybrid retrieval** (BM25 + vector) over the recruiting corpus.
- **Citation-first synthesis** — every claim links to a source chunk; the assistant declines to answer when retrieval confidence is low.
- **Role-based access control** wired to the firm's existing IAM (Okta / AD).
- **Audit log** of every query and document accessed.

Success metric: 75% of the recruiter team's "have we seen this person?" / "what did we say about X?" questions answered without manual lookup.

### Phase 2 — Pattern surfacing (weeks 6–14)

Goal: from lookup tool to thinking partner.

- **Cohort analytics** — yield by school, pod, role, year. Anomaly detection on year-over-year shifts.
- **Decline-theme clustering** — automatic theme extraction from exit conversations. Surface emerging concerns to recruiting leadership before they become trends.
- **Pod-fit similarity** — vector search over candidate profiles + interview transcripts. "Find candidates who looked like our 2024 Fundamental Equity hires."
- **Pipeline dashboards** — funnel-stage view, time-to-offer, acceptance latency.
- **Proactive notifications** — *"Heads up: this candidate declined an offer in 2023 (reason: comp). Worth flagging in the call."*

Success metric: recruiting leadership uses the dashboard in their weekly meeting; one pre-emptive intervention per cycle from a surfaced trend.

### Phase 3 — Workflow integration (weeks 14–24)

Goal: stop being a separate tab.

- **Slack bot** — recruiters query the assistant from inside their normal workflow. Auto-summarized candidate cards posted before pod intro calls.
- **Greenhouse plugin** — assistant context appears inline on every candidate page.
- **Pre-interview briefing docs** — auto-generated 1-pager for the interviewer: prior touchpoints, school yield context, similar past hires, suggested questions tied to the candidate's background.
- **Post-interview structured capture** — the assistant prompts interviewers for the specific dimensions the firm cares about, instead of free-form notes that are hard to query.
- **Outcome tracking** — close the loop on which candidates the assistant flagged early vs. how they performed in the seat. The corpus gets smarter as outcomes feed back in.

Success metric: 40% reduction in time spent on candidate-research tasks; new recruiter ramp-up time cut from months to weeks.

### What I would *not* do

- **No external API calls.** Everything inference-related runs inside the firm's perimeter. Recruiting data is too sensitive.
- **No chatty fluff.** The assistant should answer the question or say it doesn't know — never fabricate.
- **No replacement of human judgment.** Hiring decisions stay with people. The assistant compresses search and surfaces patterns; it doesn't rank candidates for offers.

---

*Built as a take-home demo for a Schonfeld campus-recruiting conversation. All names, scores, and feedback are fictional.*
