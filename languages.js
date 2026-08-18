/* ============================================================================
 * Kili · language registry and course loader
 *
 * The app is one engine driven by many courses. This file holds:
 *
 *   LANGUAGES  — the courses on offer, and everything the engine needs to know
 *                about a language that isn't vocabulary: its script, its
 *                speech-synthesis locale, its web font, its writing direction.
 *   TOPIC_DEFS — the shared topic spine. Every course uses the same topic ids,
 *                so progress, mastery bars and the home grid work identically
 *                whichever language you're learning. A course only supplies an
 *                icon (a word in its own script) plus the words themselves.
 *   KILI       — the small runtime every course file talks to: helpers to
 *                build rows, and register()/load() for wiring a course in.
 *
 * A course file (courses/<id>.js) is pure data. It ends with a call to
 * KILI.register(id, { icons, vocab, sentences, conjugation, alphabet, ... }).
 * ==========================================================================*/

(function () {
  "use strict";

  /* ----------------------------- Languages ------------------------------ */
  /* script  — regex matching the language's own script; null for Latin.
   * speech  — BCP-47 tag for speech synthesis / recognition.
   * font    — Google Fonts family + spec, loaded on demand.
   * fold    — extra letter→ASCII rules so typed plain spellings are accepted
   *           (on top of the generic accent-stripping the engine does).
   * translit— what the middle line is called for this language. */
  const LANGUAGES = [
    {
      id: "tamil", name: "Tamil", native: "தமிழ்", mark: "கிளி", emoji: "🦜",
      speech: "ta-IN", script: /[஀-௿]/, dir: "ltr",
      font: { family: "Noto Serif Tamil", spec: "Noto+Serif+Tamil:wght@400;500;600" },
      translit: "transliteration",
      fold: { "ṭ": "t", "ṇ": "n", "ṟ": "r", "ḷ": "l", "ḻ": "zh", "ṅ": "ng", "ñ": "ny" },
      blurb: "The alphabet, 1,300 words across 24 topics, sentences, verb conjugation and the Tirukkuṟaḷ.",
    },
    {
      id: "chinese", name: "Chinese", native: "中文", mark: "汉", emoji: "🀄",
      speech: "zh-CN", script: /[一-鿿㐀-䶿]/, dir: "ltr",
      font: { family: "Noto Sans SC", spec: "Noto+Sans+SC:wght@400;500;700" },
      translit: "pinyin",
      fold: { "ü": "v" },
      blurb: "Pinyin and tones, everyday characters across 24 topics, sentences and verb patterns.",
    },
    {
      id: "japanese", name: "Japanese", native: "日本語", mark: "あ", emoji: "🎌",
      speech: "ja-JP", script: /[぀-ヿ一-鿿]/, dir: "ltr",
      font: { family: "Noto Sans JP", spec: "Noto+Sans+JP:wght@400;500;700" },
      translit: "rōmaji",
      fold: { "ō": "ou", "ū": "uu", "ā": "aa", "ē": "ee", "ī": "ii" },
      blurb: "Hiragana and katakana, everyday words across 24 topics, sentences and verb forms.",
    },
    {
      id: "hindi", name: "Hindi", native: "हिन्दी", mark: "क", emoji: "🪷",
      speech: "hi-IN", script: /[ऀ-ॿ]/, dir: "ltr",
      font: { family: "Noto Sans Devanagari", spec: "Noto+Sans+Devanagari:wght@400;500;600" },
      translit: "transliteration",
      fold: { "ṭ": "t", "ḍ": "d", "ṇ": "n", "ś": "sh", "ṣ": "sh", "ṛ": "r", "ṅ": "ng", "ñ": "ny", "ṃ": "n", "ḥ": "h" },
      blurb: "Devanagari, everyday words across 24 topics, sentences and verb conjugation.",
    },
    {
      id: "arabic", name: "Arabic", native: "العربية", mark: "ع", emoji: "🕌",
      speech: "ar-SA", script: /[؀-ۿ]/, dir: "rtl",
      font: { family: "Noto Naskh Arabic", spec: "Noto+Naskh+Arabic:wght@400;500;700" },
      translit: "transliteration",
      fold: { "ḥ": "h", "ṣ": "s", "ḍ": "d", "ṭ": "t", "ẓ": "z", "ʿ": "", "ʾ": "", "ġ": "gh", "ḵ": "kh", "ṯ": "th", "ḏ": "dh", "š": "sh" },
      blurb: "The abjad, Modern Standard Arabic across 24 topics, sentences and verb conjugation.",
    },
    {
      id: "spanish", name: "Spanish", native: "Español", mark: "Es", emoji: "🇪🇸",
      speech: "es-ES", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ñ": "n" },
      blurb: "Everyday Spanish across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "french", name: "French", native: "Français", mark: "Fr", emoji: "🇫🇷",
      speech: "fr-FR", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ç": "c", "œ": "oe" },
      blurb: "Everyday French across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "german", name: "German", native: "Deutsch", mark: "De", emoji: "🇩🇪",
      speech: "de-DE", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" },
      blurb: "Everyday German across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "italian", name: "Italian", native: "Italiano", mark: "It", emoji: "🇮🇹",
      speech: "it-IT", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: {},
      blurb: "Everyday Italian across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "portuguese", name: "Portuguese", native: "Português", mark: "Pt", emoji: "🇧🇷",
      speech: "pt-BR", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ç": "c", "ã": "a", "õ": "o" },
      blurb: "Everyday Brazilian Portuguese across 24 topics, with sentences and conjugation.",
    },
    {
      id: "english", name: "English", native: "English", mark: "En", emoji: "📘",
      speech: "en-GB", script: null, dir: "ltr", font: null,
      translit: "pronunciation", glossLabel: "definition",
      fold: {},
      blurb: "Build your English vocabulary — 24 topics with plain-English definitions and pronunciation.",
    },
  ];

  /* ------------------------------- Topics -------------------------------
   * The shared spine. `kind` drives which practice modes a topic offers.
   * A course joins in simply by having words with these topic ids. */
  const TOPIC_DEFS = [
    { id: "alphabet",   title: "Alphabet",           color: "#8c6d3f", kind: "alpha" },
    { id: "greetings",  title: "Greetings",          color: "#4a5b8c", kind: "vocab" },
    { id: "numbers",    title: "Numbers",            color: "#7a5470", kind: "vocab" },
    { id: "colors",     title: "Colours",            color: "#7a5470", kind: "vocab" },
    { id: "family",     title: "Family",             color: "#a85a44", kind: "vocab" },
    { id: "people",     title: "People",             color: "#a85a44", kind: "vocab" },
    { id: "pronouns",   title: "Pronouns",           color: "#5f6b70", kind: "vocab" },
    { id: "questions",  title: "Question Words",     color: "#8c6d3f", kind: "vocab" },
    { id: "grammar",    title: "Little Words",       color: "#5f6b70", kind: "vocab" },
    { id: "adjectives", title: "Adjectives",         color: "#7a5470", kind: "vocab" },
    { id: "adverbs",    title: "Adverbs",            color: "#6b7f4e", kind: "vocab" },
    { id: "verbs",      title: "Verbs",              color: "#a85a44", kind: "vocab" },
    { id: "food",       title: "Food & Drink",       color: "#8c6d3f", kind: "vocab" },
    { id: "body",       title: "The Body",           color: "#a85a44", kind: "vocab" },
    { id: "health",     title: "Health",             color: "#6b7f4e", kind: "vocab" },
    { id: "clothing",   title: "Clothing",           color: "#7a5470", kind: "vocab" },
    { id: "home",       title: "Home & Objects",     color: "#4a5b8c", kind: "vocab" },
    { id: "animals",    title: "Animals",            color: "#6b7f4e", kind: "vocab" },
    { id: "nature",     title: "Nature",             color: "#6b7f4e", kind: "vocab" },
    { id: "places",     title: "Places",             color: "#4a5b8c", kind: "vocab" },
    { id: "travel",     title: "Travel & Transport", color: "#4a5b8c", kind: "vocab" },
    { id: "time",       title: "Time & Days",        color: "#5f6b70", kind: "vocab" },
    { id: "work",       title: "Work & Money",       color: "#8c6d3f", kind: "vocab" },
    { id: "school",     title: "School & Learning",  color: "#6b7f4e", kind: "vocab" },
    { id: "tech",       title: "Technology",         color: "#5f6b70", kind: "vocab" },
    { id: "sentences",  title: "Sentences",          color: "#8c6d3f", kind: "sentence" },
  ];

  /* ------------------------------ Registry ------------------------------ */
  const courses = {};
  let pending = null;

  /* Row helpers used by every course file. `ta` is the historical field name
   * for "the text in the language you're learning"; `tr` is its romanisation
   * or pronunciation, `en` the English meaning. */
  const V = (topic, rows) => rows.map(([ta, tr, en]) => ({ ta, tr, en, topic }));
  const S = (topic, rows) => rows.map(([ta, tr, en, words]) => ({
    ta, tr, en, topic,
    words: (words || []).map(([wta, wtr]) => ({ ta: wta, tr: wtr })),
  }));
  /* A conjugation table. `rows` are [ta, tr, en, person, tense]. */
  const C = (verb, tr, en, rows) => ({
    verb, tr, en,
    forms: rows.map(([fta, ftr, fen, person, tense]) =>
      ({ ta: fta, tr: ftr, en: fen, person, tense, topic: "verbs" })),
  });
  /* Letters/characters for the script topic: [ta, tr, name?]. */
  const A = (rows) => rows.map(([ta, tr, name]) =>
    ({ ta, tr, en: name || tr, topic: "alphabet" }));

  function register(id, course) {
    courses[id] = course;
    if (pending && pending.id === id) { const r = pending.resolve; pending = null; r(course); }
  }

  /* Inject the course script (and the language's web font) on demand, so a
   * learner only ever downloads the one course they picked. */
  function load(lang) {
    if (courses[lang.id]) return Promise.resolve(courses[lang.id]);
    ensureFont(lang);
    return new Promise((resolve, reject) => {
      pending = { id: lang.id, resolve };
      const s = document.createElement("script");
      s.src = "./courses/" + lang.id + ".js";
      s.onerror = () => { pending = null; reject(new Error("Couldn't load the " + lang.name + " course.")); };
      document.head.appendChild(s);
    });
  }

  const loadedFonts = {};
  function ensureFont(lang) {
    const f = lang.font;
    document.documentElement.style.setProperty("--target-font",
      (f ? "'" + f.family + "', " : "") + "'Fraunces', Georgia, serif");
    if (!f || loadedFonts[f.spec]) return;
    loadedFonts[f.spec] = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + f.spec + "&display=swap";
    document.head.appendChild(link);
  }

  window.KILI = {
    LANGUAGES, TOPIC_DEFS, courses,
    V, S, C, A, register, load,
    byId: (id) => LANGUAGES.filter(l => l.id === id)[0] || null,
  };
})();
