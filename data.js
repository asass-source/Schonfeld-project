// Mock recruiting dataset for the Schonfeld AI Recruiting Assistant demo.
// All data is fictional. Names, scores, and feedback are illustrative only.

const POD_INFO = {
  atlas: {
    id: "atlas",
    name: "Atlas Capital",
    strategy: "Equities Long/Short",
    pm: "J. Reyes",
    lookingFor: "Fundamental equity research, sector specialization (TMT, consumer), strong written thesis ability",
  },
  helios: {
    id: "helios",
    name: "Helios Quantitative",
    strategy: "Quant Systematic",
    pm: "S. Iyer",
    lookingFor: "Time-series ML, signal research, Python/C++, strong math background",
  },
  vanguard: {
    id: "vanguard",
    name: "Vanguard Macro",
    strategy: "Global Macro",
    pm: "D. Okafor",
    lookingFor: "Rates, FX, central-bank framing, intellectual curiosity across geographies",
  },
  meridian: {
    id: "meridian",
    name: "Meridian Credit",
    strategy: "Credit & Fixed Income",
    pm: "K. Wong",
    lookingFor: "Distressed/HY credit fundamentals, capital structure fluency, accounting depth",
  },
  apex: {
    id: "apex",
    name: "Apex Stat Arb",
    strategy: "Statistical Arbitrage",
    pm: "A. Petrov",
    lookingFor: "Low-latency systems, stat learning, rigorous backtesting hygiene",
  },
};

const SCHOOLS = [
  "Princeton", "MIT", "Stanford", "Carnegie Mellon", "Wharton (Penn)",
  "Columbia", "Harvard", "Yale", "Cornell", "Duke",
  "UChicago", "NYU Stern", "UC Berkeley",
];

