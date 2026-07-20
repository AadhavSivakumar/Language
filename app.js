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

  const app = document.getElementById("app");
  const topbar = document.getElementById("topbar");

  /* ----------------------------- Persistence ----------------------------- */
  const SAVE_KEY = "kili-tamil-v2";
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const defaultState = () => ({ xp: 0, streak: 0, lastActive: null, practiced: {} });

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) { return defaultState(); }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  let state = load();

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
    const b = el("button", "spk", "🔊");
    b.type = "button";
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
    return VOCAB.filter(v => v.topic === topicId);
  }
  function topicSentences(topicId) {
    if (topicId === "sentences") return SENTENCES;
    return SENTENCES.filter(s => s.topic === topicId);
  }
  function modesFor(topic) {
    if (topic.kind === "sentence") {
      return ["build", "translate", "flash"];
    }
    const m = ["flash", "choice", "match", "type", "listen"];
    if (topicSentences(topic.id).length >= 2) m.push("build");
    return m;
  }
  const MODE_META = {
    flash:     { icon: "🃏", title: "Flashcards",   desc: "Flip through and learn — no pressure" },
    choice:    { icon: "☑️", title: "Multiple choice", desc: "Pick the right meaning" },
    match:     { icon: "🔗", title: "Matching",     desc: "Tap the matching pairs" },
    type:      { icon: "⌨️", title: "Type it",      desc: "Type the answer yourself" },
    listen:    { icon: "🎧", title: "Listening",    desc: "Hear it, choose the meaning" },
    build:     { icon: "🧩", title: "Build a sentence", desc: "Tap word tiles in order" },
    translate: { icon: "🔤", title: "Translate",    desc: "Read Tamil, choose the English" },
  };

  /* ============================== HOME VIEW ============================== */
  function renderHome() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    renderTopbar();
    app.innerHTML = "";
    const wrap = el("div", "home");

    const hero = el("div", "hero");
    hero.appendChild(el("div", "hero-logo", "🦜"));
    const hg = el("div");
    hg.appendChild(el("h1", "hero-title", "கிளி · Learn Tamil"));
    hg.appendChild(el("p", "hero-sub", "Pick a topic, then choose how you want to practise."));
    hero.appendChild(hg);
    wrap.appendChild(hero);

    wrap.appendChild(el("h2", "section-title", "Choose a topic"));
    const grid = el("div", "topic-grid");
    TOPICS.forEach(topic => {
      const count = topic.kind === "sentence"
        ? topicSentences(topic.id).length + " sentences"
        : topicVocab(topic.id).length + " words";
      const card = el("button", "topic-card");
      card.type = "button";
      card.style.setProperty("--tc", topic.color);
      card.appendChild(el("span", "topic-icon", topic.icon));
      card.appendChild(el("span", "topic-name", topic.title));
      card.appendChild(el("span", "topic-count", count));
      if (state.practiced[topic.id]) card.appendChild(el("span", "topic-badge", "✓"));
      card.addEventListener("click", () => renderTopic(topic));
      grid.appendChild(card);
    });
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

  /* ============================== TOPIC VIEW ============================= */
  function renderTopic(topic) {
    renderTopbar();
    app.innerHTML = "";
    const wrap = el("div", "topic-view");
    wrap.style.setProperty("--tc", topic.color);

    const back = el("button", "back-btn", "← All topics");
    back.addEventListener("click", renderHome);
    wrap.appendChild(back);

    const head = el("div", "topic-head");
    head.appendChild(el("span", "topic-head-icon", topic.icon));
    const ht = el("div");
    ht.appendChild(el("h1", "topic-head-title", topic.title));
    const n = topic.kind === "sentence"
      ? topicSentences(topic.id).length + " sentences"
      : topicVocab(topic.id).length + " words to learn";
    ht.appendChild(el("p", "topic-head-sub", n));
    head.appendChild(ht);
    wrap.appendChild(head);

    wrap.appendChild(el("h2", "section-title", "How do you want to practise?"));
    const list = el("div", "mode-list");
    modesFor(topic).forEach(mode => {
      const meta = MODE_META[mode];
      const b = el("button", "mode-card");
      b.type = "button";
      b.appendChild(el("span", "mode-icon", meta.icon));
      const mt = el("div", "mode-text");
      mt.appendChild(el("span", "mode-title", meta.title));
      mt.appendChild(el("span", "mode-desc", meta.desc));
      b.appendChild(mt);
      b.appendChild(el("span", "mode-go", "▶"));
      b.addEventListener("click", () => startMode(topic, mode));
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
        return { type: "select", prompt: item.ta, promptSub: item.tr,
                 ask: "What does this mean?", choices, answer: item.en };
      } else {
        const others = distractorsTa(pool, item.ta, 3);
        const choices = shuffle([item].concat(others));
        const subFor = {}; choices.forEach(c => subFor[c.ta] = c.tr);
        return { type: "select", prompt: item.en, promptSub: "",
                 ask: "How do you say this in Tamil?",
                 choices: choices.map(c => c.ta), answer: item.ta, subFor };
      }
    });
  }

  function genMatch(pool) {
    const items = shuffle(pool);
    const boards = [];
    for (let i = 0; i < items.length && boards.length < 3; i += 5) {
      const group = items.slice(i, i + 5);
      if (group.length < 3) break;
      boards.push({ type: "match", title: "Match Tamil to English",
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
        return { type: "type", prompt: item.ta, promptSub: item.tr,
                 ask: "Type the meaning in English", accept };
      } else {
        return { type: "type", prompt: item.en, promptSub: "",
                 ask: "Type it in Tamil (transliteration is fine)",
                 accept: [item.ta, item.tr, fold(item.tr)] };
      }
    });
  }

  function genListen(pool) {
    const items = sample(pool, Math.min(MAX_Q, pool.length));
    return items.map(item => ({
      type: "listen", audio: item.ta, tr: item.tr,
      choices: shuffle([item.en].concat(distractorsEn(pool, item.en, 3))),
      answer: item.en,
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
               answer, pool: pool.map(w => w.ta), tr };
    });
  }

  function genTranslate(sentences) {
    const items = sample(sentences, Math.min(MAX_Q, sentences.length));
    return items.map(s => {
      const others = shuffle(sentences.filter(x => x.en !== s.en)).slice(0, 3).map(x => x.en);
      return { type: "select", prompt: s.ta, promptSub: s.tr,
               ask: "What does this mean?", choices: shuffle([s.en].concat(others)), answer: s.en };
    });
  }

  // strip diacritics so typed plain-ASCII transliteration is accepted
  function fold(s) {
    return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[ṭṇṟḷḻṅñ]/gi, m => ({ "ṭ":"t","ṇ":"n","ṟ":"r","ḷ":"l","ḻ":"zh","ṅ":"ng","ñ":"ny" }[m.toLowerCase()] || m));
  }

  /* ============================ SESSION RUNNER ========================== */
  function startMode(topic, mode) {
    state.practiced[topic.id] = true; save();

    if (mode === "flash") return startFlashcards(topic);

    let queue = [];
    if (mode === "choice")        queue = genChoice(topicVocab(topic.id));
    else if (mode === "match")    queue = genMatch(topicVocab(topic.id));
    else if (mode === "type")     queue = genType(topicVocab(topic.id));
    else if (mode === "listen")   queue = genListen(topicVocab(topic.id));
    else if (mode === "build")    queue = genBuild(topicSentences(topic.id));
    else if (mode === "translate")queue = genTranslate(topicSentences(topic.id));

    if (!queue.length) { alert("Not enough content for this mode yet."); return; }

    const session = { topic, mode, queue, idx: 0, total: queue.length, correct: 0 };
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
      default:       return advance(session, true);
    }
  }

  function advance(session, wasCorrect, exercise) {
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
    app.innerHTML = "";
    const wrap = el("div", "lesson");
    wrap.style.setProperty("--tc", session.topic.color);

    const head = el("div", "lesson-head");
    const quit = el("button", "quit", "✕");
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
    banner.appendChild(el("div", "result-title", isCorrect ? "✓  Nice!" : "✗  Not quite"));
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
      shuffle(ex.choices).forEach(choice => {
        const c = el("button", "choice");
        c.type = "button";
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
      input.addEventListener("input", () => { btn.disabled = !input.value.trim(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim() && !input.disabled) check();
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
      const play = el("button", "listen-play", "🔊");
      play.type = "button";
      play.addEventListener("click", () => speak(ex.audio));
      big.appendChild(play);
      // If there's no Tamil voice, reveal transliteration so the mode still works.
      if (!taVoice) big.appendChild(el("div", "listen-tr", ex.tr));
      body.appendChild(big);
      speak(ex.audio);

      let selected = null;
      const grid = el("div", "choices");
      shuffle(ex.choices).forEach(choice => {
        const c = el("button", "choice");
        c.type = "button";
        c.appendChild(el("span", "choice-text", choice));
        c.addEventListener("click", () => {
          if (foot.classList.contains("ok") || foot.classList.contains("bad")) return;
          grid.querySelectorAll(".choice").forEach(x => x.classList.remove("sel"));
          c.classList.add("sel"); selected = choice; btn.disabled = false;
        });
        grid.appendChild(c);
      });
      body.appendChild(grid);

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

  /* ----------------------------- FLASHCARDS ------------------------------ */
  function startFlashcards(topic) {
    const isSentence = topic.kind === "sentence";
    const items = isSentence ? topicSentences(topic.id) : topicVocab(topic.id);
    const cards = shuffle(items);
    let i = 0, flipped = false;

    function render() {
      renderTopbar();
      app.innerHTML = "";
      const wrap = el("div", "lesson");
      wrap.style.setProperty("--tc", topic.color);

      const head = el("div", "lesson-head");
      const quit = el("button", "quit", "✕");
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
      prev.addEventListener("click", () => { if (i > 0) { i--; flipped = false; render(); } });
      const next = el("button", "btn btn-primary", i === cards.length - 1 ? "Finish" : "Next ›");
      next.addEventListener("click", () => {
        if (i === cards.length - 1) { grantXp(topic, cards.length, cards.length); renderTopic(topic); }
        else { i++; flipped = false; render(); }
      });
      foot.appendChild(prev); foot.appendChild(next);
      body.appendChild(foot);

      wrap.appendChild(body);
      app.appendChild(wrap);
      window.scrollTo(0, 0);
    }
    render();
  }

  /* ------------------------------ Finish --------------------------------- */
  function updateStreak() {
    const today = todayStr();
    if (state.lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak = (state.lastActive === yesterday) ? state.streak + 1 : 1;
    state.lastActive = today;
  }
  function grantXp(topic, correct, total) {
    const gain = 5 + correct * 2;
    state.xp += gain; updateStreak(); save(); renderTopbar();
    return gain;
  }

  function finishSession(session) {
    const gain = grantXp(session.topic, session.correct, session.total);
    if ("speechSynthesis" in window) speechSynthesis.cancel();

    renderTopbar();
    app.innerHTML = "";
    const wrap = el("div", "lesson done-screen");
    wrap.style.setProperty("--tc", session.topic.color);
    const acc = session.total ? Math.round((session.correct / session.total) * 100) : 100;
    wrap.appendChild(el("div", "big-emoji", acc >= 80 ? "🎉" : "💪"));
    wrap.appendChild(el("h2", "done-title", acc >= 80 ? "Great work!" : "Keep practising!"));

    const stats = el("div", "done-stats");
    [["+" + gain, "XP earned"], [acc + "%", "Accuracy"], ["🔥 " + state.streak, "Day streak"]]
      .forEach(([num, label]) => {
        const s = el("div", "done-stat");
        s.appendChild(el("div", "done-stat-num", num));
        s.appendChild(el("div", "done-stat-label", label));
        stats.appendChild(s);
      });
    wrap.appendChild(stats);

    const foot = el("div", "check-foot");
    const again = el("button", "btn btn-primary", "Practise again");
    again.addEventListener("click", () => startMode(session.topic, session.mode));
    const more = el("button", "btn btn-ghost", "Choose another mode");
    more.addEventListener("click", () => renderTopic(session.topic));
    foot.appendChild(again); foot.appendChild(more);
    wrap.appendChild(foot);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ------------------------------- Start --------------------------------- */
  renderHome();
})();
