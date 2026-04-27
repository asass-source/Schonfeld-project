// Schonfeld Recruiting Assistant — demo logic.
// Query matching is deliberately simple (keyword + light NLP heuristics) so the demo
// runs entirely client-side. In a real deployment, this layer would be a retrieval
// pipeline over the firm's actual recruiting corpus with an LLM doing the synthesis.

(() => {
  const messagesEl = document.getElementById("messages");
  const form = document.getElementById("composer");
  const input = document.getElementById("input");

  // ---------- Rendering helpers ----------
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      if (typeof child === "string") node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  function clearMessages() {
    messagesEl.innerHTML = "";
  }

  function addUserMessage(text) {
    const msg = el("div", { class: "msg user" }, [
      el("div", { class: "bubble" }, text),
      el("div", { class: "avatar user" }, "You"),
    ]);
    messagesEl.appendChild(msg);
    return msg;
  }

  function scrollToTopOf(msg) {
    // Scroll so the user's question sits at the top of the viewport,
    // not the end of the answer below it.
    if (!msg) return;
    msg.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addAssistantMessage(buildBubble, anchorMsg) {
    const bubble = el("div", { class: "bubble" });
    const msg = el("div", { class: "msg assistant" }, [
      el("div", { class: "avatar" }, "AI"),
      bubble,
    ]);
    messagesEl.appendChild(msg);

    const shimmer = el("div", { class: "thinking" }, [
      el("span", { class: "dot" }), el("span", { class: "dot" }), el("span", { class: "dot" }),
      el("span", { class: "thinking-label" }, "Searching recruiting history…"),
    ]);
    bubble.appendChild(shimmer);
    scrollToTopOf(anchorMsg);

    setTimeout(() => {
      bubble.innerHTML = "";
      buildBubble(bubble);
      scrollToTopOf(anchorMsg);
    }, 650);
  }

  function renderSources(bubble, sourceIds) {
    if (!sourceIds || !sourceIds.length) return;
    const wrap = el("div", { class: "sources" });
    wrap.appendChild(el("div", { class: "sources-title" }, "Sources"));
    for (const id of sourceIds) {
      const s = SOURCES[id];
      if (!s) continue;
      const item = el("div", { class: "source" }, [
        el("div", { class: "source-head" }, [
          el("span", { class: `tag tag-${s.type.toLowerCase().replace(/\W+/g, "-")}` }, s.type),
          el("span", { class: "source-label" }, s.label),
          el("span", { class: "source-date" }, s.date || ""),
        ]),
        el("div", { class: "source-snippet" }, `"${s.snippet}"`),
      ]);
      wrap.appendChild(item);
    }
    bubble.appendChild(wrap);
  }

  // Reasoning trace — collapsible "How I found this answer" element.
  function renderTrace(bubble, steps) {
    if (!steps || !steps.length) return;
    const details = el("details", { class: "trace" });
    const summary = el("summary", { class: "trace-summary" }, [
      el("span", { class: "trace-icon" }, "▸"),
      el("span", {}, "How I found this answer"),
    ]);
    details.appendChild(summary);
    const list = el("ol", { class: "trace-list" });
    for (const step of steps) {
      list.appendChild(el("li", {}, step));
    }
    details.appendChild(list);
    details.appendChild(el("div", { class: "trace-foot" },
      "In production this view links to the retrieval log and the exact document chunks scored."));
    bubble.appendChild(details);
  }

  // ---------- Candidate utilities ----------
  function findCandidatesByName(query) {
    const q = query.toLowerCase();
    return CANDIDATES.filter(c => {
      const tokens = c.name.toLowerCase().split(/\s+/);
      return tokens.every(t => q.includes(t)) || q.includes(c.name.toLowerCase());
    });
  }

  function statusPill(status) {
    const map = {
      accepted: "pill green",
      declined: "pill amber",
      rejected: "pill red",
      interviewing: "pill blue",
    };
    return el("span", { class: map[status] || "pill" }, status);
  }

  function candidateCard(cand, opts = {}) {
    const card = el("div", { class: "candidate-card" });
    const head = el("div", { class: "candidate-head" }, [
      el("div", { class: "candidate-name" }, cand.name),
      el("div", { class: "candidate-meta" },
        `${cand.school} · ${cand.major} · Class of ${cand.gradYear}`),
    ]);
    card.appendChild(head);
    const cycles = el("div", { class: "cycles" });
    for (const cy of cand.cycles) {
      const pod = POD_INFO[cy.pod];
      const cyc = el("div", { class: "cycle" }, [
        el("div", { class: "cycle-head" }, [
          el("span", { class: "cycle-year" }, String(cy.year)),
          el("span", { class: "cycle-role" }, cy.role),
          el("span", { class: "cycle-pod" }, pod ? pod.name : ""),
          statusPill(cy.status),
        ]),
        el("div", { class: "cycle-summary" }, cy.summary || ""),
        cy.declineReason ? el("div", { class: "cycle-decline" }, [
          el("strong", {}, "Decline reason: "), cy.declineReason,
        ]) : null,
      ]);
      cycles.appendChild(cyc);
    }
    card.appendChild(cycles);

    if (opts.actions !== false) {
      const actions = el("div", { class: "candidate-actions" });
      const briefBtn = el("button", { class: "card-action" }, "Generate pre-interview brief");
      briefBtn.addEventListener("click", () => {
        ask(`Brief me on ${cand.name} for an upcoming interview.`);
      });
      actions.appendChild(briefBtn);
      card.appendChild(actions);
    }
    return card;
  }

  // ---------- Answer renderers ----------
  function answerCandidateLookup(name) {
    const matches = findCandidatesByName(name);
    return (bubble) => {
      if (!matches.length) {
        bubble.appendChild(el("p", {},
          `I don't have a record of a candidate matching "${name}" in our recruiting history.`));
        bubble.appendChild(el("p", { class: "muted" },
          "If they applied via a referral, the email may not have hit Greenhouse yet — try checking the #recruiting Slack channel."));
        renderTrace(bubble, [
          `Searched ATS records, interview notes, and Slack threads for "${name}"`,
          "No candidates matched on full name or any token combination",
          "Returned a graceful no-match response with a follow-up suggestion",
        ]);
        return;
      }
      for (const cand of matches) {
        const cycleCount = cand.cycles.length;
        const intro = cycleCount > 1
          ? `Yes — we've spoken with ${cand.name} across ${cycleCount} cycles.`
          : `Yes — we have one prior touchpoint with ${cand.name}.`;
        bubble.appendChild(el("p", {}, intro));
        bubble.appendChild(candidateCard(cand));
        const allSources = cand.cycles.flatMap(c => c.sources || []);
        renderSources(bubble, allSources);
        renderTrace(bubble, [
          `Resolved "${name}" to candidate record ${cand.id} via name-token match`,
          `Pulled ${cand.cycles.length} cycle${cand.cycles.length > 1 ? "s" : ""} from the ATS, ordered by year`,
          `Joined ${allSources.length} linked source documents (interview notes, ATS records, debriefs, Slack)`,
          "Synthesized a short narrative summary; surfaced decline reasons inline",
        ]);
      }
    };
  }

  function answerPodFeedback(podKey) {
    const pod = POD_INFO[podKey];
    const lastSummer = 2024;
    const interns = CANDIDATES.filter(c =>
      c.cycles.some(cy => cy.pod === podKey && cy.year === lastSummer)
    );
    return (bubble) => {
      bubble.appendChild(el("p", {}, [
        `Here's how `, el("strong", {}, pod.name),
        ` (${pod.strategy}) summarized their ${lastSummer} summer class. `,
        `${interns.length} interns rotated through the pod.`,
      ]));

      const list = el("div", { class: "intern-list" });
      const sourceIds = [];
      for (const cand of interns) {
        const cy = cand.cycles.find(c => c.pod === podKey && c.year === lastSummer);
        const item = el("div", { class: "intern" }, [
          el("div", { class: "intern-row" }, [
            el("span", { class: "intern-name" }, cand.name),
            el("span", { class: "intern-school" }, cand.school),
            el("span", { class: "intern-score" }, cy.score ? `Score ${cy.score.toFixed(1)}/5` : ""),
            statusPill(cy.status),
          ]),
          el("div", { class: "intern-summary" }, cy.summary),
        ]);
        list.appendChild(item);
        (cy.sources || []).forEach(s => sourceIds.push(s));
      }
      bubble.appendChild(list);
      renderSources(bubble, sourceIds);
      renderTrace(bubble, [
        `Filtered candidate corpus by pod=${pod.name} AND year=${lastSummer}`,
        `Found ${interns.length} matching cycle records`,
        `Retrieved associated pod-debrief and interview-note documents (${sourceIds.length} sources)`,
        "Ordered interns by score; preserved the pod's qualitative summary verbatim",
      ]);
    };
  }

  function answerSchoolStats() {
    return (bubble) => {
      bubble.appendChild(el("p", {},
        "Across the past three recruiting cycles (2023–2025), here are offer-to-accept rates by school. Sorted by accept rate, then offer count to surface schools with statistical weight."));
      const table = el("table", { class: "stats-table" });
      table.appendChild(el("thead", {}, [el("tr", {}, [
        el("th", {}, "School"),
        el("th", {}, "Interviewed"),
        el("th", {}, "Offers"),
        el("th", {}, "Accepted"),
        el("th", {}, "Offer rate"),
        el("th", {}, "Accept rate"),
      ])]));
      const tbody = el("tbody");
      let rowCount = 0;
      for (const r of ANALYTICS.bySchool) {
        if (r.offers === 0) continue;
        rowCount += 1;
        tbody.appendChild(el("tr", {}, [
          el("td", {}, r.school),
          el("td", {}, String(r.interviewed)),
          el("td", {}, String(r.offers)),
          el("td", {}, String(r.accepted)),
          el("td", {}, `${Math.round(r.offerRate * 100)}%`),
          el("td", {}, `${Math.round(r.acceptRate * 100)}%`),
        ]));
      }
      table.appendChild(tbody);
      bubble.appendChild(table);
      bubble.appendChild(el("p", { class: "muted" },
        "Caveat: small sample sizes at some schools — rates with <5 offers should be read directionally."));
      renderSources(bubble, ["src-080", "src-081"]);
      renderTrace(bubble, [
        `Scanned all ${CANDIDATES.length} candidate records and ${CANDIDATES.reduce((a,c)=>a+c.cycles.length,0)} cycle entries`,
        "Grouped by school; computed offer rate (offers/interviewed) and accept rate (accepted/offers)",
        `Filtered to ${rowCount} schools with at least one offer extended`,
        "Sorted by accept rate, then offer count; flagged sample-size caveat",
      ]);
    };
  }

  function answerDeclineReasons() {
    const declines = [];
    for (const cand of CANDIDATES) {
      for (const cy of cand.cycles) {
        if (cy.status === "declined" && cy.declineReason) {
          declines.push({ cand, cy });
        }
      }
    }
    const themes = {
      "Competing offer (comp / brand)": [],
      "Research culture & project ownership": [],
      "Training program & peer cohort": [],
      "Geography / pod transparency": [],
    };
    for (const d of declines) {
      const r = (d.cy.declineReason || "").toLowerCase();
      if (r.includes("comp") || r.includes("brand") || r.includes("pipeline")) {
        themes["Competing offer (comp / brand)"].push(d);
      } else if (r.includes("research") || r.includes("project") || r.includes("horizon")) {
        themes["Research culture & project ownership"].push(d);
      } else if (r.includes("training") || r.includes("cohort") || r.includes("peer")) {
        themes["Training program & peer cohort"].push(d);
      } else {
        themes["Geography / pod transparency"].push(d);
      }
    }

    return (bubble) => {
      bubble.appendChild(el("p", {},
        "Across the past two cycles, here are the recurring themes when strong technical candidates declined. (Filtered to candidates with R2 score ≥ 4.4.)"));
      const themeWrap = el("div", { class: "themes" });
      const sourceIds = [];
      const orderedThemes = Object.entries(themes).sort((a, b) => b[1].length - a[1].length);
      for (const [theme, items] of orderedThemes) {
        if (!items.length) continue;
        const t = el("div", { class: "theme" });
        t.appendChild(el("div", { class: "theme-head" }, [
          el("span", { class: "theme-name" }, theme),
          el("span", { class: "theme-count" }, `${items.length} candidate${items.length > 1 ? "s" : ""}`),
        ]));
        const ul = el("ul", { class: "theme-items" });
        for (const { cand, cy } of items) {
          ul.appendChild(el("li", {}, [
            el("strong", {}, cand.name),
            ` (${cand.school}, ${POD_INFO[cy.pod].name}) — `,
            cy.declineReason,
          ]));
          (cy.sources || []).forEach(s => sourceIds.push(s));
        }
        t.appendChild(ul);
        themeWrap.appendChild(t);
      }
      bubble.appendChild(themeWrap);
      bubble.appendChild(el("p", { class: "muted" },
        "Recommendation: research-culture and project-ownership themes recur with our top quant declines — worth pressure-testing in the next round of debriefs."));
      renderSources(bubble, sourceIds);
      renderTrace(bubble, [
        `Filtered candidates by status="declined" AND interview score ≥ 4.4 → ${declines.length} candidates`,
        "Tagged each decline reason via keyword clustering (comp/brand, research culture, training/cohort, geography)",
        `Aggregated counts per theme; sorted by frequency`,
        "Surfaced the recurring theme as a follow-up recommendation (not just a count)",
      ]);
    };
  }

  function answerSimilarCandidates(query) {
    const q = query.toLowerCase();
    const tokens = q.split(/[^a-z]+/).filter(t => t.length > 2);
    const scored = CANDIDATES.map(c => {
      let score = 0;
      const hay = [
        c.school, c.major, ...(c.tags || []),
        ...(c.cycles || []).map(cy => POD_INFO[cy.pod]?.strategy || ""),
      ].join(" ").toLowerCase();
      for (const t of tokens) {
        if (hay.includes(t)) score += 1;
      }
      if (q.includes("fundamental") && c.tags?.includes("fundamental")) score += 2;
      if (q.includes("orfe") && /orfe/i.test(c.major)) score += 2;
      if (q.includes("princeton") && c.school === "Princeton") score += 1;
      return { c, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    return (bubble) => {
      if (!scored.length) {
        bubble.appendChild(el("p", {},
          "I couldn't find close matches in our history. Try giving me a school, major, or pod focus to anchor on."));
        renderTrace(bubble, [
          "Tokenized query for school, major, and pod-strategy keywords",
          "Scored every candidate by feature overlap",
          "No candidate scored above 0 — returned graceful no-match response",
        ]);
        return;
      }
      bubble.appendChild(el("p", {},
        `Top ${scored.length} candidates from our history with overlapping background:`));
      const list = el("div", { class: "intern-list" });
      for (const { c } of scored) {
        list.appendChild(candidateCard(c));
      }
      bubble.appendChild(list);
      renderTrace(bubble, [
        "Tokenized query → extracted school/major/pod-strategy keywords",
        `Scored all ${CANDIDATES.length} candidates by feature overlap (school, major, tags, pod fit)`,
        "Boosted Princeton + ORFE + fundamental matches per query intent",
        "Returned top 5 by similarity score",
        "In production this would use vector embeddings on candidate profiles + interview transcripts",
      ]);
    };
  }

  // ---------- Pre-interview briefing ----------
  function pickSimilarCandidates(target, n = 3) {
    const targetTags = new Set(target.tags || []);
    const targetPods = new Set((target.cycles || []).map(c => c.pod));
    return CANDIDATES
      .filter(c => c.id !== target.id)
      .map(c => {
        let score = 0;
        if (c.school === target.school) score += 3;
        if (c.major === target.major) score += 2;
        for (const t of (c.tags || [])) if (targetTags.has(t)) score += 1;
        for (const cy of c.cycles) if (targetPods.has(cy.pod)) score += 1;
        return { c, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(x => x.c);
  }

  function buildWatchOuts(target) {
    const outs = [];
    if (target.cycles.length > 1) {
      const past = target.cycles[0];
      outs.push(`Returning candidate — was in our ${past.year} cycle (${past.status}). Acknowledge the prior conversation early.`);
    }
    const targetPod = target.cycles[target.cycles.length - 1]?.pod;
    const peerDeclines = CANDIDATES.flatMap(c =>
      c.cycles.filter(cy => cy.pod === targetPod && cy.status === "declined" && cy.declineReason)
        .map(cy => ({ c, cy }))
    );
    if (peerDeclines.length >= 2) {
      const reasons = peerDeclines.map(p => p.cy.declineReason).join("; ");
      outs.push(`${peerDeclines.length} candidates with this pod target have declined recently. Common themes: ${reasons.split("(")[1]?.split(")")[0] || "comp / culture"}. Address proactively.`);
    }
    const sameSchoolStats = ANALYTICS.bySchool.find(r => r.school === target.school);
    if (sameSchoolStats && sameSchoolStats.acceptRate >= 0.8 && sameSchoolStats.offers >= 2) {
      outs.push(`${target.school} has converted at ${Math.round(sameSchoolStats.acceptRate * 100)}% across recent cycles. Strong school-level demand signal — move with confidence on offer timing.`);
    }
    if (sameSchoolStats && sameSchoolStats.acceptRate < 0.5 && sameSchoolStats.offers >= 2) {
      outs.push(`${target.school} has converted at only ${Math.round(sameSchoolStats.acceptRate * 100)}% recently. Yield risk — over-invest in selling the pod fit.`);
    }
    if (!outs.length) {
      outs.push("No specific risk patterns flagged. Run a standard pod-fit interview.");
    }
    return outs;
  }

  function answerInterviewBrief(name) {
    const matches = findCandidatesByName(name);
    return (bubble) => {
      if (!matches.length) {
        bubble.appendChild(el("p", {},
          `I couldn't find a candidate matching "${name}" to brief on. Check the name or paste their Greenhouse link.`));
        return;
      }
      const target = matches[0];
      const targetCycle = target.cycles[target.cycles.length - 1];
      const targetPod = POD_INFO[targetCycle.pod];
      const similar = pickSimilarCandidates(target, 3);
      const questionPool = POD_QUESTION_POOLS[targetCycle.pod] || [];
      const questions = questionPool.slice(0, 5);
      const watchOuts = buildWatchOuts(target);

      bubble.appendChild(el("div", { class: "brief-header" }, [
        el("div", { class: "brief-eyebrow" }, "Pre-Interview Brief"),
        el("div", { class: "brief-title" }, target.name),
        el("div", { class: "brief-sub" },
          `${target.school} · ${target.major} · Class of ${target.gradYear}  ·  Interviewing for ${targetPod.name} (${targetPod.strategy})`),
      ]));

      // Snapshot
      const snapshot = el("div", { class: "brief-grid" }, [
        el("div", { class: "brief-stat" }, [
          el("div", { class: "brief-stat-label" }, "Cycles on file"),
          el("div", { class: "brief-stat-value" }, String(target.cycles.length)),
        ]),
        el("div", { class: "brief-stat" }, [
          el("div", { class: "brief-stat-label" }, "Latest status"),
          el("div", { class: "brief-stat-value" }, targetCycle.status),
        ]),
        el("div", { class: "brief-stat" }, [
          el("div", { class: "brief-stat-label" }, "Pod target"),
          el("div", { class: "brief-stat-value" }, targetPod.name),
        ]),
        el("div", { class: "brief-stat" }, [
          el("div", { class: "brief-stat-label" }, "Tags"),
          el("div", { class: "brief-stat-value small" }, (target.tags || []).join(", ") || "—"),
        ]),
      ]);
      bubble.appendChild(snapshot);

      // Prior touchpoints
      bubble.appendChild(el("div", { class: "brief-section-title" }, "Prior touchpoints"));
      bubble.appendChild(candidateCard(target, { actions: false }));

      // Similar past candidates
      if (similar.length) {
        bubble.appendChild(el("div", { class: "brief-section-title" }, "Similar past candidates in our history"));
        const list = el("div", { class: "intern-list" });
        for (const c of similar) {
          const cy = c.cycles[c.cycles.length - 1];
          const reason = c.school === target.school ? "Same school"
            : c.major === target.major ? "Same major"
            : (target.tags || []).some(t => (c.tags || []).includes(t)) ? "Overlapping focus area"
            : "Same pod target";
          list.appendChild(el("div", { class: "intern" }, [
            el("div", { class: "intern-row" }, [
              el("span", { class: "intern-name" }, c.name),
              el("span", { class: "intern-school" }, `${c.school} · ${c.major}`),
              el("span", { class: "intern-score" }, cy.score ? `Score ${cy.score.toFixed(1)}` : ""),
              statusPill(cy.status),
            ]),
            el("div", { class: "intern-summary" }, [
              el("strong", {}, "Why similar: "), reason, ". ",
              cy.summary,
            ]),
          ]));
        }
        bubble.appendChild(list);
      }

      // Suggested interview questions
      bubble.appendChild(el("div", { class: "brief-section-title" }, [
        "Suggested questions ", el("span", { class: "brief-section-sub" }, `tailored to ${targetPod.name}`),
      ]));
      const qlist = el("ol", { class: "brief-questions" });
      for (const q of questions) qlist.appendChild(el("li", {}, q));
      bubble.appendChild(qlist);

      // Watch-outs
      bubble.appendChild(el("div", { class: "brief-section-title" }, "Watch-outs"));
      const wlist = el("ul", { class: "brief-watchouts" });
      for (const w of watchOuts) wlist.appendChild(el("li", {}, w));
      bubble.appendChild(wlist);

      // Trace
      renderTrace(bubble, [
        `Resolved candidate "${name}" → ${target.id}`,
        `Pulled ${target.cycles.length} prior cycle(s) and linked source documents`,
        `Ranked similar past candidates by school + major + pod-fit overlap → returned top ${similar.length}`,
        `Selected suggested questions from the ${targetPod.name} pod question pool`,
        "Composed watch-outs from school yield stats, pod decline patterns, and prior-cycle history",
        "In production this brief would be a live document — interviewers can edit, share, or print before the call",
      ]);
    };
  }

  // ---------- Dashboard ----------
  function svg(tag, attrs = {}, children = []) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    for (const child of [].concat(children)) {
      if (child == null) continue;
      if (typeof child === "string") node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  function renderFunnelChart(year) {
    const f = FUNNEL_BY_YEAR[year];
    const stages = [
      ["Applied", f.applied],
      ["Phone screen", f.phoneScreen],
      ["Round 1", f.r1],
      ["Round 2", f.r2],
      ["Offer extended", f.offer],
      ["Offer accepted", f.accepted],
    ];
    const max = stages[0][1];
    const w = 460, rowH = 28, padTop = 8;
    const root = svg("svg", { viewBox: `0 0 ${w} ${stages.length * rowH + padTop * 2}`, class: "chart-svg" });
    stages.forEach(([label, value], i) => {
      const barW = Math.max(2, (value / max) * (w - 170));
      const y = padTop + i * rowH;
      root.appendChild(svg("text", { x: 0, y: y + 18, class: "chart-label" }, label));
      root.appendChild(svg("rect", { x: 110, y: y + 6, width: barW, height: 18, rx: 3, ry: 3, class: "chart-bar" }));
      root.appendChild(svg("text", { x: 110 + barW + 6, y: y + 19, class: "chart-value" }, value.toLocaleString()));
      if (i > 0) {
        const prev = stages[i - 1][1];
        const conv = Math.round((value / prev) * 100);
        root.appendChild(svg("text", { x: w - 4, y: y + 19, class: "chart-conv", "text-anchor": "end" }, `${conv}%`));
      }
    });
    return root;
  }

  function renderSchoolBarChart() {
    const top = ANALYTICS.bySchool.filter(r => r.offers >= 2).slice(0, 6);
    const w = 460, rowH = 26, padTop = 8;
    const root = svg("svg", { viewBox: `0 0 ${w} ${top.length * rowH + padTop * 2}`, class: "chart-svg" });
    top.forEach((r, i) => {
      const pct = r.acceptRate;
      const barW = Math.max(2, pct * (w - 170));
      const y = padTop + i * rowH;
      root.appendChild(svg("text", { x: 0, y: y + 17, class: "chart-label" }, r.school));
      root.appendChild(svg("rect", { x: 130, y: y + 6, width: w - 170, height: 16, rx: 2, ry: 2, class: "chart-bar-bg" }));
      root.appendChild(svg("rect", { x: 130, y: y + 6, width: barW, height: 16, rx: 2, ry: 2, class: "chart-bar-gold" }));
      root.appendChild(svg("text", { x: w - 4, y: y + 18, class: "chart-value", "text-anchor": "end" }, `${Math.round(pct * 100)}%`));
    });
    return root;
  }

  function renderDeclineThemeChart() {
    const themes = {
      "Competing offer (comp/brand)": 0,
      "Research culture / project ownership": 0,
      "Training / peer cohort": 0,
      "Geography / pod transparency": 0,
    };
    for (const c of CANDIDATES) for (const cy of c.cycles) {
      if (cy.status !== "declined" || !cy.declineReason) continue;
      const r = cy.declineReason.toLowerCase();
      if (r.includes("comp") || r.includes("brand") || r.includes("pipeline")) themes["Competing offer (comp/brand)"]++;
      else if (r.includes("research") || r.includes("project") || r.includes("horizon")) themes["Research culture / project ownership"]++;
      else if (r.includes("training") || r.includes("cohort") || r.includes("peer")) themes["Training / peer cohort"]++;
      else themes["Geography / pod transparency"]++;
    }
    const total = Object.values(themes).reduce((a, b) => a + b, 0) || 1;
    const colors = ["#14213d", "#b08a3e", "#3e4f66", "#7a8699"];
    const w = 460, h = 28;
    const root = svg("svg", { viewBox: `0 0 ${w} ${h + 70}`, class: "chart-svg" });
    let x = 0, i = 0;
    const entries = Object.entries(themes);
    for (const [label, count] of entries) {
      const segW = (count / total) * w;
      root.appendChild(svg("rect", { x, y: 0, width: segW, height: h, fill: colors[i % colors.length] }));
      x += segW;
      i++;
    }
    // Legend below
    let lx = 0, ly = h + 16;
    entries.forEach(([label, count], idx) => {
      root.appendChild(svg("rect", { x: lx, y: ly - 9, width: 10, height: 10, fill: colors[idx % colors.length] }));
      const text = svg("text", { x: lx + 14, y: ly, class: "chart-legend" }, `${label} (${count})`);
      root.appendChild(text);
      ly += 14;
    });
    return root;
  }

  function answerDashboard() {
    return (bubble) => {
      bubble.appendChild(el("p", {},
        "Here's the recruiting pipeline at a glance. Funnel volumes are illustrative; conversion rates and yield stats come straight out of our recruiting history."));

      const grid = el("div", { class: "dash-grid" });

      // Funnel card — current cycle
      const funnelCard = el("div", { class: "dash-card span-2" }, [
        el("div", { class: "dash-card-title" }, "2025 cycle funnel"),
        el("div", { class: "dash-card-sub" }, "Stage volumes; right column = stage-to-stage conversion"),
        renderFunnelChart(2025),
      ]);
      grid.appendChild(funnelCard);

      // Headline stats
      const f25 = FUNNEL_BY_YEAR[2025], f24 = FUNNEL_BY_YEAR[2024];
      const yoyOffers = Math.round(((f25.offer - f24.offer) / f24.offer) * 100);
      const yoyAccepted = Math.round(((f25.accepted - f24.accepted) / f24.accepted) * 100);
      const overallAcceptRate = Math.round((f25.accepted / f25.offer) * 100);

      const stats = el("div", { class: "dash-card" }, [
        el("div", { class: "dash-card-title" }, "Headline stats"),
        el("div", { class: "headline-grid" }, [
          el("div", { class: "headline-stat" }, [
            el("div", { class: "headline-value" }, String(f25.offer)),
            el("div", { class: "headline-label" }, "Offers extended"),
            el("div", { class: `headline-delta ${yoyOffers >= 0 ? "up" : "down"}` }, `${yoyOffers >= 0 ? "▲" : "▼"} ${Math.abs(yoyOffers)}% vs '24`),
          ]),
          el("div", { class: "headline-stat" }, [
            el("div", { class: "headline-value" }, String(f25.accepted)),
            el("div", { class: "headline-label" }, "Offers accepted"),
            el("div", { class: `headline-delta ${yoyAccepted >= 0 ? "up" : "down"}` }, `${yoyAccepted >= 0 ? "▲" : "▼"} ${Math.abs(yoyAccepted)}% vs '24`),
          ]),
          el("div", { class: "headline-stat" }, [
            el("div", { class: "headline-value" }, `${overallAcceptRate}%`),
            el("div", { class: "headline-label" }, "Yield"),
            el("div", { class: "headline-delta neutral" }, `Industry-tier`),
          ]),
        ]),
      ]);
      grid.appendChild(stats);

      // School yield card
      const schoolCard = el("div", { class: "dash-card" }, [
        el("div", { class: "dash-card-title" }, "Top-yield schools (3-cycle)"),
        el("div", { class: "dash-card-sub" }, "Filtered to schools with ≥ 2 offers"),
        renderSchoolBarChart(),
      ]);
      grid.appendChild(schoolCard);

      // Decline themes card
      const declineCard = el("div", { class: "dash-card span-2" }, [
        el("div", { class: "dash-card-title" }, "Decline reasons by theme"),
        el("div", { class: "dash-card-sub" }, "Across recent cycles, all declines"),
        renderDeclineThemeChart(),
      ]);
      grid.appendChild(declineCard);

      bubble.appendChild(grid);

      bubble.appendChild(el("p", { class: "muted" },
        "Recruiting leadership uses this view in the weekly review. Drill-downs (by pod, by recruiter, by stage) would live one click deep in production."));

      renderTrace(bubble, [
        "Loaded funnel data for the active cycle (2025) and prior cycle (2024)",
        "Computed YoY deltas on offers extended and offers accepted",
        `Computed accept rates across ${ANALYTICS.bySchool.length} schools, filtered to ≥ 2 offers`,
        "Clustered all decline reasons into 4 themes via keyword tagging",
        "Rendered four chart cards inline using SVG (no chart library)",
        "In production this would be a fully filterable view — by pod, year, role, recruiter",
      ]);
    };
  }

  function answerGeneric(query) {
    return (bubble) => {
      bubble.appendChild(el("p", {},
        "I don't have a canned answer for that yet, but here's what I'd pull together in a real deployment:"));
      bubble.appendChild(el("ul", {}, [
        el("li", {}, "Search the recruiting corpus (ATS records, interview notes, pod debriefs, Slack)"),
        el("li", {}, "Filter by entities mentioned in your question (candidate, pod, school, year)"),
        el("li", {}, "Synthesize a 3-sentence answer with citations to the underlying documents"),
        el("li", {}, "Surface follow-up questions the recruiter might ask next"),
      ]));
      bubble.appendChild(el("p", { class: "muted" },
        `Try one of the suggested questions on the left to see a fully rendered example. (Your query: "${query}")`));
      renderTrace(bubble, [
        "Query did not match any canned demo handler",
        "In production: route to the retrieval pipeline (BM25 + vector search over the recruiting corpus)",
        "Synthesize a short answer with an LLM, constrained to cite the retrieved documents",
        "Refuse to answer if no high-confidence source is found",
      ]);
    };
  }

  // ---------- Routing ----------
  function route(query) {
    const q = query.toLowerCase();

    // Dashboard / pipeline overview
    if (q.includes("dashboard") || q.includes("pipeline overview") ||
        (q.includes("pipeline") && (q.includes("show") || q.includes("overview"))) ||
        q.includes("recruiting metrics") || q.includes("funnel")) {
      return answerDashboard();
    }

    // Pre-interview briefing
    if (q.includes("brief") || q.includes("prep me") || q.includes("interview prep") ||
        q.includes("prepare me") || q.includes("getting ready for") || q.includes("prep for")) {
      const briefMatches = CANDIDATES.filter(c => {
        const parts = c.name.toLowerCase().split(/\s+/);
        return parts.every(p => q.includes(p)) || q.includes(c.name.toLowerCase());
      });
      if (briefMatches.length) return answerInterviewBrief(briefMatches[0].name);
      const m = query.match(/(?:brief(?:\s+me)?(?:\s+on)?|prep(?:\s+me)?(?:\s+for)?|prepare(?:\s+me)?(?:\s+for)?)\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+){0,2})/i);
      if (m) return answerInterviewBrief(m[1]);
    }

    for (const podKey of Object.keys(POD_INFO)) {
      const podName = POD_INFO[podKey].name.toLowerCase();
      if ((q.includes(podKey) || q.includes(podName)) &&
          (q.includes("feedback") || q.includes("intern") || q.includes("summer") || q.includes("debrief"))) {
        return answerPodFeedback(podKey);
      }
    }

    if ((q.includes("school") || q.includes("schools") || q.includes("university") || q.includes("universities")) &&
        (q.includes("offer") || q.includes("accept") || q.includes("yield") || q.includes("rate"))) {
      return answerSchoolStats();
    }

    if ((q.includes("decline") || q.includes("declined") || q.includes("turn down") || q.includes("turned down") || q.includes("reject our")) &&
        (q.includes("reason") || q.includes("why") || q.includes("technical") || q.includes("offer"))) {
      return answerDeclineReasons();
    }

    if (q.includes("similar") || q.includes("like ") || q.includes("looks like") || q.includes("background")) {
      return answerSimilarCandidates(query);
    }

    const nameMatches = CANDIDATES.filter(c => {
      const parts = c.name.toLowerCase().split(/\s+/);
      return parts.every(p => q.includes(p)) || q.includes(c.name.toLowerCase());
    });
    if (nameMatches.length) {
      return answerCandidateLookup(nameMatches[0].name);
    }

    if (q.includes("interview") || q.includes("spoken") || q.includes("met with") || q.includes("seen")) {
      const m = query.match(/(?:interviewed|spoken (?:to|with)|met with|seen)\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+){0,2})/);
      if (m) return answerCandidateLookup(m[1]);
    }

    return answerGeneric(query);
  }

  // ---------- Wire up ----------
  function ask(query) {
    if (!query || !query.trim()) return;
    // Replace, don't append: each new question shows only the latest exchange.
    clearMessages();
    const userMsg = addUserMessage(query);
    input.value = "";
    const renderer = route(query.trim());
    addAssistantMessage(renderer, userMsg);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
  });

  document.querySelectorAll(".suggested").forEach(btn => {
    btn.addEventListener("click", () => ask(btn.getAttribute("data-q")));
  });

  // Make insight cards clickable too — they pre-fill the question that produced them.
  document.querySelectorAll(".insight").forEach(card => {
    const q = card.getAttribute("data-q");
    if (q) card.addEventListener("click", () => ask(q));
  });
})();