// Sources are referenced by id in candidate cycle entries so answers can cite them.
const SOURCES = {
  // Format: id -> { type, label, date, snippet }
  "src-001": { type: "Interview Note", label: "Atlas R2 — M. Patel", date: "2024-02-08", author: "J. Reyes",
    snippet: "Walked through long thesis on a semi-cap equipment name. Sized risk thoughtfully. Pushback handled with composure." },
  "src-002": { type: "Pod Debrief", label: "Atlas 2024 Summer Debrief", date: "2024-08-23", author: "Atlas Pod",
    snippet: "Top of class. Owned a basket within sector by week 4. Hire signal: strong." },
  "src-003": { type: "ATS Record", label: "Greenhouse — M. Patel", date: "2023-11-04",
    snippet: "Applied 11/4/2023 via campus drop. Resume flagged for Atlas + Meridian." },
  "src-004": { type: "Slack Thread", label: "#recruiting-2024 — re: Patel", date: "2024-02-09", author: "L. Chen",
    snippet: "Atlas wants to move fast on Patel. Aligning offer timing with Princeton calendar." },

  "src-010": { type: "Interview Note", label: "Helios R1 — A. Nakamura", date: "2024-01-22", author: "S. Iyer",
    snippet: "Strong on time-series fundamentals. Explained ridge vs. lasso intuitively. Light on production ML." },
  "src-011": { type: "Pod Debrief", label: "Helios 2024 Summer Debrief", date: "2024-08-19", author: "Helios Pod",
    snippet: "Built a working intraday signal end-to-end. Communication uneven but research instincts excellent." },
  "src-012": { type: "ATS Record", label: "Greenhouse — A. Nakamura", date: "2023-10-18",
    snippet: "MIT EECS, junior. Referred by S. Iyer (alumnus). GPA 4.9/5.0." },

  "src-020": { type: "Interview Note", label: "Apex R2 — D. Volkov", date: "2024-02-14", author: "A. Petrov",
    snippet: "C++ fluency above bar. Designed a fair backtest with proper PIT data handling. Quiet but precise." },
  "src-021": { type: "Pod Debrief", label: "Apex 2024 Summer Debrief", date: "2024-08-21", author: "Apex Pod",
    snippet: "Shipped a latency improvement to a research pipeline. Hire-back: yes." },

  "src-030": { type: "Interview Note", label: "Vanguard R1 — E. Hassan", date: "2024-01-30", author: "D. Okafor",
    snippet: "Clear framing on EM rates differentials. Read FT and BIS papers, not just textbooks. Rare for a junior." },
  "src-031": { type: "Pod Debrief", label: "Vanguard 2024 Summer Debrief", date: "2024-08-22", author: "Vanguard Pod",
    snippet: "Stretched on duration math early on. Caught up by mid-summer. Borderline hire-back; would re-interview." },

  "src-040": { type: "Interview Note", label: "Meridian R2 — R. Kim", date: "2024-02-12", author: "K. Wong",
    snippet: "Capital-structure question handled cleanly. Knew the difference between covenant-lite and covenant-loose." },
  "src-041": { type: "Pod Debrief", label: "Meridian 2024 Summer Debrief", date: "2024-08-24", author: "Meridian Pod",
    snippet: "Excellent fundamental work. Sometimes overconfident in liquidity assumptions. Strong hire-back." },

  "src-050": { type: "Interview Note", label: "Atlas R1 — S. Bhattacharya (2023)", date: "2023-02-11", author: "J. Reyes",
    snippet: "Solid first round in 2023 cycle. Went to Citadel Surveyor for the summer. Re-engaged for 2024 full-time." },
  "src-051": { type: "Interview Note", label: "Atlas R2 — S. Bhattacharya (2024)", date: "2024-02-19", author: "J. Reyes",
    snippet: "Came back stronger. Real intellectual humility about a thesis that didn't work for him last summer." },
  "src-052": { type: "ATS Record", label: "Greenhouse — Bhattacharya (multi-cycle)", date: "2024-02-19",
    snippet: "Two cycles on file: 2023 SA (declined offer for Citadel), 2024 FT (offer extended)." },

  "src-060": { type: "Decline Note", label: "Exit conversation — A. Nakamura", date: "2024-03-22", author: "L. Chen",
    snippet: "Declined for Two Sigma. Cited team-rotation flexibility and longer-horizon research projects as deciding factors." },
  "src-061": { type: "Decline Note", label: "Exit conversation — Y. Tanaka", date: "2024-03-19", author: "L. Chen",
    snippet: "Declined for Citadel GQS. Cited compensation differential (~15%) and PhD-pipeline reputation." },
  "src-062": { type: "Decline Note", label: "Exit conversation — F. Oduya", date: "2024-03-25", author: "L. Chen",
    snippet: "Declined for Jane Street. Cited training program and peer cohort. Compensation was secondary." },
  "src-063": { type: "Decline Note", label: "Exit conversation — H. Park", date: "2024-03-21", author: "L. Chen",
    snippet: "Declined for DE Shaw. Cited research culture and longer-term project ownership." },
  "src-064": { type: "Decline Note", label: "Exit conversation — N. Alvarez", date: "2023-03-30", author: "L. Chen",
    snippet: "Declined for Point72 Cubist. Cited geography (Stamford preference) and pod-rotation transparency." },

  "src-070": { type: "Interview Note", label: "Atlas R1 — N. Alvarez (2025)", date: "2025-01-28", author: "J. Reyes",
    snippet: "Returning candidate. Two years more mature. Wants to be in NYC now. Strong technical bar." },
  "src-071": { type: "ATS Record", label: "Greenhouse — N. Alvarez (multi-cycle)", date: "2025-01-15",
    snippet: "Cycles: 2023 SA (offer declined, see src-064), 2025 FT (active)." },

  "src-080": { type: "Slack Thread", label: "#recruiting-2025 — pipeline review", date: "2025-01-12", author: "L. Chen",
    snippet: "Carnegie Mellon yield jumped this cycle. We should double our headcount allocation there." },
  "src-081": { type: "Slack Thread", label: "#recruiting-2025 — Princeton dinner", date: "2025-02-02", author: "L. Chen",
    snippet: "Princeton candidates are converting at 80%+ on offers this year. Atlas relationships paying off." },
};

// Helper to assemble candidate data more readably.
function c(id, name, school, major, gradYear, cycles, tags = []) {
  return { id, name, school, major, gradYear, cycles, tags };
}

