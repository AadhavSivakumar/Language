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
   * translit— what the middle line is called for this language.
   * theme   — the course's own colours and ornament (see THEMES below), so
   *           studying Japanese doesn't look like studying Spanish.
   * mark    — the wordmark shown in the top bar; `glyph` overrides it in the
   *           picker's one-character column where the mark is longer. */
  const LANGUAGES = [
    {
      id: "tamil", name: "Tamil", native: "தமிழ்", mark: "கிளி", glyph: "த", emoji: "🦜",
      speech: "ta-IN", script: /[஀-௿]/, dir: "ltr",
      font: { family: "Noto Serif Tamil", spec: "Noto+Serif+Tamil:wght@400;500;600" },
      translit: "transliteration",
      fold: { "ṭ": "t", "ṇ": "n", "ṟ": "r", "ḷ": "l", "ḻ": "zh", "ṅ": "ng", "ñ": "ny" },
      theme: "kolam", tagline: "Classical Tamil — temple gold, palm-leaf letters and the Tirukkuṟaḷ.",
      blurb: "The alphabet, 1,300 words across 24 topics, sentences, verb conjugation and the Tirukkuṟaḷ.",
    },
    {
      id: "chinese", name: "Chinese", native: "中文", mark: "汉", emoji: "🀄",
      speech: "zh-CN", script: /[一-鿿㐀-䶿]/, dir: "ltr",
      font: { family: "Noto Sans SC", spec: "Noto+Sans+SC:wght@400;500;700" },
      translit: "pinyin",
      fold: { "ü": "v" },
      theme: "lattice", tagline: "Mandarin — vermilion and gold, characters and tones.",
      blurb: "Pinyin and tones, everyday characters across 24 topics, sentences and verb patterns.",
    },
    {
      id: "japanese", name: "Japanese", native: "日本語", mark: "あ", emoji: "🎌",
      speech: "ja-JP", script: /[぀-ヿ一-鿿]/, dir: "ltr",
      font: { family: "Noto Sans JP", spec: "Noto+Sans+JP:wght@400;500;700" },
      translit: "rōmaji",
      fold: { "ō": "ou", "ū": "uu", "ā": "aa", "ē": "ee", "ī": "ii" },
      theme: "seigaiha", tagline: "Japanese — indigo waves, kana, kanji and quiet proverbs.",
      blurb: "Hiragana and katakana, everyday words across 24 topics, sentences and verb forms.",
    },
    {
      id: "hindi", name: "Hindi", native: "हिन्दी", mark: "क", emoji: "🪷",
      speech: "hi-IN", script: /[ऀ-ॿ]/, dir: "ltr",
      font: { family: "Noto Sans Devanagari", spec: "Noto+Sans+Devanagari:wght@400;500;600" },
      translit: "transliteration",
      fold: { "ṭ": "t", "ḍ": "d", "ṇ": "n", "ś": "sh", "ṣ": "sh", "ṛ": "r", "ṅ": "ng", "ñ": "ny", "ṃ": "n", "ḥ": "h" },
      theme: "lotus", tagline: "Hindi — saffron and marigold, Devanagari and kahāvateṁ.",
      blurb: "Devanagari, everyday words across 24 topics, sentences and verb conjugation.",
    },
    {
      id: "arabic", name: "Arabic", native: "العربية", mark: "ع", emoji: "🕌",
      speech: "ar-SA", script: /[؀-ۿ]/, dir: "rtl",
      font: { family: "Noto Naskh Arabic", spec: "Noto+Naskh+Arabic:wght@400;500;700" },
      translit: "transliteration",
      fold: { "ḥ": "h", "ṣ": "s", "ḍ": "d", "ṭ": "t", "ẓ": "z", "ʿ": "", "ʾ": "", "ġ": "gh", "ḵ": "kh", "ṯ": "th", "ḏ": "dh", "š": "sh" },
      theme: "girih", tagline: "Modern Standard Arabic — teal and gold, written right to left.",
      blurb: "The abjad, Modern Standard Arabic across 24 topics, sentences and verb conjugation.",
    },
    {
      id: "spanish", name: "Spanish", native: "Español", mark: "Es", emoji: "🇪🇸",
      speech: "es-ES", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ñ": "n" },
      theme: "azulejo", tagline: "Spanish — terracotta and saffron, spoken across two continents.",
      blurb: "Everyday Spanish across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "french", name: "French", native: "Français", mark: "Fr", emoji: "🇫🇷",
      speech: "fr-FR", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ç": "c", "œ": "oe" },
      theme: "seme", tagline: "French — deep blue and rose, nasal vowels and silent endings.",
      blurb: "Everyday French across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "german", name: "German", native: "Deutsch", mark: "De", emoji: "🇩🇪",
      speech: "de-DE", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" },
      theme: "fachwerk", tagline: "German — brass and slate, long words built from small ones.",
      blurb: "Everyday German across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "italian", name: "Italian", native: "Italiano", mark: "It", emoji: "🇮🇹",
      speech: "it-IT", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: {},
      theme: "rosette", tagline: "Italian — basil and tomato, every letter pronounced.",
      blurb: "Everyday Italian across 24 topics, with sentences and full verb conjugation.",
    },
    {
      id: "portuguese", name: "Portuguese", native: "Português", mark: "Pt", emoji: "🇧🇷",
      speech: "pt-BR", script: null, dir: "ltr", font: null,
      translit: "pronunciation",
      fold: { "ç": "c", "ã": "a", "õ": "o" },
      theme: "calcada", tagline: "Brazilian Portuguese — azulejo blue, nasal vowels and open hearts.",
      blurb: "Everyday Brazilian Portuguese across 24 topics, with sentences and conjugation.",
    },
    {
      id: "english", name: "English", native: "English", mark: "En", emoji: "📘",
      speech: "en-GB", script: null, dir: "ltr", font: null,
      translit: "pronunciation", glossLabel: "definition",
      fold: {},
      theme: "rose", tagline: "English — oxblood and oak, a vocabulary builder in plain definitions.",
      blurb: "Build your English vocabulary — 24 topics with plain-English definitions and pronunciation.",
    },
  ];

  /* ------------------------------- Themes --------------------------------
   * Each course carries its own colour and ornament, drawn from where the
   * language is actually spoken — Japanese in indigo under seigaiha waves,
   * Arabic in teal under a girih star, Tamil in temple gold under a kolam.
   * The editorial bones stay the same everywhere: paper ground, hairline
   * rules, one accent doing the work. Only the pigment changes.
   *
   *   accent / accentDark  the single accent, for light and dark mode
   *   paper, card, line    the ground the page is printed on
   *   soft                 the wash used for hover and highlights
   *   palette              six hues for topic rules, in the same family
   *   motif                the ornament drawn behind the hero (see MOTIFS)
   * -------------------------------------------------------------------- */
  const THEMES = {
    // Temple gold and maroon; a kolam drawn in rice flour on the threshold.
    kolam: {
      accent: "#a8802c", accentDark: "#c9a227",
      paper: "#f7f4ee", paperDark: "#14181a",
      card: "#fffdf9", cardDark: "#1b2023",
      line: "#ddd6c9", lineDark: "#2e3639",
      soft: "#f0e6d0", softDark: "#262620",
      palette: ["#8c6d3f", "#a85a44", "#7a5470", "#4a5b8c", "#6b7f4e", "#5f6b70"],
    },
    // Vermilion and gold — the red of a lacquered gate, a window lattice.
    lattice: {
      accent: "#b03a2e", accentDark: "#e08b7a",
      paper: "#f9f3ee", paperDark: "#17140f",
      card: "#fffbf7", cardDark: "#201b16",
      line: "#e2d3c8", lineDark: "#332a22",
      soft: "#f6e4dc", softDark: "#2a1d18",
      palette: ["#b03a2e", "#a8791f", "#7a4a55", "#3f6b63", "#8c5a2b", "#5c6470"],
    },
    // Indigo and sumi ink, under seigaiha — the wave crests of old textiles.
    seigaiha: {
      accent: "#2f4f7a", accentDark: "#8fb0dc",
      paper: "#f4f4f1", paperDark: "#12161b",
      card: "#fdfdfb", cardDark: "#1a1f26",
      line: "#d7d9d5", lineDark: "#2a323b",
      soft: "#e4eaf2", softDark: "#1c242e",
      palette: ["#2f4f7a", "#7b5f7d", "#3f6b5f", "#8a6a3a", "#a35a55", "#55606b"],
    },
    // Saffron and marigold, under a lotus rosette.
    lotus: {
      accent: "#c2662a", accentDark: "#e9a85f",
      paper: "#faf4e9", paperDark: "#181410",
      card: "#fffcf5", cardDark: "#211b15",
      line: "#e5d7bf", lineDark: "#332a20",
      soft: "#f7e6cd", softDark: "#2a2116",
      palette: ["#c2662a", "#a03a5e", "#8a6d1f", "#3f6f5e", "#6a5a92", "#7a6656"],
    },
    // Teal and gold beneath an eight-point girih star.
    girih: {
      accent: "#116b60", accentDark: "#6fbfae",
      paper: "#f4f3ea", paperDark: "#101715",
      card: "#fdfdf6", cardDark: "#182120",
      line: "#d8d8c6", lineDark: "#26332f",
      soft: "#dfeae3", softDark: "#182722",
      palette: ["#116b60", "#9a7b23", "#7a4a4a", "#3f5a86", "#5f7a3f", "#6b6455"],
    },
    // Terracotta and saffron, on painted azulejo tiles.
    azulejo: {
      accent: "#b0512e", accentDark: "#e6906a",
      paper: "#faf4ec", paperDark: "#17130f",
      card: "#fffcf6", cardDark: "#201a15",
      line: "#e3d5c3", lineDark: "#33291f",
      soft: "#f7e3d5", softDark: "#2a1e17",
      palette: ["#b0512e", "#c39024", "#7a4a6b", "#2f6b7a", "#5f7a3a", "#77675a"],
    },
    // Deep blue and rose, strewn with a heraldic semé.
    seme: {
      accent: "#31497e", accentDark: "#93aede",
      paper: "#f6f5f2", paperDark: "#12151c",
      card: "#fffefc", cardDark: "#1a1e27",
      line: "#dcd9d2", lineDark: "#2b3140",
      soft: "#e5e7f1", softDark: "#1c2130",
      palette: ["#31497e", "#8e4a62", "#4a6b4f", "#8a6a35", "#6a5a8a", "#5b6570"],
    },
    // Brass and slate, in the diamond bracing of a timbered wall.
    fachwerk: {
      accent: "#8a6a1c", accentDark: "#d6b45c",
      paper: "#f5f4ef", paperDark: "#15161a",
      card: "#fdfdfa", cardDark: "#1d1f24",
      line: "#dbd8ce", lineDark: "#2f323a",
      soft: "#efe9d6", softDark: "#26251c",
      palette: ["#8a6a1c", "#9c3f34", "#3f5a70", "#4f6b45", "#6b5a70", "#5e6068"],
    },
    // Basil and tomato, under a Roman rosette.
    rosette: {
      accent: "#3d6b32", accentDark: "#93bd80",
      paper: "#f7f6ee", paperDark: "#13170f",
      card: "#fefdf7", cardDark: "#1c2118",
      line: "#dcdcc9", lineDark: "#2c3427",
      soft: "#e6eddc", softDark: "#1e2718",
      palette: ["#3d6b32", "#a8402f", "#8a6a25", "#3f5f80", "#7a4a63", "#63685a"],
    },
    // Azulejo blue, on the wave of a Lisbon pavement.
    calcada: {
      accent: "#2b5c92", accentDark: "#88b6e0",
      paper: "#f3f5f7", paperDark: "#101519",
      card: "#fdfeff", cardDark: "#181f26",
      line: "#d4dce3", lineDark: "#28323b",
      soft: "#e0eaf3", softDark: "#18232e",
      palette: ["#2b5c92", "#3f7a63", "#9a6a2a", "#8a4257", "#5f5f8a", "#5b6771"],
    },
    // Oxblood and oak, strewn with a Tudor rose.
    rose: {
      accent: "#7c3444", accentDark: "#d295a0",
      paper: "#f6f4ef", paperDark: "#161315",
      card: "#fffdfa", cardDark: "#1f1b1d",
      line: "#ded7cd", lineDark: "#332b2e",
      soft: "#f0e2e2", softDark: "#2a1f22",
      palette: ["#7c3444", "#4f6b3f", "#8a6a2f", "#3f5a7a", "#6b5570", "#66605a"],
    },
  };

  /* The same six hues are too dark to read against a dark card, so each
   * theme also carries a lightened set, mixed toward white. */
  function lighten(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.round(c + (255 - c) * amount);
    const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  Object.keys(THEMES).forEach(k => {
    THEMES[k].paletteDark = THEMES[k].palette.map(c => lighten(c, 0.45));
  });

  /* ------------------------------- Motifs --------------------------------
   * One tile each, drawn as a tiny SVG and repeated behind the hero at low
   * opacity. They are ornament, not illustration: at 6% they read as texture
   * and never fight the text. Each takes the accent colour so the pattern
   * belongs to its palette.
   * -------------------------------------------------------------------- */
  const MOTIFS = {
    // A kolam: pulli (dots) with a single line looped around them, the way
    // it is drawn in rice flour on a Tamil threshold each morning.
    kolam: (c) => tile(48, 48,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <path d='M24 4 C33 4 44 15 44 24 C44 33 33 44 24 44 C15 44 4 33 4 24 C4 15 15 4 24 4z'/>
         <path d='M24 16 C28 16 32 20 32 24 C32 28 28 32 24 32 C20 32 16 28 16 24 C16 20 20 16 24 16z'/>
         <path d='M0 24 C4 20 8 20 12 24 C8 28 4 28 0 24z'/>
         <path d='M48 24 C44 20 40 20 36 24 C40 28 44 28 48 24z'/>
         <path d='M24 0 C20 4 20 8 24 12 C28 8 28 4 24 0z'/>
         <path d='M24 48 C20 44 20 40 24 36 C28 40 28 44 24 48z'/>
       </g>
       <g fill='${c}'>
         <circle cx='24' cy='24' r='1.7'/>
         <circle cx='0' cy='0' r='1.7'/><circle cx='48' cy='0' r='1.7'/>
         <circle cx='0' cy='48' r='1.7'/><circle cx='48' cy='48' r='1.7'/>
       </g>`),
    // A window lattice, the diamond grille of a courtyard screen.
    lattice: (c) => tile(40, 40,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <path d='M20 2 L38 20 L20 38 L2 20z'/>
         <path d='M20 10 L30 20 L20 30 L10 20z'/>
         <path d='M0 0 L4 4 M40 0 L36 4 M0 40 L4 36 M40 40 L36 36'/>
         <path d='M20 2 L20 -6 M20 38 L20 46 M2 20 L-6 20 M38 20 L46 20'/>
       </g>`),
    // Seigaiha — overlapping wave crests, as on indigo cloth.
    seigaiha: (c) => tile(48, 24,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <path d='M0 24 A24 24 0 0 1 48 24'/>
         <path d='M6 24 A18 18 0 0 1 42 24'/>
         <path d='M12 24 A12 12 0 0 1 36 24'/>
         <path d='M18 24 A6 6 0 0 1 30 24'/>
         <path d='M-24 24 A24 24 0 0 1 24 24' transform='translate(-24,0)'/>
       </g>`),
    // A lotus rosette: eight petals opening from a centre.
    lotus: (c) => tile(44, 44,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <circle cx='22' cy='22' r='4'/>
         <g>${[0,45,90,135,180,225,270,315].map(a =>
            `<ellipse cx='22' cy='12' rx='4.5' ry='9' transform='rotate(${a} 22 22)'/>`).join("")}</g>
       </g>`),
    // A girih star: two squares crossed into an eight-point rosette.
    girih: (c) => tile(44, 44,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <rect x='8' y='8' width='28' height='28'/>
         <rect x='8' y='8' width='28' height='28' transform='rotate(45 22 22)'/>
         <circle cx='22' cy='22' r='5'/>
       </g>`),
    // Azulejo: a quatrefoil, the tile that repeats across a Seville wall.
    azulejo: (c) => tile(40, 40,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <circle cx='20' cy='8' r='8'/><circle cx='20' cy='32' r='8'/>
         <circle cx='8' cy='20' r='8'/><circle cx='32' cy='20' r='8'/>
         <circle cx='20' cy='20' r='2.5'/>
       </g>`),
    // Semé-de-lis — a field strewn with small fleurs-de-lis, as on the old
    // arms of France. Drawn once and repeated on the half-drop.
    seme: (c) => {
      const lis =
        `<g fill='${c}' stroke='none'>
           <path d='M0 -10 C1.7 -6.4 2.6 -3.4 2.6 -0.6 C2.6 1.4 1.5 2.6 0 2.6
                    C-1.5 2.6 -2.6 1.4 -2.6 -0.6 C-2.6 -3.4 -1.7 -6.4 0 -10z'/>
           <path d='M-2.8 0.4 C-5 -1.8 -8.4 -1.4 -8.4 1.8 C-8.4 4 -6.2 5.2 -3.4 4.6
                    L-3.4 2.8 C-4.8 3 -5.8 2.6 -5.8 1.6 C-5.8 0.4 -4.4 0 -2.8 1.6z'/>
           <path d='M2.8 0.4 C5 -1.8 8.4 -1.4 8.4 1.8 C8.4 4 6.2 5.2 3.4 4.6
                    L3.4 2.8 C4.8 3 5.8 2.6 5.8 1.6 C5.8 0.4 4.4 0 2.8 1.6z'/>
           <rect x='-6.4' y='4.4' width='12.8' height='1.9' rx='.6'/>
           <path d='M-1.5 6.6 L1.5 6.6 L2.6 11.4 C1.6 10.4 -1.6 10.4 -2.6 11.4z'/>
         </g>`;
      return tile(56, 56,
        `<g transform='translate(14,15) scale(1.05)'>${lis}</g>
         <g transform='translate(42,43) scale(1.05)'>${lis}</g>`);
    },
    // Fachwerk — the diamond bracing of a timber-framed wall.
    fachwerk: (c) => tile(40, 40,
      `<g fill='none' stroke='${c}' stroke-width='1.2'>
         <path d='M0 20 L20 0 L40 20 L20 40z'/>
         <path d='M20 0 L20 40 M0 20 L40 20'/>
       </g>`),
    // A Roman rosette — six circles round a seventh, cut in stone everywhere.
    rosette: (c) => tile(48, 42,
      `<g fill='none' stroke='${c}' stroke-width='1.05'>
         <circle cx='24' cy='21' r='11'/>
         ${[0,60,120,180,240,300].map(a => {
            const r = a * Math.PI / 180;
            return `<circle cx='${(24 + 11 * Math.sin(r)).toFixed(1)}' cy='${(21 - 11 * Math.cos(r)).toFixed(1)}' r='11'/>`;
         }).join("")}
       </g>`),
    // Calçada — the wave the Portuguese lay in black and white cobbles.
    calcada: (c) => tile(48, 24,
      `<g fill='none' stroke='${c}' stroke-width='1.4'>
         <path d='M0 6 C12 -4 12 16 24 6 C36 -4 36 16 48 6'/>
         <path d='M0 18 C12 8 12 28 24 18 C36 8 36 28 48 18'/>
       </g>`),
    // A Tudor rose, five petals round a boss.
    rose: (c) => tile(44, 44,
      `<g fill='none' stroke='${c}' stroke-width='1.1'>
         <circle cx='22' cy='22' r='3.5'/>
         <g>${[0,72,144,216,288].map(a =>
            `<circle cx='22' cy='12' r='6.5' transform='rotate(${a} 22 22)'/>`).join("")}</g>
       </g>`),
  };

  /* Wrap a motif's shapes in an SVG tile and encode it for use in CSS. */
  function tile(w, h, shapes) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h +
      "' viewBox='0 0 " + w + " " + h + "'>" + shapes.replace(/\s+/g, " ") + "</svg>";
    return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
  }

  /* Paint a course's theme onto the document. Light and dark values are set
   * as separate custom properties; the stylesheet picks between them, so the
   * page follows the system theme without JavaScript watching for changes. */
  function applyTheme(lang) {
    const t = THEMES[lang.theme] || THEMES.kolam;
    const r = document.documentElement.style;
    const set = (name, light, dark) => {
      r.setProperty("--" + name + "-l", light);
      r.setProperty("--" + name + "-d", dark);
    };
    set("accent", t.accent, t.accentDark);
    set("paper", t.paper, t.paperDark);
    set("card", t.card, t.cardDark);
    set("line", t.line, t.lineDark);
    set("accent-soft", t.soft, t.softDark);
    const motif = MOTIFS[lang.theme] || MOTIFS.kolam;
    r.setProperty("--motif-l", motif(t.accent));
    r.setProperty("--motif-d", motif(t.accentDark));
    document.documentElement.dataset.theme = lang.theme;
  }
  /* The palette a course paints its topic cards with, light and dark side by
   * side so a card can carry both and let the stylesheet choose. */
  const paletteFor = (lang) => {
    const t = THEMES[lang.theme] || THEMES.kolam;
    return t.palette.map((c, i) => ({ light: c, dark: t.paletteDark[i] }));
  };
  /* The picker shows every language in its own colour before you pick one. */
  const swatchFor = (lang) => {
    const t = THEMES[lang.theme] || THEMES.kolam;
    return { accent: t.accent, accentDark: t.accentDark, soft: t.soft, softDark: t.softDark };
  };
  /* …and in its own ornament. */
  const motifFor = (lang, dark) => {
    const t = THEMES[lang.theme] || THEMES.kolam;
    return (MOTIFS[lang.theme] || MOTIFS.kolam)(dark ? t.accentDark : t.accent);
  };
  /* Back to the neutral ground when no course is open. */
  function clearTheme() {
    const r = document.documentElement.style;
    ["accent", "paper", "card", "line", "accent-soft", "motif"].forEach(n => {
      r.removeProperty("--" + n + "-l"); r.removeProperty("--" + n + "-d");
    });
    delete document.documentElement.dataset.theme;
  }

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
    /* Where a course has it: the festivals, customs, arts and untranslatable
       ideas you need in order to follow a conversation, not just parse it.
       A course joins in simply by having words filed under "culture". */
    { id: "culture",    title: "Culture & Customs",  color: "#a85a44", kind: "vocab" },
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
    LANGUAGES, TOPIC_DEFS, THEMES, courses,
    V, S, C, A, register, load,
    applyTheme, clearTheme, paletteFor, swatchFor, motifFor,
    byId: (id) => LANGUAGES.filter(l => l.id === id)[0] || null,
  };
})();
