/* ============================================================================
 * Kili · Learn Tamil — client-side app
 * No framework, no build step. State lives in localStorage so it survives
 * reloads and works fully offline once loaded.
 * ==========================================================================*/

(function () {
  "use strict";

  const COURSE = window.COURSE;
  const app = document.getElementById("app");
  const topbar = document.getElementById("topbar");

  /* ----------------------------- Persistence ----------------------------- */
  const SAVE_KEY = "kili-tamil-v1";
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const defaultState = () => ({
    xp: 0,
    streak: 0,
    lastActive: null,      // ISO date of last completed lesson
    hearts: 5,
    heartsDate: todayStr(),
    completed: {},         // { "unitId/lessonId": true }
  });

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  let state = load();

  // Hearts refill each new day.
  if (state.heartsDate !== todayStr()) {
    state.hearts = 5;
    state.heartsDate = todayStr();
    save();
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
  const lessonKey = (u, l) => `${u.id}/${l.id}`;

  /* -------------------------- Tamil text-to-speech ----------------------- */
  let taVoice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices();
    taVoice = voices.find(v => /^ta(-|_|$)/i.test(v.lang)) ||
              voices.find(v => /tamil/i.test(v.name)) || null;
  }
  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
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
  // A small 🔊 button bound to some Tamil text.
  function speaker(text) {
    const b = el("button", "spk", "🔊");
    b.type = "button";
    b.setAttribute("aria-label", "Play pronunciation");
    b.addEventListener("click", (e) => { e.stopPropagation(); speak(text); });
    return b;
  }

  /* ------------------------------ Top bar -------------------------------- */
  function renderTopbar() {
    topbar.hidden = false;
    $("#stat-streak").textContent = state.streak;
    $("#stat-xp").textContent = state.xp;
    $("#stat-hearts").textContent = state.hearts;
  }

  /* ============================== HOME VIEW ============================== */
  function renderHome() {
    renderTopbar();
    app.innerHTML = "";
    const wrap = el("div", "home");

    const hero = el("div", "hero");
    hero.appendChild(el("div", "hero-logo", "🦜"));
    const hg = el("div");
    hg.appendChild(el("h1", "hero-title", "கிளி · Learn Tamil"));
    hg.appendChild(el("p", "hero-sub", "Tap a lesson to begin. Progress saves automatically."));
    hero.appendChild(hg);
    wrap.appendChild(hero);

    let prevDone = true; // first lesson always unlocked
    COURSE.units.forEach((unit, ui) => {
      const section = el("section", "unit");
      section.style.setProperty("--unit-color", unit.color);

      const head = el("div", "unit-head");
      head.appendChild(el("span", "unit-icon", unit.icon));
      const ht = el("div");
      ht.appendChild(el("h2", "unit-title", unit.title));
      ht.appendChild(el("p", "unit-sub", unit.subtitle));
      head.appendChild(ht);
      section.appendChild(head);

      const path = el("div", "path");
      unit.lessons.forEach((lesson, li) => {
        const key = lessonKey(unit, lesson);
        const done = !!state.completed[key];
        const unlocked = prevDone || done;

        const node = el("div", "node" + (done ? " done" : "") + (!unlocked ? " locked" : ""));
        // Gentle left/right stagger like a winding path.
        const offset = Math.sin(li * 1.15) * 34;
        node.style.marginLeft = `${offset}px`;

        const btn = el("button", "bubble");
        btn.type = "button";
        btn.disabled = !unlocked;
        btn.innerHTML = done ? "★" : (unlocked ? "▶" : "🔒");
        btn.setAttribute("aria-label", lesson.title);
        if (unlocked) btn.addEventListener("click", () => startLesson(unit, lesson));
        node.appendChild(btn);
        node.appendChild(el("span", "node-label", lesson.title));
        path.appendChild(node);

        prevDone = done; // next lesson unlocks only when this one is done
      });
      section.appendChild(path);
      wrap.appendChild(section);
    });

    const footer = el("div", "home-footer");
    const reset = el("button", "link-btn", "Reset progress");
    reset.addEventListener("click", () => {
      if (confirm("Reset all progress, XP and streak? This cannot be undone.")) {
        state = defaultState();
        save();
        renderHome();
      }
    });
    footer.appendChild(reset);
    wrap.appendChild(footer);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ============================= LESSON VIEW ============================= */
  function startLesson(unit, lesson) {
    const session = {
      unit, lesson,
      queue: lesson.exercises.slice(),  // exercises still to pass
      idx: 0,
      total: lesson.exercises.length,
      correct: 0,
      xpGain: 0,
      heartsLost: 0,
      finished: false,
    };
    renderExercise(session);
  }

  function lessonChrome(session, bodyBuilder) {
    renderTopbar();
    app.innerHTML = "";
    const wrap = el("div", "lesson");

    // header: quit + progress bar
    const head = el("div", "lesson-head");
    const quit = el("button", "quit", "✕");
    quit.setAttribute("aria-label", "Quit lesson");
    quit.addEventListener("click", () => {
      if (confirm("Quit this lesson? Your progress in it will be lost.")) renderHome();
    });
    head.appendChild(quit);

    const bar = el("div", "progress");
    const fill = el("div", "progress-fill");
    const pct = session.total ? (session.idx / session.total) * 100 : 0;
    fill.style.width = pct + "%";
    bar.appendChild(fill);
    head.appendChild(bar);

    const hearts = el("div", "lesson-hearts", "❤️ " + state.hearts);
    head.appendChild(hearts);
    wrap.appendChild(head);

    const body = el("div", "lesson-body");
    bodyBuilder(body);
    wrap.appendChild(body);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
    return wrap;
  }

  function renderExercise(session) {
    if (state.hearts <= 0) return renderOutOfHearts(session);
    if (session.idx >= session.queue.length) return finishLesson(session);

    const ex = session.queue[session.idx];
    switch (ex.type) {
      case "info":   return renderInfo(session, ex);
      case "select": return renderSelect(session, ex);
      case "match":  return renderMatch(session, ex);
      case "build":  return renderBuild(session, ex);
      case "type":   return renderType(session, ex);
      default:       return advance(session, true); // unknown -> skip
    }
  }

  // Move to the next exercise. If wrong, requeue this one near the end.
  function advance(session, wasCorrect, exercise) {
    if (wasCorrect) {
      session.correct++;
    } else if (exercise) {
      // put it back a few slots later for review
      const insertAt = Math.min(session.queue.length, session.idx + 3);
      session.queue.splice(insertAt, 0, exercise);
      session.total++; // keep the bar honest about extra reps
    }
    session.idx++;
    renderExercise(session);
  }

  /* --------- Footer with a Check / Continue button + feedback banner ------ */
  function footerCheck(body, opts) {
    // opts: { label, disabled, onClick }
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
    const title = el("div", "result-title",
      isCorrect ? "✓  Nice!" : "✗  Not quite");
    banner.appendChild(title);
    if (!isCorrect && correctText) {
      banner.appendChild(el("div", "result-sol", "Answer: " + correctText));
    }
    // Replace the footer button with a Continue button.
    foot.innerHTML = "";
    foot.appendChild(banner);
    const next = el("button", "btn " + (isCorrect ? "btn-primary" : "btn-danger"), "Continue");
    next.addEventListener("click", onNext);
    foot.appendChild(next);
    next.focus();
  }

  function penalize(session) {
    state.hearts = Math.max(0, state.hearts - 1);
    session.heartsLost++;
    save();
    renderTopbar();
  }

  /* ------------------------------- INFO ---------------------------------- */
  function renderInfo(session, ex) {
    lessonChrome(session, (body) => {
      body.appendChild(el("h2", "ex-title", ex.title || "Learn"));
      if (ex.body) body.appendChild(el("p", "info-text", ex.body));

      if (ex.rows && ex.rows.length) {
        const list = el("div", "info-list");
        ex.rows.forEach(r => {
          const row = el("div", "info-row");
          const left = el("div", "info-ta");
          left.appendChild(el("span", "ta-big", r.ta));
          left.appendChild(speaker(r.ta));
          row.appendChild(left);
          const right = el("div", "info-meta");
          if (r.tr) right.appendChild(el("span", "tr", r.tr));
          if (r.en) right.appendChild(el("span", "en", r.en));
          row.appendChild(right);
          list.appendChild(row);
        });
        body.appendChild(list);
      }

      footerCheck(body, {
        label: "Got it",
        onClick: () => advance(session, true),
      });
    });
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

      let selected = null;
      const grid = el("div", "choices");
      shuffle(ex.choices).forEach(choice => {
        const c = el("button", "choice");
        c.type = "button";
        const label = el("span", "choice-text", choice);
        c.appendChild(label);
        if (isTamil(choice)) {
          if (ex.subFor && ex.subFor[choice]) c.appendChild(el("span", "choice-sub", ex.subFor[choice]));
          c.appendChild(speaker(choice));
        }
        c.addEventListener("click", () => {
          if (foot.classList.contains("ok") || foot.classList.contains("bad")) return;
          grid.querySelectorAll(".choice").forEach(x => x.classList.remove("sel"));
          c.classList.add("sel");
          selected = choice;
          btn.disabled = false;
        });
        grid.appendChild(c);
      });
      body.appendChild(grid);

      const { foot, btn } = footerCheck(body, {
        disabled: true,
        onClick: () => {
          const ok = selected === ex.answer;
          if (!ok) penalize(session);
          // color the tiles
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
          pickLeft.btn.classList.add("matched");
          pickRight.btn.classList.add("matched");
          pickLeft.btn.disabled = pickRight.btn.disabled = true;
          matched++;
          clearPick();
          if (matched === ex.pairs.length) {
            const ok = mistakes === 0;
            if (!ok) penalize(session);
            showResult(body, foot, ok,
              ok ? "" : "Review the pairs above.",
              () => advance(session, ok, ex));
          }
        } else {
          const a = pickLeft, b = pickRight;
          a.btn.classList.add("miss"); b.btn.classList.add("miss");
          mistakes++;
          if (mistakes === 1) penalize(session);
          setTimeout(() => {
            a.btn.classList.remove("miss", "sel");
            b.btn.classList.remove("miss", "sel");
          }, 500);
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
          pickLeft = { i: p.i, btn: b };
          b.classList.add("sel");
          speak(p.ta);
          tryMatch();
        });
        leftCol.appendChild(b);
      });
      right.forEach(p => {
        const b = el("button", "match-tile", p.en);
        b.type = "button";
        b.addEventListener("click", () => {
          if (b.disabled) return;
          if (pickRight) pickRight.btn.classList.remove("sel");
          pickRight = { i: p.i, btn: b };
          b.classList.add("sel");
          tryMatch();
        });
        rightCol.appendChild(b);
      });

      board.appendChild(leftCol);
      board.appendChild(rightCol);
      body.appendChild(board);

      // Match has no Check button; it resolves itself. Give a passive footer.
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

      const answerRow = el("div", "build-answer");
      body.appendChild(answerRow);
      const bank = el("div", "build-bank");
      body.appendChild(bank);

      const chosen = []; // tokens in order

      const allTokens = shuffle(ex.answer.concat(ex.pool || []));
      const tokenBtns = new Map();

      function trOf(t) { return ex.tr && ex.tr[t] ? ex.tr[t] : ""; }

      function makeToken(t, where) {
        const b = el("button", "token");
        b.type = "button";
        b.appendChild(el("span", "token-ta", t));
        if (trOf(t)) b.appendChild(el("span", "token-tr", trOf(t)));
        return b;
      }

      function refresh() {
        btn.disabled = chosen.length === 0;
      }

      allTokens.forEach((t, idx) => {
        const b = makeToken(t);
        b.dataset.token = t;
        b.dataset.uid = idx;
        b.addEventListener("click", () => {
          if (b.classList.contains("used")) return;
          b.classList.add("used");
          chosen.push({ t, uid: idx });
          const chip = makeToken(t);
          chip.addEventListener("click", () => {
            // remove from answer, re-enable in bank
            const pos = chosen.findIndex(c => c.uid === idx);
            if (pos >= 0) chosen.splice(pos, 1);
            chip.remove();
            b.classList.remove("used");
            refresh();
          });
          if (isTamil(t)) speak(t);
          answerRow.appendChild(chip);
          refresh();
        });
        tokenBtns.set(idx, b);
        bank.appendChild(b);
      });

      const { foot, btn } = footerCheck(body, {
        disabled: true,
        onClick: () => {
          const got = chosen.map(c => c.t);
          const ok = got.length === ex.answer.length &&
                     got.every((t, i) => t === ex.answer[i]);
          if (!ok) penalize(session);
          showResult(body, foot, ok, ex.answer.join(" "),
            () => advance(session, ok, ex));
        },
      });
    });
  }

  /* -------------------------------- TYPE --------------------------------- */
  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:()"'`]/g, "")
      .replace(/\s+/g, " ");
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

      const input = el("input", "type-input");
      input.type = "text";
      input.autocapitalize = "off";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = "Type here…";
      body.appendChild(input);

      function check() {
        const val = normalize(input.value);
        if (!val) return;
        const ok = ex.accept.some(a => normalize(a) === val);
        if (!ok) penalize(session);
        input.disabled = true;
        input.classList.add(ok ? "ok" : "bad");
        showResult(body, foot, ok, ex.accept[0], () => advance(session, ok, ex));
      }

      const { foot, btn } = footerCheck(body, {
        disabled: true,
        onClick: check,
      });
      input.addEventListener("input", () => { btn.disabled = !input.value.trim(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim() && !input.disabled) check();
      });
      setTimeout(() => input.focus(), 50);
    });
  }

  /* ------------------------- OUT OF HEARTS / DONE ------------------------ */
  function renderOutOfHearts(session) {
    lessonChrome(session, (body) => {
      body.appendChild(el("div", "big-emoji", "💔"));
      body.appendChild(el("h2", "ex-title", "Out of hearts"));
      body.appendChild(el("p", "info-text",
        "You've used all your hearts for today. They refill tomorrow — or you can reset and keep practising."));
      const foot = el("div", "check-foot");
      const back = el("button", "btn btn-primary", "Back to lessons");
      back.addEventListener("click", renderHome);
      foot.appendChild(back);
      const refill = el("button", "link-btn", "Refill now (practice mode)");
      refill.addEventListener("click", () => {
        state.hearts = 5; save(); renderTopbar(); renderExercise(session);
      });
      foot.appendChild(refill);
      body.appendChild(foot);
    });
  }

  function updateStreak() {
    const today = todayStr();
    if (state.lastActive === today) return; // already counted today
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak = (state.lastActive === yesterday) ? state.streak + 1 : 1;
    state.lastActive = today;
  }

  function finishLesson(session) {
    const key = lessonKey(session.unit, session.lesson);
    const firstTime = !state.completed[key];
    state.completed[key] = true;

    const gain = 10 + session.correct; // base + a point per correct rep
    state.xp += gain;
    updateStreak();
    save();
    renderTopbar();

    renderTopbar();
    app.innerHTML = "";
    const wrap = el("div", "lesson done-screen");
    wrap.appendChild(el("div", "big-emoji", firstTime ? "🎉" : "✅"));
    wrap.appendChild(el("h2", "done-title", firstTime ? "Lesson complete!" : "Practice complete!"));

    const stats = el("div", "done-stats");
    const s1 = el("div", "done-stat");
    s1.appendChild(el("div", "done-stat-num", "+" + gain));
    s1.appendChild(el("div", "done-stat-label", "XP earned"));
    stats.appendChild(s1);
    const s2 = el("div", "done-stat");
    const acc = session.total ? Math.round((session.correct / session.total) * 100) : 100;
    s2.appendChild(el("div", "done-stat-num", acc + "%"));
    s2.appendChild(el("div", "done-stat-label", "Accuracy"));
    stats.appendChild(s2);
    const s3 = el("div", "done-stat");
    s3.appendChild(el("div", "done-stat-num", "🔥 " + state.streak));
    s3.appendChild(el("div", "done-stat-label", "Day streak"));
    stats.appendChild(s3);
    wrap.appendChild(stats);

    const foot = el("div", "check-foot");
    const cont = el("button", "btn btn-primary", "Continue");
    cont.addEventListener("click", renderHome);
    foot.appendChild(cont);
    wrap.appendChild(foot);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  /* ------------------------------ Helpers -------------------------------- */
  // Detect Tamil characters (Unicode block U+0B80–U+0BFF).
  function isTamil(s) { return /[஀-௿]/.test(s || ""); }

  /* ------------------------------- Start --------------------------------- */
  renderHome();
})();
