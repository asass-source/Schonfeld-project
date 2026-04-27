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
| **What feedback did a specific pod give on last summer's interns?** | A list of every intern who rotated through that pod last summer, scores, summaries, and pod-debrief citations. Try the Atlas, Helios, or Apex pods. |
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
├── data.js         # Mock dataset: 28 candidates, 5 pods, 13 schools, 25 source documents
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
- `Show me Atlas pod intern feedback`
- `Which schools have the highest accept rates?`
- `Why do strong technical candidates decline our offers?`
- `Find candidates like a Princeton ORFE student interested in fundamental equities`
- `Have we spoken with Nico Alvarez before?`
- `What did the Helios pod say about last summer's interns?`

---

*Built as a take-home demo for a Schonfeld campus-recruiting conversation. All names, scores, and feedback are fictional.*
