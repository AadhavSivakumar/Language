/* ============================================================================
 * Kili · Learn Tamil — client-side app
 *
 * Pick a TOPIC, then pick a MODE. The app generates a practice session from
 * the word/sentence lists in data.js, so content and practice styles are fully
 * decoupled. No framework, no build step. Progress lives in localStorage.
 *
 * Modes:
 *   flash    — flashcards (flip to reveal), not scored
 *   choice   — multiple choice (Tamil⇄English)
 *   match    — tap matching pairs
 *   type     — type the answer (script or transliteration accepted)
 *   listen   — hear Tamil, pick the meaning
 *   build    — tap word-tiles to build a sentence  (sentence topics)
 *   translate— read Tamil, choose the English      (sentence topics)
 * ==========================================================================*/

(function () {
  "use strict";

  const TOPICS = window.TOPICS;
  const VOCAB = window.VOCAB;
  const SENTENCES = window.SENTENCES;
  const ALPHABET = window.ALPHABET;
  const CONJUGATION = window.CONJUGATION || [];
  const KURAL = window.KURAL || [];

  /* Cross-topic practice tracks — shown on the home screen as "things to
   * practise" (as opposed to browsing a single topic). Each behaves like a
   * pseudo-topic in the session runner: it has a colour, an id and a pool. */
  const PRACTICE = [
    { id: "prac-review", title: "Review", icon: "மீட்டல்", color: "#a85a44",
      kind: "practice", pool: "review", desc: "Spaced repetition — your words that are due" },
    { id: "prac-vocab", title: "Vocabulary", icon: "சொல்", color: "#4a5b8c",
      kind: "practice", pool: "vocab", desc: "Mixed word practice from every topic" },
    { id: "prac-sentence", title: "Sentences", icon: "வாக்கியம்", color: "#8c6d3f",
      kind: "practice", pool: "sentence", desc: "Build and translate full sentences" },
    { id: "prac-conjugation", title: "Conjugation", icon: "வினை", color: "#a85a44",
      kind: "practice", pool: "conjugation", desc: "Verb tenses — past, present & future" },
    { id: "prac-listening", title: "Listening", icon: "கேட்டல்", color: "#6b7f4e",
      kind: "practice", pool: "listening", desc: "Ear training — words and sentences" },
    { id: "prac-kural", title: "Thirukkural", icon: "திருக்குறள்", color: "#8c6d3f",
      kind: "practice", pool: "kural", desc: "Classical couplets of Tiruvaḷḷuvar" },
    { id: "prac-mixed", title: "Mixed review", icon: "கலவை", color: "#7a5470",
      kind: "practice", pool: "mixed", desc: "A bit of everything you've seen" },
  ];

  const app = document.getElementById("app");
  const topbar = document.getElementById("topbar");

  /* ----------------------------- Persistence ----------------------------- */
  const SAVE_KEY = "kili-tamil-v2";
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const addDays = (dateStr, n) => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const defaultState = () => ({
    xp: 0, streak: 0, lastActive: null, practiced: {},
    srs: {},          // word key -> { reps, interval, ease, due, lapses, seen }
    activeDates: [],  // recent days with any activity (for the streak calendar)
    goal: 30,         // daily XP goal
    today: null,      // { date, xp } — today's XP toward the goal
  });

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) { return defaultState(); }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  let state = load();

  /* ------------------------ Spaced repetition (SRS) ---------------------
   * Each word (keyed by its Tamil + English) carries a memory record. A
   * correct answer lengthens the interval before it's due again; a wrong
   * answer resets it. The "Review" track pools whatever is due today. */
  const SRS_SEP = "␟";
  const wkey = (o) => (o && o.ta ? o.ta : "") + SRS_SEP + (o && o.en ? o.en : "");

  function srsRecord(key, ok) {
    if (!key) return;
    const today = todayStr();
    const e = state.srs[key] || { reps: 0, interval: 0, ease: 2.3, due: today, lapses: 0 };
    if (ok) {
      e.reps += 1;
      e.interval = e.reps <= 1 ? 1 : e.reps === 2 ? 3 : Math.round((e.interval || 3) * e.ease);
      e.ease = Math.min(2.8, e.ease + 0.05);
    } else {
      e.reps = 0; e.interval = 0; e.lapses += 1;
      e.ease = Math.max(1.7, e.ease - 0.2);
    }
    e.due = addDays(today, e.interval);
    e.seen = today;
    state.srs[key] = e;
  }
  function recordKeys(ex, ok) {
    if (!ex) return;
    if (ex.keys) ex.keys.forEach(k => srsRecord(k, ok));
    else if (ex.key) srsRecord(ex.key, ok);
  }
  const isDue = (e, today) => e && e.due <= today;
  function dueCount() {
    const today = todayStr();
    let n = 0;
    for (const k in state.srs) if (isDue(state.srs[k], today)) n++;
    return n;
  }
  // Words due for review, newest-lapses first; topped up with unseen words
  // so the track is never empty for a fresh learner.
  function dueItems() {
    const today = todayStr();
    const seen = new Set(), due = [], fresh = [];
    for (const it of VOCAB.concat(SENTENCES)) {
      const k = wkey(it);
      if (seen.has(k)) continue; seen.add(k);
      const e = state.srs[k];
      if (isDue(e, today)) due.push(it);
      else if (!e) fresh.push(it);
    }
    if (due.length < 8) due.push(...shuffle(fresh).slice(0, 8 - due.length));
    return due;
  }
  // A word counts as "learned" once it has two or more successful reps.
  function topicMastery(topicId) {
    const items = topicVocab(topicId);
    let learned = 0;
    for (const it of items) { const e = state.srs[wkey(it)]; if (e && e.reps >= 2) learned++; }
    return { learned, total: items.length };
  }
  function totalLearned() {
    let n = 0;
    for (const k in state.srs) if (state.srs[k].reps >= 2) n++;
    return n;
  }

  /* ============================ USERNAME SYNC ===========================
   * Progress lives in this repo as progress/<username>.json.
   *
   *   Pull  — a plain GET. The repo is public, so no token is needed and any
   *           device can restore your progress with just the username.
   *   Push  — the GitHub Contents API, which requires a token. The token is
   *           kept in this browser's localStorage and is never committed.
   *
   * Devices merge rather than overwrite (see mergeState), so practising in two
   * places doesn't lose work. */
  const SYNC = { owner: "AadhavSivakumar", repo: "Tamil", branch: "main", dir: "progress" };
  const ACCT_KEY = "kili-tamil-account";
  const cleanName = (s) => (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9._-]/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 32);

  function loadAcct() {
    try { return Object.assign({ username: "", token: "", auto: true },
      JSON.parse(localStorage.getItem(ACCT_KEY) || "{}")); }
    catch (e) { return { username: "", token: "", auto: true }; }
  }
  function saveAcct() { try { localStorage.setItem(ACCT_KEY, JSON.stringify(acct)); } catch (e) {} }
  let acct = loadAcct();
  let sync = { busy: false, msg: "", kind: "" };   // kind: ok | bad | ""

  // btoa/atob are byte-oriented; Tamil needs a UTF-8 round trip.
  function b64enc(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64dec(b64) {
    const bin = atob((b64 || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const remotePath = (u) => SYNC.dir + "/" + u + ".json";
  const apiUrl = (u) => "https://api.github.com/repos/" + SYNC.owner + "/" + SYNC.repo +
    "/contents/" + encodeURIComponent(SYNC.dir) + "/" + encodeURIComponent(u + ".json");

  function ghHeaders() {
    const h = { "Accept": "application/vnd.github+json" };
    if (acct.token) h["Authorization"] = "Bearer " + acct.token;
    return h;
  }

  /* Fetch the remote file. Returns { state, sha } — sha is null when the file
   * doesn't exist yet (a first-time username), which is not an error. */
  async function pullRemote(username) {
    const res = await fetch(apiUrl(username) + "?ref=" + SYNC.branch + "&t=" + Date.now(),
      { headers: ghHeaders(), cache: "no-store" });
    if (res.status === 404) return { state: null, sha: null };
    if (res.status === 403) throw new Error("GitHub rate limit reached — add a token, or retry in a few minutes.");
    if (!res.ok) throw new Error("Couldn't read progress (HTTP " + res.status + ").");
    const meta = await res.json();
    let payload;
    try { payload = JSON.parse(b64dec(meta.content)); }
    catch (e) { throw new Error("The saved file is corrupt and can't be read."); }
    return { state: payload && payload.state ? payload.state : null, sha: meta.sha };
  }

  async function pushRemote(username, sha) {
    if (!acct.token) throw new Error("Add a GitHub token to save from this device.");
    const payload = {
      username, updatedAt: new Date().toISOString(),
      app: "kili-tamil", version: 2, state,
    };
    const body = {
      message: "progress: " + username + " · " + state.xp + " XP",
      content: b64enc(JSON.stringify(payload, null, 2)),
      branch: SYNC.branch,
    };
    if (sha) body.sha = sha;
    const res = await fetch(apiUrl(username), {
      method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, ghHeaders()),
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403)
      throw new Error("Token rejected — it needs Contents: Read and write on this repo.");
    if (res.status === 409) throw new Error("Someone else saved first — sync again to merge.");
    if (!res.ok) throw new Error("Couldn't save (HTTP " + res.status + ").");
    return true;
  }

  /* Merge two saves without losing work: newest-wins per word, union for sets,
   * max for counters. `b` is the more recently updated side on ties. */
  function mergeState(a, b) {
    if (!a) return b; if (!b) return a;
    const out = Object.assign({}, a, b);
    out.xp = Math.max(a.xp || 0, b.xp || 0);
    const aLast = a.lastActive || "", bLast = b.lastActive || "";
    const newer = bLast >= aLast ? b : a;
    out.lastActive = newer.lastActive;
    out.streak = newer.streak || 0;
    out.goal = newer.goal || a.goal || b.goal || 30;
    out.practiced = Object.assign({}, a.practiced, b.practiced);
    out.activeDates = Array.from(new Set((a.activeDates || []).concat(b.activeDates || []))).sort();
    if (out.activeDates.length > 90) out.activeDates = out.activeDates.slice(-90);
    const at = a.today, bt = b.today;
    out.today = (at && bt && at.date === bt.date)
      ? { date: at.date, xp: Math.max(at.xp || 0, bt.xp || 0) }
      : ((bt && at) ? (bt.date >= at.date ? bt : at) : (bt || at || null));
    const srs = Object.assign({}, a.srs);
    for (const k in (b.srs || {})) {
      const x = srs[k], y = b.srs[k];
      srs[k] = (!x || (y.seen || "") >= (x.seen || "")) ? y : x;
    }
    out.srs = srs;
    return out;
  }

  /* One round trip: pull, merge into local, push the merged result back. */
  async function syncNow(opts) {
    const o = opts || {};
    const username = acct.username;
    if (!username) return;
    if (sync.busy) return;
    sync.busy = true; sync.msg = "Syncing…"; sync.kind = ""; if (o.onchange) o.onchange();
    try {
      const { state: remote, sha } = await pullRemote(username);
      if (remote) { state = Object.assign(defaultState(), mergeState(remote, state)); save(); }
      if (acct.token) {
        await pushRemote(username, sha);
        sync.msg = "Synced as " + username + " · just now"; sync.kind = "ok";
      } else {
        sync.msg = remote ? "Loaded " + username + " (read-only — add a token to save)"
                          : "No saved progress for " + username + " yet";
        sync.kind = remote ? "ok" : "";
      }
      renderTopbar();
    } catch (e) {
      sync.msg = (e && e.message) ? e.message : "Sync failed.";
      sync.kind = "bad";
    } finally {
      sync.busy = false;
      if (o.onchange) o.onchange();
    }
  }
  // Quiet background save — never interrupts a lesson.
  function syncSoon() {
    if (!acct.username || !acct.token || !acct.auto) return;
    clearTimeout(syncSoon._t);
    syncSoon._t = setTimeout(() => { syncNow({}); }, 1200);
  }

  /* ------------------------------ Utilities ------------------------------ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  const isTamil = (s) => /[஀-௿]/.test(s || "");

  /* --------------------------- Keyboard control --------------------------
   * The active view registers a handler in `onKey`; one global listener
   * dispatches to it. Typing in a text field is never hijacked (Escape aside),
   * and focused buttons keep their native Enter/Space activation. */
  let onKey = null;
  const isTypingTarget = (t) =>
    t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

  document.addEventListener("keydown", (e) => {
    if (!onKey || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e.target) && e.key !== "Escape") return;
    onKey(e);
  });

  const ARROW_NEXT = { ArrowDown: 1, ArrowRight: 1 };
  const ARROW_PREV = { ArrowUp: -1, ArrowLeft: -1 };

  // Move DOM focus through a list; wraps at both ends.
  function focusMove(list, delta) {
    if (!list.length) return;
    const cur = list.indexOf(document.activeElement);
    const next = cur < 0 ? (delta > 0 ? 0 : list.length - 1)
                         : (cur + delta + list.length) % list.length;
    list[next].focus();
  }

  /* Escape always leaves the lesson; everything else defers to the view. */
  function setKeys(session, handler) {
    onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (session) renderTopic(session.topic); else renderHome();
        return;
      }
      if (handler) handler(e);
    };
  }

  /* Shared bindings for any exercise that is "pick one of N, then confirm":
   *   1-9      choose that option        ↑↓←→  move between options
   *   Enter    check / continue          Esc   quit  */
  function choiceKeys(body, grid) {
    return (e) => {
      const choices = Array.prototype.slice.call(
        grid.querySelectorAll(".choice:not([disabled])"));
      if (/^[1-9]$/.test(e.key)) {
        const pick = choices[parseInt(e.key, 10) - 1];
        if (pick) { e.preventDefault(); pick.click(); pick.focus(); }
        return;
      }
      if (ARROW_NEXT[e.key]) { e.preventDefault(); focusMove(choices, 1); return; }
      if (ARROW_PREV[e.key]) { e.preventDefault(); focusMove(choices, -1); return; }
      if (e.key === "Enter") {
        // A focused footer button handles Enter itself.
        if (e.target && e.target.classList && e.target.classList.contains("btn")) return;
        const live = body.querySelector(".check-foot .btn:not([disabled])");
        if (live) { e.preventDefault(); live.click(); }
      }
    };
  }

  // A muted line of hints shown under an exercise.
  function keyHint(text) {
    const h = el("div", "key-hint");
    text.split("|").forEach(part => {
      const [keys, label] = part.split("=");
      const span = el("span", "key-hint-item");
      keys.trim().split("+").forEach(k => span.appendChild(el("kbd", null, k.trim())));
      span.appendChild(el("span", "key-hint-label", label.trim()));
      h.appendChild(span);
    });
    return h;
  }

  /* -------------------------- Tamil text-to-speech ----------------------- */
  let taVoice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices();
    taVoice = voices.find(v => /^ta(-|_|$)/i.test(v.lang)) ||
              voices.find(v => /tamil/i.test(v.name)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!("speechSynthesis" in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ta-IN";
      if (taVoice) u.voice = taVoice;
      u.rate = 0.85;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function speaker(text) {
    const b = el("button", "spk");
    b.type = "button";
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4 9.5h3.2L12 5v14l-4.8-4.5H4z" fill="currentColor"/>' +
      '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    b.setAttribute("aria-label", "Play pronunciation");
    b.addEventListener("click", (e) => { e.stopPropagation(); speak(text); });
    return b;
  }

  /* ------------------------------- Top bar ------------------------------- */
  function renderTopbar() {
    topbar.hidden = false;
    $("#stat-streak").textContent = state.streak;
    $("#stat-xp").textContent = state.xp;
  }
  $("#home-btn").addEventListener("click", renderHome);

  /* --------------------------- Content helpers --------------------------- */
  function topicVocab(topicId) {
    if (topicId === "alphabet") return ALPHABET.vowels.concat(ALPHABET.consonants);
    // A word belongs to a topic if it was authored there, or if it's a
    // frequency-list word filed under that topic via `also`.
    return VOCAB.filter(v => v.topic === topicId || v.also === topicId);
  }

  /* ---------------------------- Difficulty ------------------------------
   * Both the hand-curated topic lists and the frequency list are ordered
   * easiest/commonest first, so a topic splits into three tiers by position:
   * the first third is Easy, the last third Hard. Tiers only appear when a
   * topic has enough words for each tier to be a usable session. */
  const LEVELS = [
    { id: "all", label: "All" }, { id: "easy", label: "Easy" },
    { id: "medium", label: "Medium" }, { id: "hard", label: "Hard" },
  ];
  const MIN_FOR_TIERS = 18;          // ≥6 items per tier
  const hasTiers = pool => pool.length >= MIN_FOR_TIERS;
  function applyLevel(pool, level) {
    if (!level || level === "all" || !hasTiers(pool)) return pool;
    const a = Math.floor(pool.length / 3), b = Math.floor((pool.length * 2) / 3);
    return level === "easy" ? pool.slice(0, a)
         : level === "medium" ? pool.slice(a, b)
         : pool.slice(b);
  }
  function topicSentences(topicId) {
    if (topicId === "sentences") return SENTENCES;
    return SENTENCES.filter(s => s.topic === topicId);
  }

  // Pools for the cross-topic practice tracks (kind: "practice").
  const conjugationForms = () => CONJUGATION.reduce((a, v) => a.concat(v.forms), []);
  function vocabPoolFor(topic) {
    if (topic.kind === "practice") {
      if (topic.pool === "conjugation") return conjugationForms();
      if (topic.pool === "kural") return KURAL;
      if (topic.pool === "review") return dueItems();
      if (topic.pool === "custom") return topic.items || [];
      // "mixed" and "listening" draw on everything that has ta/tr/en.
      if (topic.pool === "mixed" || topic.pool === "listening")
        return VOCAB.concat(SENTENCES, conjugationForms());
      return VOCAB;                        // "vocab" track = every word
    }
    return topicVocab(topic.id);
  }
  function sentencePoolFor(topic) {
    if (topic.kind === "practice") return SENTENCES;
    return topicSentences(topic.id);
  }
  function countLabel(topic) {
    if (topic.kind === "practice") {
      if (topic.pool === "sentence") return SENTENCES.length + " sentences";
      if (topic.pool === "conjugation")
        return CONJUGATION.length + " verbs · " + conjugationForms().length + " forms";
      if (topic.pool === "kural") return KURAL.length + " couplets";
      if (topic.pool === "review") { const d = dueCount(); return d ? d + " due" : "all caught up"; }
      if (topic.pool === "custom") return (topic.items || []).length + " words";
      if (topic.pool === "mixed" || topic.pool === "listening")
        return (VOCAB.length + SENTENCES.length + conjugationForms().length) + " items";
      return VOCAB.length + " words";
    }
    return topic.kind === "sentence"
      ? topicSentences(topic.id).length + " sentences"
      : topicVocab(topic.id).length + " words";
  }
  function modesFor(topic) {
    if (topic.kind === "practice") {
      if (topic.pool === "sentence")
        return ["translate", "en2ta", "smatch", "build", "stype", "slisten", "flash"];
      if (topic.pool === "conjugation") return ["conjugate", "type", "flash"];
      if (topic.pool === "kural") return ["kread", "translate", "kline", "smatch", "flash"];
      if (topic.pool === "listening") return ["listen", "slisten", "flash"];
      if (topic.pool === "review" || topic.pool === "custom")
        return ["choice", "type", "listen", "speak", "flash"];
      return ["choice", "match", "type", "listen", "speak", "flash"];
    }
    if (topic.kind === "sentence") {
      return ["translate", "en2ta", "smatch", "build", "stype", "slisten", "flash"];
    }
    const m = ["flash", "choice", "match", "type", "listen", "speak"];
    if (topicSentences(topic.id).length >= 2) m.push("build");
    return m;
  }
  const MODE_META = {
    flash:     { title: "Flashcards",   desc: "Flip through and learn — no pressure" },
    choice:    { title: "Multiple choice", desc: "Pick the right meaning" },
    match:     { title: "Matching",     desc: "Tap the matching pairs" },
    type:      { title: "Type it",      desc: "Type the answer yourself" },
    listen:    { title: "Listening",    desc: "Hear it, choose the meaning" },
    speak:     { title: "Speak it",     desc: "Say it aloud — your mic checks you" },
    build:     { title: "Build a sentence", desc: "Tap word tiles in order" },
    translate: { title: "Tamil → English", desc: "Read Tamil, choose the meaning" },
    en2ta:     { title: "English → Tamil", desc: "Read English, choose the Tamil" },
    smatch:    { title: "Match sentences", desc: "Pair each Tamil with its English" },
    conjugate: { title: "Conjugation quiz", desc: "Choose the correct verb form" },
    stype:     { title: "Type the sentence", desc: "Write the whole sentence in Tamil" },
    slisten:   { title: "Sentence listening", desc: "Hear a sentence, choose the meaning" },
    kread:     { title: "Read the kural", desc: "Browse the couplets with meanings" },
    kline:     { title: "Complete the couplet", desc: "Given line one, pick line two" },
  };

  /* ============================== HOME VIEW ============================== */
  function renderHome() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "home");

    const hero = el("div", "hero");
    hero.appendChild(el("div", "hero-logo", "கிளி"));
    const hg = el("div");
    hg.appendChild(el("h1", "hero-title", "Learn Tamil"));
    hg.appendChild(el("p", "hero-sub", "The alphabet, 1,300 words across 24 topics, sentences, verb conjugation and the Tirukkuṟaḷ — practise however suits you."));
    hero.appendChild(hg);
    wrap.appendChild(hero);

    const nav = el("div", "home-nav");
    const browseBtn = el("button", "nav-btn", "Search words");
    browseBtn.type = "button";
    browseBtn.addEventListener("click", renderBrowse);
    const progBtn = el("button", "nav-btn", "My progress");
    progBtn.type = "button";
    progBtn.addEventListener("click", renderProgress);
    const acctBtn = el("button", "nav-btn", acct.username ? acct.username : "Sign in");
    acctBtn.type = "button";
    acctBtn.addEventListener("click", renderAccount);
    nav.appendChild(browseBtn); nav.appendChild(progBtn); nav.appendChild(acctBtn);
    wrap.appendChild(nav);

    const makeCard = (topic, subText) => {
      const card = el("button", "topic-card");
      card.type = "button";
      card.style.setProperty("--tc", topic.color);
      card.appendChild(el("span", "topic-icon", topic.icon));
      card.appendChild(el("span", "topic-name", topic.title));
      card.appendChild(el("span", "topic-count", subText));
      if (state.practiced[topic.id]) card.appendChild(el("span", "topic-badge", "●"));
      card.addEventListener("click", () => renderTopic(topic));
      return card;
    };

    // Cross-topic practice tracks first — "what do you want to practise?"
    wrap.appendChild(el("h2", "section-title", "Choose what to practise"));
    const pracGrid = el("div", "topic-grid practice-grid");
    PRACTICE.forEach(p => {
      let sub = p.desc;
      if (p.pool === "review") {
        const d = dueCount();
        sub = d ? d + (d === 1 ? " word" : " words") + " due · spaced repetition"
                : "All caught up — or learn new words";
      }
      pracGrid.appendChild(makeCard(p, sub));
    });
    wrap.appendChild(pracGrid);

    // Then browse individual topics.
    wrap.appendChild(el("h2", "section-title", "Or explore a topic"));
    const grid = el("div", "topic-grid");
    TOPICS.forEach(topic => grid.appendChild(makeCard(topic, countLabel(topic))));
    wrap.appendChild(grid);

    const footer = el("div", "home-footer");
    const reset = el("button", "link-btn", "Reset progress");
    reset.addEventListener("click", () => {
      if (confirm("Reset your XP and streak?")) { state = defaultState(); save(); renderHome(); }
    });
    footer.appendChild(reset);
    wrap.appendChild(footer);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ============================= ACCOUNT VIEW ============================ */
  function renderAccount() {
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "topic-view account-view");

    const back = el("button", "back-btn", "← Home");
    back.addEventListener("click", renderHome);
    wrap.appendChild(back);

    const head = el("div", "topic-head");
    head.appendChild(el("span", "topic-head-icon", "கணக்கு"));
    const ht = el("div");
    ht.appendChild(el("h1", "topic-head-title", "Account & sync"));
    ht.appendChild(el("p", "topic-head-sub",
      "Your progress is saved to this repo as progress/<username>.json"));
    head.appendChild(ht);
    wrap.appendChild(head);

    const status = el("div", "sync-status", "");
    const paint = () => {
      status.textContent = sync.msg || (acct.username
        ? (acct.token ? "Signed in as " + acct.username : "Reading as " + acct.username + " (no token — read-only)")
        : "Not signed in — progress stays on this device.");
      status.className = "sync-status" + (sync.kind ? " " + sync.kind : "");
      syncBtn.disabled = sync.busy || !acct.username;
      syncBtn.textContent = sync.busy ? "Syncing…" : "Sync now";
    };

    /* -- username -- */
    wrap.appendChild(el("h2", "section-title", "Username"));
    const nameRow = el("div", "field-row");
    const nameIn = el("input", "field-input");
    nameIn.type = "text"; nameIn.value = acct.username; nameIn.placeholder = "e.g. aadhav";
    nameIn.autocapitalize = "off"; nameIn.autocomplete = "off"; nameIn.spellcheck = false;
    nameRow.appendChild(nameIn);
    wrap.appendChild(nameRow);
    wrap.appendChild(el("p", "field-note",
      "Letters, numbers, dots and dashes. This names your file in the repo, so pick something you're happy to have public."));

    /* -- token -- */
    wrap.appendChild(el("h2", "section-title", "GitHub token (only needed to save)"));
    const tokRow = el("div", "field-row");
    const tokIn = el("input", "field-input");
    tokIn.type = "password"; tokIn.value = acct.token; tokIn.placeholder = "github_pat_… (optional)";
    tokIn.autocapitalize = "off"; tokIn.autocomplete = "off"; tokIn.spellcheck = false;
    const tokToggle = el("button", "chip-btn", "Show");
    tokToggle.type = "button";
    tokToggle.addEventListener("click", () => {
      tokIn.type = tokIn.type === "password" ? "text" : "password";
      tokToggle.textContent = tokIn.type === "password" ? "Show" : "Hide";
    });
    tokRow.appendChild(tokIn); tokRow.appendChild(tokToggle);
    wrap.appendChild(tokRow);

    const help = el("div", "field-note");
    help.appendChild(document.createTextNode("Without a token you can still "));
    const b1 = el("strong", null, "load"); help.appendChild(b1);
    help.appendChild(document.createTextNode(" your progress on any device — the repo is public. A token is only needed to "));
    const b2 = el("strong", null, "save"); help.appendChild(b2);
    help.appendChild(document.createTextNode(" from this device. Create a "));
    const link = el("a", null, "fine-grained token");
    link.href = "https://github.com/settings/personal-access-tokens/new";
    link.target = "_blank"; link.rel = "noopener noreferrer";
    help.appendChild(link);
    help.appendChild(document.createTextNode(" limited to the "));
    help.appendChild(el("code", null, SYNC.owner + "/" + SYNC.repo));
    help.appendChild(document.createTextNode(" repository, with "));
    help.appendChild(el("code", null, "Contents: Read and write"));
    help.appendChild(document.createTextNode("."));
    wrap.appendChild(help);

    const warn = el("p", "field-warn",
      "The token is stored in this browser only and is never committed. Anyone with access to this device could read it, so use a token scoped to this one repo and revoke it if the device is lost.");
    wrap.appendChild(warn);

    /* -- auto-sync -- */
    const autoRow = el("label", "check-row");
    const autoBox = el("input");
    autoBox.type = "checkbox"; autoBox.checked = !!acct.auto;
    autoBox.addEventListener("change", () => { acct.auto = autoBox.checked; saveAcct(); });
    autoRow.appendChild(autoBox);
    autoRow.appendChild(el("span", null, "Save automatically after each session"));
    wrap.appendChild(autoRow);

    /* -- actions -- */
    const actions = el("div", "account-actions");
    const saveBtn = el("button", "btn btn-primary", "Save & sync");
    saveBtn.addEventListener("click", async () => {
      const n = cleanName(nameIn.value);
      if (!n) { sync.msg = "Enter a username first."; sync.kind = "bad"; paint(); return; }
      nameIn.value = n;
      acct.username = n; acct.token = tokIn.value.trim(); saveAcct();
      await syncNow({ onchange: paint });
      paint();
    });
    const syncBtn = el("button", "btn btn-ghost", "Sync now");
    syncBtn.addEventListener("click", async () => { await syncNow({ onchange: paint }); paint(); });
    actions.appendChild(saveBtn); actions.appendChild(syncBtn);
    wrap.appendChild(actions);
    wrap.appendChild(status);

    if (acct.username) {
      const outWrap = el("div", "account-foot");
      const out = el("button", "link-btn", "Sign out on this device");
      out.addEventListener("click", () => {
        if (!confirm("Sign out? Your progress stays saved in the repo, and this device keeps its local copy.")) return;
        acct = { username: "", token: "", auto: true }; saveAcct();
        sync.msg = ""; sync.kind = ""; renderAccount();
      });
      outWrap.appendChild(out);
      wrap.appendChild(outWrap);
    }

    app.appendChild(wrap);
    paint();
    window.scrollTo(0, 0);
  }

  /* ============================ PROGRESS VIEW ============================ */
  function renderProgress() {
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "topic-view progress-view");

    const back = el("button", "back-btn", "← Home");
    back.addEventListener("click", renderHome);
    wrap.appendChild(back);

    const head = el("div", "topic-head");
    head.appendChild(el("span", "topic-head-icon", "முன்னேற்றம்"));
    const ht = el("div");
    ht.appendChild(el("h1", "topic-head-title", "My progress"));
    ht.appendChild(el("p", "topic-head-sub",
      state.xp + " XP · " + totalLearned() + " words learned · " + dueCount() + " due"));
    head.appendChild(ht);
    wrap.appendChild(head);

    // Daily goal ring.
    const todayXp = (state.today && state.today.date === todayStr()) ? state.today.xp : 0;
    const pct = Math.min(100, state.goal ? Math.round((todayXp / state.goal) * 100) : 0);
    wrap.appendChild(el("h2", "section-title", "Daily goal"));
    const goalRow = el("div", "goal-row");
    const ring = el("div", "goal-ring");
    ring.style.setProperty("--pct", pct);
    ring.appendChild(el("div", "goal-ring-inner", todayXp + "/" + state.goal));
    goalRow.appendChild(ring);
    const goalCtl = el("div", "goal-ctl");
    goalCtl.appendChild(el("div", "goal-ctl-label",
      pct >= 100 ? "Goal reached today." : (state.goal - todayXp) + " XP to go today"));
    goalCtl.appendChild(el("div", "goal-ctl-sub", "Goal: " + state.goal + " XP per day"));
    const gbtns = el("div", "goal-btns");
    [["−10", -10], ["+10", 10]].forEach(([lbl, d]) => {
      const b = el("button", "chip-btn", lbl);
      b.type = "button";
      b.addEventListener("click", () => {
        state.goal = Math.max(10, Math.min(200, state.goal + d)); save(); renderProgress();
      });
      gbtns.appendChild(b);
    });
    goalCtl.appendChild(gbtns);
    goalRow.appendChild(goalCtl);
    wrap.appendChild(goalRow);

    // Streak calendar — last 14 days.
    wrap.appendChild(el("h2", "section-title", state.streak + "-day streak"));
    const cal = el("div", "cal");
    const active = new Set(state.activeDates);
    for (let i = 13; i >= 0; i--) {
      const d = addDays(todayStr(), -i);
      const cell = el("div", "cal-day" + (active.has(d) ? " on" : "") + (i === 0 ? " today" : ""));
      cell.title = d;
      cell.textContent = d.slice(8);
      cal.appendChild(cell);
    }
    wrap.appendChild(cal);

    // Mastery by topic.
    wrap.appendChild(el("h2", "section-title", "Mastery by topic"));
    const list = el("div", "mastery-list");
    TOPICS.filter(t => t.kind === "vocab").forEach(t => {
      const { learned, total } = topicMastery(t.id);
      const p = total ? Math.round((learned / total) * 100) : 0;
      const row = el("div", "mastery-row");
      row.style.setProperty("--tc", t.color);
      const top = el("div", "mastery-top");
      top.appendChild(el("span", "mastery-name", t.title));
      top.appendChild(el("span", "mastery-count", learned + " / " + total));
      row.appendChild(top);
      const bar = el("div", "mastery-bar");
      const fill = el("div", "mastery-fill");
      fill.style.width = p + "%";
      bar.appendChild(fill);
      row.appendChild(bar);
      row.addEventListener("click", () => renderTopic(t));
      list.appendChild(row);
    });
    wrap.appendChild(list);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ============================= WORD BROWSER =========================== */
  function renderBrowse() {
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "topic-view browse-view");

    const back = el("button", "back-btn", "← Home");
    back.addEventListener("click", renderHome);
    wrap.appendChild(back);

    const head = el("div", "topic-head");
    head.appendChild(el("span", "topic-head-icon", "தேடல்"));
    const ht = el("div");
    ht.appendChild(el("h1", "topic-head-title", "Search words"));
    ht.appendChild(el("p", "topic-head-sub", VOCAB.length + " words across every topic"));
    head.appendChild(ht);
    wrap.appendChild(head);

    const titleOf = {}; TOPICS.forEach(t => titleOf[t.id] = t.title);

    const input = el("input", "browse-search");
    input.type = "search"; input.placeholder = "Search English, Tamil or transliteration…";
    input.autocapitalize = "off"; input.autocomplete = "off"; input.spellcheck = false;
    wrap.appendChild(input);

    const info = el("div", "browse-info", "");
    wrap.appendChild(info);
    const listEl = el("div", "browse-list");
    wrap.appendChild(listEl);

    const foot = el("div", "browse-foot");
    const practiseBtn = el("button", "btn btn-primary", "Practise these");
    practiseBtn.type = "button";
    practiseBtn._pool = [];
    practiseBtn.addEventListener("click", () => {
      const items = practiseBtn._pool || [];
      if (items.length < 4) return;
      renderTopic({ id: "prac-custom", title: "Search results", icon: "தேடல்",
        color: "#4a5b8c", kind: "practice", pool: "custom", items });
    });
    foot.appendChild(practiseBtn);
    wrap.appendChild(foot);

    const LIMIT = 300;
    function run(qraw) {
      const q = (qraw || "").trim();
      const query = normalize(q), qf = normalize(fold(q));
      const matches = !q ? VOCAB : VOCAB.filter(v =>
        normalize(v.en).includes(query) ||
        (v.ta || "").includes(q) ||
        normalize(v.tr).includes(query) ||
        normalize(fold(v.tr)).includes(qf));
      info.textContent = matches.length + (matches.length === 1 ? " word" : " words") +
        (matches.length > LIMIT ? " · showing first " + LIMIT : "");
      listEl.innerHTML = "";
      matches.slice(0, LIMIT).forEach(v => {
        const row = el("div", "browse-row");
        const main = el("div", "browse-main");
        const taLine = el("div", "browse-ta");
        taLine.appendChild(el("span", "browse-ta-text", v.ta));
        taLine.appendChild(speaker(v.ta));
        main.appendChild(taLine);
        main.appendChild(el("div", "browse-sub", v.tr + " · " + v.en));
        row.appendChild(main);
        row.appendChild(el("span", "browse-topic", titleOf[v.topic] || v.topic));
        listEl.appendChild(row);
      });
      const n = Math.min(matches.length, 50);
      practiseBtn._pool = matches.slice(0, 50);
      practiseBtn.textContent = "Practise these (" + n + ")";
      practiseBtn.disabled = matches.length < 4;
    }

    input.addEventListener("input", () => run(input.value));
    run("");

    app.appendChild(wrap);
    setTimeout(() => input.focus(), 50);
    window.scrollTo(0, 0);
  }

  /* ============================== TOPIC VIEW ============================= */
  function renderTopic(topic) {
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "topic-view");
    wrap.style.setProperty("--tc", topic.color);

    const back = el("button", "back-btn", "← All topics");
    back.addEventListener("click", renderHome);
    wrap.appendChild(back);

    const head = el("div", "topic-head");
    head.appendChild(el("span", "topic-head-icon", topic.icon));
    const ht = el("div");
    ht.appendChild(el("h1", "topic-head-title", topic.title));
    ht.appendChild(el("p", "topic-head-sub", countLabel(topic)));
    head.appendChild(ht);
    wrap.appendChild(head);

    // Difficulty picker — only where the topic has enough words to split.
    let level = "all";
    const tierPool = vocabPoolFor(topic);
    if (hasTiers(tierPool)) {
      wrap.appendChild(el("h2", "section-title", "Difficulty"));
      const row = el("div", "level-row");
      const note = el("p", "level-note", "");
      const setNote = () => {
        const n = applyLevel(tierPool, level).length;
        note.textContent = level === "all"
          ? "All " + n + " — commonest words first."
          : n + " words · " + (level === "easy" ? "the commonest"
            : level === "medium" ? "the middle third" : "the least common");
      };
      LEVELS.forEach(lv => {
        const b = el("button", "level-chip" + (lv.id === level ? " on" : ""), lv.label);
        b.type = "button";
        b.addEventListener("click", () => {
          level = lv.id;
          row.querySelectorAll(".level-chip").forEach(x => x.classList.remove("on"));
          b.classList.add("on");
          setNote();
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      setNote();
      wrap.appendChild(note);
    }

    wrap.appendChild(el("h2", "section-title", "How do you want to practise?"));
    const list = el("div", "mode-list");
    modesFor(topic).forEach(mode => {
      const meta = MODE_META[mode];
      const b = el("button", "mode-card");
      b.type = "button";
      const mt = el("div", "mode-text");
      mt.appendChild(el("span", "mode-title", meta.title));
      mt.appendChild(el("span", "mode-desc", meta.desc));
      b.appendChild(mt);
      b.appendChild(el("span", "mode-go", "→"));
      b.addEventListener("click", () => startMode(topic, mode, level));
      list.appendChild(b);
    });
    wrap.appendChild(list);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* =========================== EXERCISE GENERATION ====================== */
  const MAX_Q = 10;

  function distractorsEn(pool, correctEn, n) {
    const opts = shuffle(pool.filter(x => x.en !== correctEn).map(x => x.en));
    const seen = new Set(), out = [];
    for (const o of opts) { if (!seen.has(o)) { seen.add(o); out.push(o); } if (out.length === n) break; }
    return out;
  }
  function distractorsTa(pool, correctTa, n) {
    const opts = shuffle(pool.filter(x => x.ta !== correctTa));
    return opts.slice(0, n);
  }

  function genChoice(pool) {
    const items = sample(pool, Math.min(MAX_Q, pool.length));
    return items.map(item => {
      const ta2en = Math.random() < 0.5 || pool.length < 4;
      if (ta2en) {
        const choices = shuffle([item.en].concat(distractorsEn(pool, item.en, 3)));
        return { type: "select", prompt: item.ta, promptSub: item.tr, key: wkey(item),
                 ask: "What does this mean?", choices, answer: item.en };
      } else {
        const others = distractorsTa(pool, item.ta, 3);
        const choices = shuffle([item].concat(others));
        const subFor = {}; choices.forEach(c => subFor[c.ta] = c.tr);
        return { type: "select", prompt: item.en, promptSub: "", key: wkey(item),
                 ask: "How do you say this in Tamil?",
                 choices: choices.map(c => c.ta), answer: item.ta, subFor };
      }
    });
  }

  function genMatch(pool, groupSize) {
    const n = groupSize || 5;
    const items = shuffle(pool);
    const boards = [];
    for (let i = 0; i < items.length && boards.length < 3; i += n) {
      const group = items.slice(i, i + n);
      if (group.length < 3) break;
      boards.push({ type: "match", title: "Match Tamil to English",
        keys: group.map(wkey),
        pairs: group.map(x => ({ ta: x.ta, tr: x.tr, en: x.en })) });
    }
    return boards.length ? boards : [{ type: "match", title: "Match Tamil to English",
      pairs: items.slice(0, 4).map(x => ({ ta: x.ta, tr: x.tr, en: x.en })) }];
  }

  function genType(pool) {
    const items = sample(pool, Math.min(MAX_Q, pool.length));
    return items.map(item => {
      const ta2en = Math.random() < 0.5;
      if (ta2en) {
        const accept = item.en.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
        return { type: "type", prompt: item.ta, promptSub: item.tr, key: wkey(item),
                 ask: "Type the meaning in English", accept };
      } else {
        return { type: "type", prompt: item.en, promptSub: "", key: wkey(item),
                 ask: "Type it in Tamil (transliteration is fine)",
                 accept: [item.ta, item.tr, fold(item.tr)] };
      }
    });
  }

  function genListen(pool) {
    const items = sample(pool, Math.min(MAX_Q, pool.length));
    return items.map(item => ({
      type: "listen", audio: item.ta, tr: item.tr, key: wkey(item),
      choices: shuffle([item.en].concat(distractorsEn(pool, item.en, 3))),
      answer: item.en,
    }));
  }

  function genSpeak(pool) {
    const items = sample(pool, Math.min(MAX_Q, pool.length));
    return items.map(item => ({
      type: "speak", ta: item.ta, tr: item.tr, en: item.en, key: wkey(item),
    }));
  }

  function genBuild(sentences) {
    const items = sample(sentences, Math.min(MAX_Q, sentences.length));
    // global token bank for distractors
    const bank = [];
    sentences.forEach(s => s.words.forEach(w => bank.push(w)));
    return items.map(s => {
      const answer = s.words.map(w => w.ta);
      const tr = {}; s.words.forEach(w => tr[w.ta] = w.tr);
      const extras = shuffle(bank.filter(w => !answer.includes(w.ta)));
      const pool = [];
      for (const w of extras) {
        if (pool.some(p => p.ta === w.ta)) continue;
        pool.push(w); tr[w.ta] = w.tr;
        if (pool.length === Math.min(3, extras.length)) break;
      }
      return { type: "build", prompt: s.en, promptSub: "", en: "Tap the words in order",
               key: wkey(s), answer, pool: pool.map(w => w.ta), tr };
    });
  }

  function genTranslate(sentences) {
    const items = sample(sentences, Math.min(MAX_Q, sentences.length));
    return items.map(s => {
      const others = shuffle(sentences.filter(x => x.en !== s.en)).slice(0, 3).map(x => x.en);
      return { type: "select", prompt: s.ta, promptSub: s.tr, key: wkey(s),
               ask: "What does this mean?", choices: shuffle([s.en].concat(others)), answer: s.en };
    });
  }

  // English → Tamil: read the English sentence, choose the correct Tamil one.
  function genEn2Ta(sentences) {
    const items = sample(sentences, Math.min(MAX_Q, sentences.length));
    return items.map(s => {
      const others = shuffle(sentences.filter(x => x.ta !== s.ta)).slice(0, 3);
      const all = [s].concat(others);
      const subFor = {}; all.forEach(x => subFor[x.ta] = x.tr);
      return { type: "select", prompt: s.en, promptSub: "", key: wkey(s),
               ask: "Choose the Tamil sentence:", choices: all.map(x => x.ta),
               answer: s.ta, subFor };
    });
  }

  // Type the whole sentence in Tamil (script or transliteration both accepted).
  function genSentenceType(sentences) {
    const items = sample(sentences, Math.min(MAX_Q, sentences.length));
    return items.map(s => ({
      type: "type", prompt: s.en, promptSub: "", key: wkey(s),
      ask: "Type this sentence in Tamil (transliteration is fine)",
      accept: [s.ta, s.tr, fold(s.tr)],
    }));
  }

  // Complete the couplet: show line one, choose the correct second line.
  function genKuralLine(kurals) {
    const usable = kurals.filter(k => k.l1 && k.l2);
    if (usable.length < 4) return [];
    const items = sample(usable, Math.min(MAX_Q, usable.length));
    return items.map(k => {
      const others = shuffle(usable.filter(x => x.l2 !== k.l2)).slice(0, 3);
      const all = [k].concat(others);
      const subFor = {}; all.forEach(x => subFor[x.l2] = x.tr2);
      return { type: "select", prompt: k.l1, promptSub: k.tr1,
               ask: "Which line completes this kural?",
               choices: all.map(x => x.l2), answer: k.l2, subFor };
    });
  }

  // Conjugation quiz: prompt an English clause; distractors are OTHER forms of
  // the SAME verb, so you must pick the correct person + tense.
  function genConjugate(tables) {
    const usable = tables.filter(t => t.forms && t.forms.length >= 4);
    if (!usable.length) return [];
    const order = shuffle(usable);
    const items = [];
    for (let i = 0; i < MAX_Q; i++) {
      const t = order[i % order.length];
      const form = t.forms[Math.floor(Math.random() * t.forms.length)];
      const others = shuffle(t.forms.filter(f => f.ta !== form.ta)).slice(0, 3);
      const subFor = {}; [form].concat(others).forEach(f => subFor[f.ta] = f.tr);
      items.push({ type: "select", prompt: form.en, promptSub: "(to " + t.en + ")",
                   ask: "Say this in Tamil:", key: wkey(form),
                   choices: shuffle([form.ta].concat(others.map(f => f.ta))),
                   answer: form.ta, subFor });
    }
    return items;
  }
  function genConjugateType(forms) {
    const items = sample(forms, Math.min(MAX_Q, forms.length));
    return items.map(f => ({ type: "type", prompt: f.en, promptSub: "", key: wkey(f),
      ask: "Type it in Tamil (transliteration is fine)", accept: [f.ta, f.tr, fold(f.tr)] }));
  }

  // strip diacritics so typed plain-ASCII transliteration is accepted
  function fold(s) {
    return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[ṭṇṟḷḻṅñ]/gi, m => ({ "ṭ":"t","ṇ":"n","ṟ":"r","ḷ":"l","ḻ":"zh","ṅ":"ng","ñ":"ny" }[m.toLowerCase()] || m));
  }

  /* ============================ SESSION RUNNER ========================== */
  function startMode(topic, mode, level) {
    state.practiced[topic.id] = true; save();

    if (mode === "flash") return startFlashcards(topic, level);
    if (mode === "kread") return renderKuralReader(topic);

    const vpool = applyLevel(vocabPoolFor(topic), level);
    const spool = applyLevel(sentencePoolFor(topic), level);
    let queue = [];
    if (mode === "choice")         queue = genChoice(vpool);
    else if (mode === "match")     queue = genMatch(vpool);
    else if (mode === "type")      queue = topic.pool === "conjugation" ? genConjugateType(vpool) : genType(vpool);
    else if (mode === "listen")    queue = genListen(vpool);
    else if (mode === "speak")     queue = genSpeak(vpool);
    else if (mode === "build")     queue = genBuild(spool);
    else if (mode === "translate") queue = genTranslate(topic.pool === "kural" ? vpool : spool);
    else if (mode === "en2ta")     queue = genEn2Ta(spool);
    else if (mode === "smatch")    queue = genMatch(topic.pool === "kural" ? vpool : spool, topic.pool === "kural" ? 3 : 4);
    else if (mode === "stype")     queue = genSentenceType(spool);
    else if (mode === "slisten")   queue = genListen(topic.pool === "listening" ? vpool : spool);
    else if (mode === "kline")     queue = genKuralLine(KURAL);
    else if (mode === "conjugate") queue = genConjugate(CONJUGATION);

    if (!queue.length) { alert("Not enough content for this mode yet."); return; }

    const session = { topic, mode, level, queue, idx: 0, total: queue.length, correct: 0 };
    renderExercise(session);
  }

  function renderExercise(session) {
    if (session.idx >= session.queue.length) return finishSession(session);
    const ex = session.queue[session.idx];
    switch (ex.type) {
      case "select": return renderSelect(session, ex);
      case "match":  return renderMatch(session, ex);
      case "build":  return renderBuild(session, ex);
      case "type":   return renderType(session, ex);
      case "listen": return renderListen(session, ex);
      case "speak":  return renderSpeak(session, ex);
      default:       return advance(session, true);
    }
  }

  function advance(session, wasCorrect, exercise) {
    recordKeys(exercise, wasCorrect); save();
    if (wasCorrect) session.correct++;
    else if (exercise) {
      const insertAt = Math.min(session.queue.length, session.idx + 3);
      session.queue.splice(insertAt, 0, exercise);
      session.total++;
    }
    session.idx++;
    renderExercise(session);
  }

  /* ------------------------- Shared lesson chrome ------------------------ */
  function lessonChrome(session, bodyBuilder) {
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "lesson");
    wrap.style.setProperty("--tc", session.topic.color);

    const head = el("div", "lesson-head");
    const quit = el("button", "quit", "×");
    quit.setAttribute("aria-label", "Quit");
    quit.addEventListener("click", () => renderTopic(session.topic));
    head.appendChild(quit);

    const bar = el("div", "progress");
    const fill = el("div", "progress-fill");
    fill.style.width = (session.total ? (session.idx / session.total) * 100 : 0) + "%";
    bar.appendChild(fill);
    head.appendChild(bar);
    wrap.appendChild(head);

    const body = el("div", "lesson-body");
    bodyBuilder(body);
    wrap.appendChild(body);
    app.appendChild(wrap);
    window.scrollTo(0, 0);
    return wrap;
  }

  function footerCheck(body, opts) {
    const foot = el("div", "check-foot");
    const btn = el("button", "btn btn-primary", opts.label || "Check");
    btn.disabled = !!opts.disabled;
    btn.addEventListener("click", opts.onClick);
    foot.appendChild(btn);
    body.appendChild(foot);
    return { foot, btn };
  }

  function showResult(body, foot, isCorrect, correctText, onNext) {
    foot.classList.add(isCorrect ? "ok" : "bad");
    const banner = el("div", "result " + (isCorrect ? "ok" : "bad"));
    banner.appendChild(el("div", "result-title", isCorrect ? "Correct" : "Not quite"));
    if (!isCorrect && correctText) banner.appendChild(el("div", "result-sol", "Answer: " + correctText));
    foot.innerHTML = "";
    foot.appendChild(banner);
    const next = el("button", "btn " + (isCorrect ? "btn-primary" : "btn-danger"), "Continue");
    next.addEventListener("click", onNext);
    foot.appendChild(next);
    next.focus();
  }

  /* ------------------------------ SELECT --------------------------------- */
  function renderSelect(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", ex.ask || "Choose the correct answer"));

      const prompt = el("div", "prompt-card");
      const pmain = el("div", "prompt-main");
      pmain.appendChild(el("span", "prompt-text", ex.prompt));
      if (isTamil(ex.prompt)) pmain.appendChild(speaker(ex.prompt));
      prompt.appendChild(pmain);
      if (ex.promptSub) prompt.appendChild(el("div", "prompt-sub", ex.promptSub));
      body.appendChild(prompt);
      if (isTamil(ex.prompt)) speak(ex.prompt);

      let selected = null;
      const grid = el("div", "choices");
      shuffle(ex.choices).forEach((choice, i) => {
        const c = el("button", "choice");
        c.type = "button";
        c.appendChild(el("span", "choice-num", String(i + 1)));
        c.appendChild(el("span", "choice-text", choice));
        if (isTamil(choice)) {
          if (ex.subFor && ex.subFor[choice]) c.appendChild(el("span", "choice-sub", ex.subFor[choice]));
          c.appendChild(speaker(choice));
        }
        c.addEventListener("click", () => {
          if (foot.classList.contains("ok") || foot.classList.contains("bad")) return;
          grid.querySelectorAll(".choice").forEach(x => x.classList.remove("sel"));
          c.classList.add("sel");
          selected = choice; btn.disabled = false;
        });
        grid.appendChild(c);
      });
      body.appendChild(grid);
      body.appendChild(keyHint("1-4=choose|↵=check|esc=quit"));
      setKeys(session, choiceKeys(body, grid));

      const { foot, btn } = footerCheck(body, {
        disabled: true,
        onClick: () => {
          const ok = selected === ex.answer;
          grid.querySelectorAll(".choice").forEach(x => {
            const t = $(".choice-text", x).textContent;
            if (t === ex.answer) x.classList.add("correct");
            else if (t === selected) x.classList.add("wrong");
            x.disabled = true;
          });
          showResult(body, foot, ok, ex.answer, () => advance(session, ok, ex));
        },
      });
    });
  }

  /* ------------------------------- MATCH --------------------------------- */
  function renderMatch(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", ex.title || "Tap the matching pairs"));

      const board = el("div", "match-board");
      const leftCol = el("div", "match-col");
      const rightCol = el("div", "match-col");
      const left = shuffle(ex.pairs.map((p, i) => ({ ...p, i })));
      const right = shuffle(ex.pairs.map((p, i) => ({ ...p, i })));

      let pickLeft = null, pickRight = null, matched = 0, mistakes = 0;
      function clearPick() {
        if (pickLeft) pickLeft.btn.classList.remove("sel");
        if (pickRight) pickRight.btn.classList.remove("sel");
        pickLeft = pickRight = null;
      }
      function tryMatch() {
        if (!pickLeft || !pickRight) return;
        if (pickLeft.i === pickRight.i) {
          [pickLeft, pickRight].forEach(p => { p.btn.classList.add("matched"); p.btn.disabled = true; });
          matched++; clearPick();
          if (matched === ex.pairs.length) {
            const ok = mistakes === 0;
            showResult(body, foot, ok, ok ? "" : "Review the pairs above.", () => advance(session, ok, ex));
          }
        } else {
          const a = pickLeft, b = pickRight;
          a.btn.classList.add("miss"); b.btn.classList.add("miss");
          mistakes++;
          setTimeout(() => { a.btn.classList.remove("miss", "sel"); b.btn.classList.remove("miss", "sel"); }, 500);
          clearPick();
        }
      }
      left.forEach(p => {
        const b = el("button", "match-tile");
        b.type = "button";
        b.appendChild(el("span", "match-ta", p.ta));
        if (p.tr) b.appendChild(el("span", "match-tr", p.tr));
        b.addEventListener("click", () => {
          if (b.disabled) return;
          if (pickLeft) pickLeft.btn.classList.remove("sel");
          pickLeft = { i: p.i, btn: b }; b.classList.add("sel"); speak(p.ta); tryMatch();
        });
        leftCol.appendChild(b);
      });
      right.forEach(p => {
        const b = el("button", "match-tile", p.en);
        b.type = "button";
        b.addEventListener("click", () => {
          if (b.disabled) return;
          if (pickRight) pickRight.btn.classList.remove("sel");
          pickRight = { i: p.i, btn: b }; b.classList.add("sel"); tryMatch();
        });
        rightCol.appendChild(b);
      });
      board.appendChild(leftCol); board.appendChild(rightCol);
      body.appendChild(board);

      const foot = el("div", "check-foot");
      foot.appendChild(el("div", "hint", "Tap a Tamil word, then its English match."));
      body.appendChild(foot);
      body.appendChild(keyHint("↑↓=move|←→=switch column|↵=select|esc=quit"));

      /* Arrow keys drive a focus cursor over the two columns; Enter/Space
       * activate the focused tile natively. */
      setKeys(session, (e) => {
        if (e.key === "Enter" || e.key === " " || e.code === "Space") return;  // native
        const live = (col) => Array.prototype.slice.call(
          col.querySelectorAll(".match-tile:not([disabled])"));
        const L = live(leftCol), R = live(rightCol);
        const inL = L.indexOf(document.activeElement), inR = R.indexOf(document.activeElement);
        const here = inL >= 0 ? L : inR >= 0 ? R : null;
        const idx = inL >= 0 ? inL : inR;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!here) { (L[0] || R[0] || {}).focus && (L[0] || R[0]).focus(); return; }
          focusMove(here, e.key === "ArrowDown" ? 1 : -1);
          return;
        }
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const target = (inL >= 0) ? R : L;                 // jump columns
          if (!target.length) return;
          (target[Math.min(idx < 0 ? 0 : idx, target.length - 1)] || target[0]).focus();
        }
      });
    });
  }

  /* -------------------------------- BUILD -------------------------------- */
  function renderBuild(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", "Translate this sentence"));
      const prompt = el("div", "prompt-card");
      prompt.appendChild(el("div", "prompt-main", ex.prompt));
      if (ex.en) prompt.appendChild(el("div", "prompt-hint", ex.en));
      body.appendChild(prompt);

      const answerRow = el("div", "build-answer"); body.appendChild(answerRow);
      const bank = el("div", "build-bank"); body.appendChild(bank);
      const chosen = [];
      const trOf = t => (ex.tr && ex.tr[t]) ? ex.tr[t] : "";
      function makeToken(t) {
        const b = el("button", "token");
        b.type = "button";
        b.appendChild(el("span", "token-ta", t));
        if (trOf(t)) b.appendChild(el("span", "token-tr", trOf(t)));
        return b;
      }
      shuffle(ex.answer.concat(ex.pool || [])).forEach((t, idx) => {
        const b = makeToken(t); b.dataset.uid = idx;
        b.addEventListener("click", () => {
          if (b.classList.contains("used")) return;
          b.classList.add("used");
          chosen.push({ t, uid: idx });
          const chip = makeToken(t);
          chip.addEventListener("click", () => {
            const pos = chosen.findIndex(c => c.uid === idx);
            if (pos >= 0) chosen.splice(pos, 1);
            chip.remove(); b.classList.remove("used"); btn.disabled = chosen.length === 0;
          });
          if (isTamil(t)) speak(t);
          answerRow.appendChild(chip); btn.disabled = chosen.length === 0;
        });
        bank.appendChild(b);
      });
      const { foot, btn } = footerCheck(body, {
        disabled: true,
        onClick: () => {
          const got = chosen.map(c => c.t);
          const ok = got.length === ex.answer.length && got.every((t, i) => t === ex.answer[i]);
          showResult(body, foot, ok, ex.answer.join(" "), () => advance(session, ok, ex));
        },
      });
      body.appendChild(keyHint("1-9=add word|⌫=undo|↵=check|esc=quit"));

      setKeys(session, (e) => {
        const free = Array.prototype.slice.call(bank.querySelectorAll(".token:not(.used)"));
        if (/^[1-9]$/.test(e.key)) {
          const pick = free[parseInt(e.key, 10) - 1];
          if (pick) { e.preventDefault(); pick.click(); }
          return;
        }
        if (e.key === "Backspace") {
          e.preventDefault();
          const last = answerRow.lastElementChild;
          if (last) last.click();                       // chips remove themselves
          return;
        }
        if (ARROW_NEXT[e.key]) { e.preventDefault(); focusMove(free, 1); return; }
        if (ARROW_PREV[e.key]) { e.preventDefault(); focusMove(free, -1); return; }
        if (e.key === "Enter") {
          if (e.target && e.target.classList && e.target.classList.contains("btn")) return;
          const live = body.querySelector(".check-foot .btn:not([disabled])");
          if (live) { e.preventDefault(); live.click(); }
        }
      });
    });
  }

  /* -------------------------------- TYPE --------------------------------- */
  function normalize(s) {
    return (s || "").toLowerCase().trim().replace(/[.,!?;:()"'`]/g, "").replace(/\s+/g, " ");
  }
  function renderType(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", ex.ask || "Type the answer"));
      const prompt = el("div", "prompt-card");
      const pmain = el("div", "prompt-main");
      pmain.appendChild(el("span", "prompt-text", ex.prompt));
      if (isTamil(ex.prompt)) pmain.appendChild(speaker(ex.prompt));
      prompt.appendChild(pmain);
      if (ex.promptSub) prompt.appendChild(el("div", "prompt-sub", ex.promptSub));
      body.appendChild(prompt);
      if (isTamil(ex.prompt)) speak(ex.prompt);

      const input = el("input", "type-input");
      input.type = "text"; input.autocapitalize = "off"; input.autocomplete = "off";
      input.spellcheck = false; input.placeholder = "Type here…";
      body.appendChild(input);

      function check() {
        const val = normalize(input.value); if (!val) return;
        const ok = ex.accept.some(a => normalize(a) === val || normalize(fold(a)) === normalize(fold(input.value)));
        input.disabled = true; input.classList.add(ok ? "ok" : "bad");
        showResult(body, foot, ok, ex.accept[0], () => advance(session, ok, ex));
      }
      const { foot, btn } = footerCheck(body, { disabled: true, onClick: check });
      body.appendChild(keyHint("↵=check|esc=quit"));
      input.addEventListener("input", () => { btn.disabled = !input.value.trim(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim() && !input.disabled) check();
      });
      // Escape works even while the field has focus; Enter on the result screen
      // continues without needing to leave the keyboard.
      setKeys(session, (e) => {
        if (e.key === "Enter" && input.disabled) {
          if (e.target && e.target.classList && e.target.classList.contains("btn")) return;
          const live = body.querySelector(".check-foot .btn:not([disabled])");
          if (live) { e.preventDefault(); live.click(); }
        }
      });
      setTimeout(() => input.focus(), 50);
    });
  }

  /* ------------------------------- LISTEN -------------------------------- */
  function renderListen(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", "What did you hear?"));
      if (!("speechSynthesis" in window) || !taVoice) {
        body.appendChild(el("p", "hint",
          "Note: no Tamil voice found on this device, so the transliteration is shown to help."));
      }
      const big = el("div", "listen-card");
      const play = el("button", "listen-play");
      play.innerHTML =
        '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' +
        '<path d="M4 9.5h3.2L12 5v14l-4.8-4.5H4z" fill="currentColor"/>' +
        '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" ' +
        'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      play.type = "button";
      play.addEventListener("click", () => speak(ex.audio));
      big.appendChild(play);
      // If there's no Tamil voice, reveal transliteration so the mode still works.
      if (!taVoice) big.appendChild(el("div", "listen-tr", ex.tr));
      body.appendChild(big);
      speak(ex.audio);

      let selected = null;
      const grid = el("div", "choices");
      shuffle(ex.choices).forEach((choice, i) => {
        const c = el("button", "choice");
        c.type = "button";
        c.appendChild(el("span", "choice-num", String(i + 1)));
        c.appendChild(el("span", "choice-text", choice));
        c.addEventListener("click", () => {
          if (foot.classList.contains("ok") || foot.classList.contains("bad")) return;
          grid.querySelectorAll(".choice").forEach(x => x.classList.remove("sel"));
          c.classList.add("sel"); selected = choice; btn.disabled = false;
        });
        grid.appendChild(c);
      });
      body.appendChild(grid);
      body.appendChild(keyHint("1-4=choose|space=replay|↵=check|esc=quit"));

      const baseKeys = choiceKeys(body, grid);
      setKeys(session, (e) => {
        if (e.key === " " || e.code === "Space") {
          if (e.target && e.target.tagName === "BUTTON") return;   // native activation
          e.preventDefault(); speak(ex.audio); return;
        }
        baseKeys(e);
      });

      const { foot, btn } = footerCheck(body, {
        disabled: true,
        onClick: () => {
          const ok = selected === ex.answer;
          grid.querySelectorAll(".choice").forEach(x => {
            const t = $(".choice-text", x).textContent;
            if (t === ex.answer) x.classList.add("correct");
            else if (t === selected) x.classList.add("wrong");
            x.disabled = true;
          });
          showResult(body, foot, ok, ex.answer + "  (" + ex.audio + ")", () => advance(session, ok, ex));
        },
      });
    });
  }

  /* ------------------------------- SPEAK ---------------------------------
   * Uses the Web Speech API (ta-IN) to hear you say the word. Where speech
   * recognition isn't available, it falls back to an honest self-check. */
  function speechRecog() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    try { const r = new SR(); r.lang = "ta-IN"; r.interimResults = false; r.maxAlternatives = 5; return r; }
    catch (e) { return null; }
  }
  function speechMatches(alts, ex) {
    const targets = [ex.ta, ex.tr, fold(ex.tr)].map(t => normalize(t).replace(/\s+/g, ""));
    return alts.some(a => {
      const n = normalize(a).replace(/\s+/g, "");
      const nf = normalize(fold(a)).replace(/\s+/g, "");
      return targets.includes(n) || targets.includes(nf) ||
             targets.some(t => t && t.length >= 3 && (t.includes(n) || n.includes(t)) && n.length >= 3);
    });
  }
  function micSvg() {
    return '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' +
      '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/>' +
      '<path d="M6 11a6 6 0 0 0 12 0M12 17v3" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round"/></svg>';
  }
  function renderSpeak(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", "Say it in Tamil"));
      const prompt = el("div", "prompt-card");
      const pmain = el("div", "prompt-main");
      pmain.appendChild(el("span", "prompt-text", ex.ta));
      pmain.appendChild(speaker(ex.ta));
      prompt.appendChild(pmain);
      prompt.appendChild(el("div", "prompt-sub", ex.tr + " · " + ex.en));
      body.appendChild(prompt);

      const stage = el("div", "speak-stage");
      const mic = el("button", "mic-btn");
      mic.type = "button";
      mic.innerHTML = micSvg();
      mic.setAttribute("aria-label", "Tap and speak");
      const status = el("div", "speak-status", "Tap the mic and say the word");
      const heard = el("div", "speak-heard", "");
      stage.appendChild(mic); stage.appendChild(status); stage.appendChild(heard);
      body.appendChild(stage);

      const recog = speechRecog();
      let done = false;
      const { foot } = footerCheck(body, {
        label: "Skip",
        onClick: () => { if (!done) advance(session, false, ex); },
      });
      body.appendChild(keyHint("space=speak|r=hear it|↵=continue|esc=quit"));

      setKeys(session, (e) => {
        if (e.target && e.target.tagName === "BUTTON" &&
            (e.key === "Enter" || e.key === " " || e.code === "Space")) return;
        if (e.key === " " || e.code === "Space") { e.preventDefault(); mic.click(); return; }
        if (e.key === "r" || e.key === "R") { e.preventDefault(); speak(ex.ta); return; }
        if (e.key === "Enter") {
          const live = body.querySelector(".check-foot .btn:not([disabled])");
          if (live) { e.preventDefault(); live.click(); }
        }
      });

      function finish(ok, heardText) {
        if (done) return; done = true;
        mic.classList.remove("listening");
        showResult(body, foot, ok,
          ok ? "" : ex.ta + "  (" + ex.tr + ")" + (heardText ? " — heard: " + heardText : ""),
          () => advance(session, ok, ex));
      }

      if (!recog) {
        status.textContent = "Speech recognition isn't available on this browser — say it aloud, then check yourself honestly.";
        mic.classList.add("hidden");
        speak(ex.ta);
        foot.innerHTML = "";
        const play = el("button", "btn btn-ghost", "Hear it again");
        play.addEventListener("click", () => speak(ex.ta));
        const good = el("button", "btn btn-primary", "I said it right");
        good.addEventListener("click", () => advance(session, true, ex));
        const nah = el("button", "btn btn-danger", "Need practice");
        nah.addEventListener("click", () => advance(session, false, ex));
        foot.appendChild(play); foot.appendChild(good); foot.appendChild(nah);
        return;
      }

      mic.addEventListener("click", () => {
        if (done) return;
        try { speechSynthesis.cancel(); } catch (e) {}
        heard.textContent = "";
        status.textContent = "Listening…";
        mic.classList.add("listening");
        try { recog.start(); } catch (e) {}
      });
      recog.onresult = (evt) => {
        const alts = [];
        for (let i = 0; i < evt.results.length; i++)
          for (let j = 0; j < evt.results[i].length; j++) alts.push(evt.results[i][j].transcript);
        const shown = alts[0] || "";
        heard.textContent = shown ? "Heard: " + shown : "";
        finish(speechMatches(alts, ex), shown);
      };
      recog.onerror = (e) => {
        mic.classList.remove("listening");
        status.textContent = (e && e.error === "not-allowed")
          ? "Microphone blocked — allow mic access, or tap Skip."
          : "Didn't catch that — tap the mic to try again.";
      };
      recog.onend = () => {
        mic.classList.remove("listening");
        if (!done && status.textContent === "Listening…") status.textContent = "Tap the mic to try again.";
      };
    });
  }

  /* --------------------------- KURAL READER ------------------------------
   * Not a scored exercise — a quiet reading view. Each couplet is shown on
   * its two metrical lines with transliteration, meaning and a speak button. */
  function renderKuralReader(topic) {
    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "lesson kural-reader");
    wrap.style.setProperty("--tc", topic.color);

    const head = el("div", "lesson-head");
    const quit = el("button", "quit", "×");
    quit.setAttribute("aria-label", "Back");
    quit.addEventListener("click", () => renderTopic(topic));
    head.appendChild(quit);
    head.appendChild(el("div", "kural-head-title", "திருக்குறள்"));
    wrap.appendChild(head);

    const body = el("div", "lesson-body");
    body.appendChild(el("p", "hint",
      "Couplets from the Tirukkuṟaḷ of Tiruvaḷḷuvar, with the standard numbering."));

    KURAL.forEach(k => {
      const card = el("div", "kural-card");
      const top = el("div", "kural-top");
      top.appendChild(el("span", "kural-num", "குறள் " + k.n));
      top.appendChild(el("span", "kural-chapter", k.chapter + " · " + k.chapterEn));
      card.appendChild(top);

      const lines = el("div", "kural-lines");
      lines.appendChild(el("div", "kural-line", k.l1));
      lines.appendChild(el("div", "kural-line", k.l2));
      card.appendChild(lines);
      card.appendChild(speaker(k.ta));

      card.appendChild(el("div", "kural-tr", k.tr1));
      card.appendChild(el("div", "kural-tr", k.tr2));
      card.appendChild(el("div", "kural-en", k.en));
      body.appendChild(card);
    });

    const foot = el("div", "check-foot");
    const done = el("button", "btn btn-primary", "Done reading");
    done.addEventListener("click", () => { grantXp(topic, 0, 0); renderTopic(topic); });
    foot.appendChild(done);
    body.appendChild(foot);

    wrap.appendChild(body);
    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ----------------------------- FLASHCARDS ------------------------------ */
  function startFlashcards(topic, level) {
    let items;
    if (topic.kind === "practice") {
      items = topic.pool === "sentence" ? SENTENCES
            : topic.pool === "conjugation" ? conjugationForms()
            : topic.pool === "kural" ? KURAL
            : topic.pool === "review" ? dueItems()
            : topic.pool === "custom" ? (topic.items || [])
            : (topic.pool === "mixed" || topic.pool === "listening")
              ? VOCAB.concat(SENTENCES, conjugationForms())
            : VOCAB;
    } else {
      items = topic.kind === "sentence" ? topicSentences(topic.id) : topicVocab(topic.id);
    }
    const cards = shuffle(applyLevel(items, level));
    let i = 0, flipped = false;

    function render() {
      renderTopbar();
      app.innerHTML = ""; onKey = null;
      const wrap = el("div", "lesson");
      wrap.style.setProperty("--tc", topic.color);

      const head = el("div", "lesson-head");
      const quit = el("button", "quit", "×");
      quit.addEventListener("click", () => renderTopic(topic));
      head.appendChild(quit);
      const bar = el("div", "progress");
      const fill = el("div", "progress-fill");
      fill.style.width = ((i) / cards.length) * 100 + "%";
      bar.appendChild(fill); head.appendChild(bar);
      head.appendChild(el("div", "flash-count", (i + 1) + " / " + cards.length));
      wrap.appendChild(head);

      const body = el("div", "lesson-body");
      const card = cards[i];
      const cardEl = el("div", "flashcard" + (flipped ? " flipped" : ""));
      const front = el("div", "flash-face flash-front");
      const ftop = el("div", "flash-ta");
      ftop.appendChild(el("span", "ta-big", card.ta));
      ftop.appendChild(speaker(card.ta));
      front.appendChild(ftop);
      front.appendChild(el("div", "flash-tap", "tap to flip"));
      const backFace = el("div", "flash-face flash-back");
      backFace.appendChild(el("div", "flash-tr", card.tr));
      backFace.appendChild(el("div", "flash-en", card.en));
      cardEl.appendChild(front); cardEl.appendChild(backFace);
      cardEl.addEventListener("click", () => { flipped = !flipped; render(); });
      body.appendChild(cardEl);
      if (!flipped) speak(card.ta);

      const foot = el("div", "check-foot flash-nav");
      const prev = el("button", "btn btn-ghost", "‹ Back");
      prev.disabled = i === 0;
      const goPrev = () => { if (i > 0) { i--; flipped = false; render(); } };
      prev.addEventListener("click", goPrev);
      const next = el("button", "btn btn-primary", i === cards.length - 1 ? "Finish" : "Next ›");
      const goNext = () => {
        if (i === cards.length - 1) { grantXp(topic, cards.length, cards.length); renderTopic(topic); }
        else { i++; flipped = false; render(); }
      };
      next.addEventListener("click", goNext);
      foot.appendChild(prev); foot.appendChild(next);
      body.appendChild(foot);
      body.appendChild(keyHint("←=back|→=next|space=flip|esc=quit"));

      /* ← → move through the deck, Space/↑/↓ flips, Enter advances. */
      setKeys({ topic }, (e) => {
        // A focused button keeps its native Enter/Space activation.
        if (e.target && e.target.tagName === "BUTTON" &&
            (e.key === "Enter" || e.key === " " || e.code === "Space")) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); return; }
        if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); goNext(); return; }
        if (e.key === " " || e.code === "Space" || e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault(); flipped = !flipped; render();
        }
      });

      wrap.appendChild(body);
      app.appendChild(wrap);
      window.scrollTo(0, 0);
    }
    render();
  }

  /* ------------------------------ Finish --------------------------------- */
  function updateStreak() {
    const today = todayStr();
    if (!state.activeDates.includes(today)) {
      state.activeDates.push(today);
      if (state.activeDates.length > 90) state.activeDates = state.activeDates.slice(-90);
    }
    if (state.lastActive === today) return;
    const yesterday = addDays(today, -1);
    state.streak = (state.lastActive === yesterday) ? state.streak + 1 : 1;
    state.lastActive = today;
  }
  function grantXp(topic, correct, total) {
    const gain = 5 + correct * 2;
    state.xp += gain;
    const today = todayStr();
    if (!state.today || state.today.date !== today) state.today = { date: today, xp: 0 };
    state.today.xp += gain;
    updateStreak(); save(); renderTopbar();
    return gain;
  }

  function finishSession(session) {
    const gain = grantXp(session.topic, session.correct, session.total);
    syncSoon();
    if ("speechSynthesis" in window) speechSynthesis.cancel();

    renderTopbar();
    app.innerHTML = ""; onKey = null;
    const wrap = el("div", "lesson done-screen");
    wrap.style.setProperty("--tc", session.topic.color);
    const acc = session.total ? Math.round((session.correct / session.total) * 100) : 100;
    wrap.appendChild(el("div", "big-emoji", acc + "%"));
    wrap.appendChild(el("h2", "done-title", acc >= 80 ? "Well done." : "Keep practising."));

    const stats = el("div", "done-stats");
    [["+" + gain, "XP earned"], [session.correct + " / " + session.total, "Correct"],
     [state.streak, "Day streak"]]
      .forEach(([num, label]) => {
        const s = el("div", "done-stat");
        s.appendChild(el("div", "done-stat-num", num));
        s.appendChild(el("div", "done-stat-label", label));
        stats.appendChild(s);
      });
    wrap.appendChild(stats);

    const foot = el("div", "check-foot");
    const again = el("button", "btn btn-primary", "Practise again");
    again.addEventListener("click", () => startMode(session.topic, session.mode, session.level));
    const more = el("button", "btn btn-ghost", "Choose another mode");
    more.addEventListener("click", () => renderTopic(session.topic));
    foot.appendChild(again); foot.appendChild(more);
    wrap.appendChild(foot);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ------------------------------- Start --------------------------------- */
  renderHome();
  // If a username is already set, quietly pull the latest from the repo and
  // re-render once it lands. Failures are shown on the Account screen only.
  if (acct.username) {
    syncNow({}).then(() => { if (app.querySelector(".home")) renderHome(); });
  }
})();