const CANDIDATES = [
  c("cand-001", "Maya Patel", "Princeton", "ORFE", 2025, [
    { year: 2024, role: "Investment Analyst Intern", pod: "atlas", status: "accepted",
      score: 4.7, interviewers: ["J. Reyes", "L. Chen", "M. Diaz"],
      sources: ["src-001", "src-002", "src-003", "src-004"],
      summary: "Strong 2024 SA in Atlas. Owned a sector basket by week 4. Returning offer extended for 2025 FT." },
  ], ["princeton", "atlas", "fundamental", "tmt"]),

  c("cand-002", "Aiko Nakamura", "MIT", "EECS", 2025, [
    { year: 2024, role: "Quant Research Intern", pod: "helios", status: "declined",
      score: 4.5, interviewers: ["S. Iyer", "P. Cho"],
      declineReason: "Competing offer (Two Sigma) — team-rotation flexibility, longer-horizon research",
      sources: ["src-010", "src-011", "src-012", "src-060"],
      summary: "Helios SA 2024. Strong research instincts. Declined return offer for Two Sigma." },
  ], ["mit", "helios", "quant", "ml"]),

  c("cand-003", "Daniil Volkov", "Carnegie Mellon", "Computer Science", 2025, [
    { year: 2024, role: "Quant Developer Intern", pod: "apex", status: "accepted",
      score: 4.8, interviewers: ["A. Petrov", "R. Bose"],
      sources: ["src-020", "src-021"],
      summary: "Apex SA 2024. Shipped latency improvement. Strong hire-back; FT offer extended." },
  ], ["cmu", "apex", "engineering", "cpp"]),

  c("cand-004", "Eman Hassan", "UChicago", "Economics + Math", 2025, [
    { year: 2024, role: "Macro Research Intern", pod: "vanguard", status: "rejected",
      score: 3.6, interviewers: ["D. Okafor"],
      sources: ["src-030", "src-031"],
      summary: "Vanguard SA 2024. Stretched early but caught up. Borderline hire-back." },
  ], ["uchicago", "vanguard", "macro"]),

  c("cand-005", "Rachel Kim", "Wharton (Penn)", "Finance + Stats", 2025, [
    { year: 2024, role: "Credit Analyst Intern", pod: "meridian", status: "accepted",
      score: 4.6, interviewers: ["K. Wong", "T. Ng"],
      sources: ["src-040", "src-041"],
      summary: "Meridian SA 2024. Strong fundamental work. FT offer extended." },
  ], ["wharton", "meridian", "credit"]),

  c("cand-006", "Sahil Bhattacharya", "Columbia", "Operations Research", 2024, [
    { year: 2023, role: "Investment Analyst Intern", pod: "atlas", status: "declined",
      score: 4.2, interviewers: ["J. Reyes"],
      declineReason: "Took Citadel Surveyor SA",
      sources: ["src-050", "src-052"],
      summary: "2023 SA process. Declined for Citadel Surveyor." },
    { year: 2024, role: "Investment Analyst (FT)", pod: "atlas", status: "accepted",
      score: 4.7, interviewers: ["J. Reyes", "L. Chen"],
      sources: ["src-051", "src-052"],
      summary: "Re-engaged 2024 FT cycle. Came back stronger. FT offer extended and accepted." },
  ], ["columbia", "atlas", "returning-candidate", "fundamental"]),

  c("cand-007", "Yuki Tanaka", "Stanford", "Statistics (PhD track)", 2025, [
    { year: 2024, role: "Quant Research Intern", pod: "helios", status: "declined",
      score: 4.6, interviewers: ["S. Iyer"],
      declineReason: "Competing offer (Citadel GQS) — comp differential, PhD pipeline",
      sources: ["src-061"],
      summary: "Helios SA 2024 declined for Citadel GQS." },
  ], ["stanford", "helios", "quant", "phd-track"]),

  c("cand-008", "Folake Oduya", "Harvard", "Applied Math", 2025, [
    { year: 2024, role: "Quant Developer Intern", pod: "apex", status: "declined",
      score: 4.7, interviewers: ["A. Petrov"],
      declineReason: "Competing offer (Jane Street) — training program, peer cohort",
      sources: ["src-062"],
      summary: "Apex SA 2024 declined for Jane Street." },
  ], ["harvard", "apex", "quant"]),

  c("cand-009", "Hyun Park", "MIT", "Math", 2025, [
    { year: 2024, role: "Quant Research Intern", pod: "helios", status: "declined",
      score: 4.5, interviewers: ["S. Iyer"],
      declineReason: "Competing offer (DE Shaw) — research culture, project ownership",
      sources: ["src-063"],
      summary: "Helios SA 2024 declined for DE Shaw." },
  ], ["mit", "helios", "quant"]),

  c("cand-010", "Nico Alvarez", "Cornell", "Operations Research", 2024, [
    { year: 2023, role: "Quant Developer Intern", pod: "apex", status: "declined",
      score: 4.3, interviewers: ["A. Petrov"],
      declineReason: "Competing offer (Point72 Cubist) — Stamford preference, rotation transparency",
      sources: ["src-064"],
      summary: "2023 SA declined for Point72 Cubist." },
    { year: 2025, role: "Quant Developer (FT)", pod: "apex", status: "interviewing",
      score: null, interviewers: ["A. Petrov"],
      sources: ["src-070", "src-071"],
      summary: "Returning FT candidate in 2025 cycle. Active in process." },
  ], ["cornell", "apex", "returning-candidate", "engineering"]),

  c("cand-011", "Tomás Rivera", "Princeton", "Economics", 2026, [
    { year: 2025, role: "Investment Analyst Intern", pod: "atlas", status: "accepted",
      score: 4.5, interviewers: ["J. Reyes", "L. Chen"], sources: [],
      summary: "Atlas SA 2025. Strong consumer-sector pitch in final round." },
  ], ["princeton", "atlas", "consumer"]),

  c("cand-012", "Priya Krishnan", "Carnegie Mellon", "Statistics + ML", 2026, [
    { year: 2025, role: "Quant Research Intern", pod: "helios", status: "accepted",
      score: 4.6, interviewers: ["S. Iyer"], sources: [],
      summary: "Helios SA 2025. Strong feature-engineering exercise." },
  ], ["cmu", "helios", "ml"]),

  c("cand-013", "Jonathan Wells", "Yale", "Economics", 2026, [
    { year: 2025, role: "Investment Analyst Intern", pod: "atlas", status: "rejected",
      score: 3.4, interviewers: ["J. Reyes"], sources: [],
      summary: "Atlas R2 — thesis lacked specificity. Pass." },
  ], ["yale", "atlas"]),

  c("cand-014", "Chioma Eze", "Wharton (Penn)", "Finance", 2026, [
    { year: 2025, role: "Credit Analyst Intern", pod: "meridian", status: "accepted",
      score: 4.7, interviewers: ["K. Wong"], sources: [],
      summary: "Meridian SA 2025. Distressed credit case study at top of class." },
  ], ["wharton", "meridian", "credit"]),

  c("cand-015", "Ben Goldstein", "Columbia", "Computer Science", 2026, [
    { year: 2025, role: "Software Engineering Intern", pod: "apex", status: "accepted",
      score: 4.5, interviewers: ["A. Petrov"], sources: [],
      summary: "Apex SWE 2025. Good systems instincts." },
  ], ["columbia", "apex", "engineering"]),

  c("cand-016", "Mei-Lin Chen", "UC Berkeley", "EECS", 2026, [
    { year: 2025, role: "Quant Research Intern", pod: "helios", status: "declined",
      score: 4.4, interviewers: ["S. Iyer"],
      declineReason: "Competing offer (Hudson River Trading) — culture fit, research breadth",
      sources: [],
      summary: "Helios SA 2025 declined for HRT." },
  ], ["berkeley", "helios", "quant"]),

  c("cand-017", "Olivia Brennan", "Duke", "Economics + CS", 2026, [
    { year: 2025, role: "Investment Analyst Intern", pod: "atlas", status: "accepted",
      score: 4.4, interviewers: ["J. Reyes"], sources: [],
      summary: "Atlas SA 2025. TMT focus, strong written work." },
  ], ["duke", "atlas", "tmt"]),

  c("cand-018", "Arjun Mehta", "MIT", "Mathematics", 2026, [
    { year: 2025, role: "Quant Research Intern", pod: "helios", status: "interviewing",
      score: null, interviewers: ["S. Iyer"], sources: [],
      summary: "Helios SA 2025. Active in process." },
  ], ["mit", "helios", "quant"]),

  c("cand-019", "Sofia Marchetti", "NYU Stern", "Finance + Math", 2026, [
    { year: 2025, role: "Macro Research Intern", pod: "vanguard", status: "accepted",
      score: 4.3, interviewers: ["D. Okafor"], sources: [],
      summary: "Vanguard SA 2025. Solid framing on European rates." },
  ], ["nyu", "vanguard", "macro"]),

  c("cand-020", "Liam O'Connor", "Cornell", "Computer Science", 2026, [
    { year: 2025, role: "Software Engineering Intern", pod: "apex", status: "rejected",
      score: 3.5, interviewers: ["A. Petrov"], sources: [],
      summary: "Apex SWE 2025. Strong CS but didn't enjoy financial-context questions." },
  ], ["cornell", "apex", "engineering"]),

  c("cand-021", "Avery Thompson", "Stanford", "Symbolic Systems", 2026, [
    { year: 2025, role: "Investment Analyst Intern", pod: "atlas", status: "accepted",
      score: 4.6, interviewers: ["J. Reyes"], sources: [],
      summary: "Atlas SA 2025. Unusual blend of CS and discretionary instincts." },
  ], ["stanford", "atlas", "tmt"]),

  c("cand-022", "Max Kuznetsov", "UChicago", "Math", 2025, [
    { year: 2024, role: "Quant Research Intern", pod: "helios", status: "accepted",
      score: 4.5, interviewers: ["S. Iyer"], sources: [],
      summary: "Helios SA 2024. Strong stochastic calculus background." },
  ], ["uchicago", "helios", "quant"]),

  c("cand-023", "Naomi Williams", "Harvard", "Economics", 2025, [
    { year: 2024, role: "Investment Analyst Intern", pod: "atlas", status: "accepted",
      score: 4.4, interviewers: ["J. Reyes"], sources: [],
      summary: "Atlas SA 2024. Strong consumer-sector instincts." },
  ], ["harvard", "atlas", "consumer"]),

  c("cand-024", "David Stern", "Wharton (Penn)", "Finance", 2025, [
    { year: 2024, role: "Credit Analyst Intern", pod: "meridian", status: "rejected",
      score: 3.3, interviewers: ["K. Wong"], sources: [],
      summary: "Meridian R2 — capital-structure questions weak." },
  ], ["wharton", "meridian"]),

  c("cand-025", "Isabel Castro", "Princeton", "ORFE", 2026, [
    { year: 2025, role: "Quant Research Intern", pod: "helios", status: "accepted",
      score: 4.6, interviewers: ["S. Iyer", "P. Cho"], sources: [],
      summary: "Helios SA 2025. Princeton-Atlas pipeline crossover candidate." },
  ], ["princeton", "helios", "quant"]),

  c("cand-026", "Henry Liu", "MIT", "EECS", 2026, [
    { year: 2025, role: "Software Engineering Intern", pod: "apex", status: "accepted",
      score: 4.7, interviewers: ["A. Petrov"], sources: [],
      summary: "Apex SWE 2025. Distributed-systems depth above bar." },
  ], ["mit", "apex", "engineering"]),

  c("cand-027", "Grace Lee", "Stanford", "Management Science", 2025, [
    { year: 2024, role: "Investment Analyst Intern", pod: "atlas", status: "declined",
      score: 4.3, interviewers: ["J. Reyes"],
      declineReason: "Competing offer (Millennium) — pod transparency, mentor match",
      sources: [],
      summary: "Atlas SA 2024 declined for Millennium." },
  ], ["stanford", "atlas"]),

  c("cand-028", "Ravi Subramanian", "Carnegie Mellon", "Computer Science", 2026, [
    { year: 2025, role: "Quant Developer Intern", pod: "apex", status: "accepted",
      score: 4.5, interviewers: ["A. Petrov"], sources: [],
      summary: "Apex SA 2025. Low-level systems expertise." },
  ], ["cmu", "apex", "engineering"]),
];

// Pre-computed analytics so the assistant feels instant.
function computeAnalytics() {
  const bySchool = {};
  for (const cand of CANDIDATES) {
    for (const cycle of cand.cycles) {
      const s = cand.school;
      if (!bySchool[s]) bySchool[s] = { school: s, interviewed: 0, offers: 0, accepted: 0, declined: 0 };
      bySchool[s].interviewed += 1;
      if (cycle.status === "accepted") { bySchool[s].offers += 1; bySchool[s].accepted += 1; }
      if (cycle.status === "declined") { bySchool[s].offers += 1; bySchool[s].declined += 1; }
    }
  }
  const rows = Object.values(bySchool).map(r => ({
    ...r,
    offerRate: r.interviewed ? (r.offers / r.interviewed) : 0,
    acceptRate: r.offers ? (r.accepted / r.offers) : 0,
  }));
  rows.sort((a, b) => b.acceptRate - a.acceptRate || b.offers - a.offers);
  return { bySchool: rows };
}

const ANALYTICS = computeAnalytics();
