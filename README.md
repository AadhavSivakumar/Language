# கிளி · Kili 🦜

A free, Duolingo-style app for learning **eleven languages** — right in the
browser, no sign-up, no backend. Everything runs client-side and your progress
is saved locally, so it works offline once loaded and is perfect for **GitHub
Pages**.

## The courses

Pick one on the first screen; switch whenever you like. Each is a separate
course with its own progress, streak and spaced-repetition memory.

| Language | Script | Words | Sentences | Verbs | Extras |
|----------|--------|------:|----------:|------:|--------|
| Tamil 🦜 | Tamil (with transliteration) | 1,326 | 103 | 20 | alphabet · 20 Tirukkuṟaḷ couplets |
| Chinese 🀄 | Simplified characters + pinyin | 1,070 | 51 | 15 | pinyin & tones · 15 成语 |
| Japanese 🎌 | Kanji + kana, with rōmaji | 1,064 | 51 | 15 | hiragana & katakana · 15 ことわざ |
| Arabic 🕌 | Arabic, right-to-left | 1,044 | 51 | 15 | the abjad · 15 أمثال |
| French 🇫🇷 | Latin | 1,047 | 51 | 15 | alphabet & sounds · 15 proverbes |
| Hindi 🪷 | Devanagari (with transliteration) | 1,041 | 51 | 15 | the varṇamālā · 15 कहावतें |
| Spanish 🇪🇸 | Latin | 1,039 | 51 | 15 | alphabet & sounds · 15 refranes |
| German 🇩🇪 | Latin | 1,038 | 51 | 15 | alphabet & sounds · 15 Sprichwörter |
| Portuguese 🇧🇷 | Latin (Brazilian) | 1,036 | 51 | 15 | alphabet & sounds · 15 provérbios |
| Italian 🇮🇹 | Latin | 1,029 | 51 | 15 | alphabet & sounds · 15 proverbi |
| English 📘 | Latin | 1,029 | 51 | 15 | a vocabulary builder with plain-English definitions |

Every course has the same **24 topics**, so the app works identically whichever
one you're studying and a topic you've mastered in one language is easy to find
in the next. Each verb is conjugated across past, present and future for every
person — around 230 forms per course.

Each entry carries **three anchors**: the word in its own script, a
pronunciation or transliteration line, and the English meaning. In the English
course the third line is a plain-English definition instead, which is what a
vocabulary builder actually needs.

## The alphabet, in every language

Every course opens with its writing system, as a section of its own above the
topics — never buried in the grid. Three cards: the whole set, and each of its
two halves, drillable with flashcards, matching, listening, typing and speech.

| Course | Section | Halves |
|--------|---------|--------|
| Tamil | Alphabet · 37 letters | uyir (vowels, with āytam) · mey (consonants, with the grantha letters) |
| Chinese | Pinyin & tones · 67 sounds | 21 initials + 36 finals · the five tones and how they shift |
| Japanese | Hiragana & katakana · 92 kana | hiragana · katakana |
| Hindi | Devanagari · 56 letters | svar with their mātrās · vyañjan, including the conjuncts and borrowed letters |
| Arabic | The abjad · 38 letters | the 28 letters · the vowel marks, shadda, sun letters |
| Spanish, French, German, Italian, Portuguese, English | Alphabet & sounds | the letters with their names · the digraphs and spellings that don't say what they look like |

Chinese and Japanese have no alphabet in the strict sense, so they get the
thing that actually does the job: the full pinyin sound system for Chinese,
both kana syllabaries for Japanese.

## No question has two right answers

Languages are full of synonyms — Tamil has two everyday words for *mother*,
Portuguese has *o* and *a* both meaning *it*. A quiz that picks its wrong
answers by "a different spelling" will sooner or later offer two options that
are both correct and mark one of them wrong.

Every generator here filters distractors by **meaning** rather than spelling,
comparing the slash- and comma-separated senses of each gloss. A test drives
every topic of every course and inspects the screens it produces; it currently
checks over 6,000 of them and finds none with two right answers.

## Getting around

The top bar is the constant. The **wordmark on the left** always returns to the
current course's home screen — from a lesson, a topic, the progress page,
anywhere. The **language chip on the right** always returns to the picker, so
you're never more than one click from switching course or starting a new one.

## Themed per language

Each course carries its own colour and ornament, drawn from where the language
is actually spoken: Japanese in indigo under seigaiha wave crests, Arabic in
teal under a girih star, Tamil in temple gold under a kolam, French in deep
blue strewn with fleurs-de-lis, Portuguese in azulejo blue over a Lisbon
pavement wave. The bones don't change — paper ground, hairline rules, one
accent doing the work — only the pigment does, so switching course feels like
picking up a different book rather than using a different app.

Themes live in `languages.js`: a palette (light and dark), six topic hues, and
a motif drawn as a small tiling SVG. They repaint the app through CSS custom
properties, so light and dark mode both follow without any JavaScript watching
the system theme.

## Features

- **Pick a topic, then pick how you practise.** No fixed path — you choose.
  24 word topics to browse: greetings, numbers,
  colours, family, people, pronouns, question words, little words, adjectives,
  adverbs, verbs, food & drink, the body, health, clothing, home & objects,
  animals, nature, places, travel & transport, time & days, work & money,
  school & learning and technology — plus a full **sentences** set.
- **Eight practice modes**, generated fresh from the content each time:
  - **Flashcards** — flip to reveal, learn at your own pace (not scored)
  - **Multiple choice** — pick the meaning (either direction)
  - **Matching** — tap a word and its English pair
  - **Type it** — free typing with lenient checking (script *or* transliteration)
  - **Listening** — hear it, choose the meaning
  - **Speak it** — say the word aloud; your mic checks you (Web Speech, in the
    course's own locale), with an honest self-check fallback where recognition
    isn't available
  - **Build a sentence** — tap word-tiles in order
  - **Translate** — read a sentence, choose the English
- **Spaced-repetition Review.** Every answer updates a per-word memory record
  (SM-2-style) in `localStorage`; the **Review** track pools the words you're
  due to revisit, so weak words come back sooner and mastered ones fade.
- **Verb conjugation** in every language, drilled with distractors drawn from
  *other forms of the same verb* — so you have to pick the right person and
  tense, not just recognise the word.
- **A reading track** per language: the Tirukkuṟaḷ in Tamil, chéngyǔ in Chinese,
  kotowaza in Japanese, and proverbs everywhere else — shown line by line with
  pronunciation and meaning, and quizzed with "which line completes this?"
- **Progress & mastery.** A progress screen with a daily-XP goal ring, a streak
  calendar, and per-topic mastery bars (a word is "learned" after two correct
  reps) — kept separately for each language.
- **Word search.** Search a course by English, script or transliteration, then
  jump straight into practice on whatever the search turns up.
- **Username sync.** Pick a username and your progress is stored in this repo as
  [`progress/<username>.json`](./progress) — versioned in git, no third-party
  service. Because the repo is public, *loading* on a new device needs nothing
  but the username; *saving* needs a GitHub token you paste once per device
  (kept in that browser only, never committed). Devices merge instead of
  overwriting, and one file holds every language you study.
- **Audio** via the browser's speech synthesis (tap 🔊), in each course's own
  locale. If no voice for that language is installed, listening mode falls back
  to showing the pronunciation line.
- **XP and a day streak**, saved in `localStorage`. No hearts, no lock-outs —
  practise as much as you like.
- **Full keyboard control.** Every mode is playable without the mouse, and each
  screen shows its own shortcuts:

  | Keys | Where | Does |
  |------|-------|------|
  | <kbd>←</kbd> <kbd>→</kbd> | Flashcards | previous / next card |
  | <kbd>space</kbd> | Flashcards | flip the card |
  | <kbd>1</kbd>–<kbd>4</kbd> | Choice, listening | pick that option |
  | <kbd>space</kbd> | Listening | replay the audio |
  | <kbd>space</kbd> / <kbd>r</kbd> | Speak it | start the mic / hear it again |
  | <kbd>1</kbd>–<kbd>9</kbd>, <kbd>⌫</kbd> | Build a sentence | add a word / undo |
  | <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> | Matching, any list | move between tiles |
  | <kbd>↵</kbd> | everywhere | check, then continue |
  | <kbd>esc</kbd> | everywhere | leave the lesson |

- **Light & dark mode**, responsive for phone and desktop, and right-to-left
  where the language calls for it. Every theme is drawn for both, including a
  lightened topic palette so the colour still reads on a dark ground.

## Run locally

It's plain static files — just open `index.html`. Course files are fetched on
demand, so serve it rather than opening from `file://`:

```bash
# any static server works, e.g.
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*,
   pick the `main` branch and the `/ (root)` folder, and **Save**.
4. Your app goes live at `https://<username>.github.io/<repo>/`.

The `.nojekyll` file tells Pages to serve the files verbatim.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Page shell and script tags |
| `styles.css` | All styling (theme-aware, script-aware) |
| `languages.js` | The language registry, the shared topic spine, and the course loader |
| `courses/<id>.js` | One course as pure data — words, sentences, verbs, proverbs |
| `app.js` | Router, lesson engine, exercise types, progress/XP/streak, sync |

Only the course you pick is downloaded, so adding languages doesn't slow the
app down.

## Add or edit content

All course material lives in `courses/` as plain data — and because the app
*generates* the exercises, you never touch the exercise code:

- Add a word by appending a `["word", "pronunciation", "english"]` row to the
  right topic's `V(...)` block.
- Add a sentence with `S(...)`, including its word tokens (used by the build mode).
- Add a verb table with `C(verb, tr, en, [[form, tr, en, person, tense], …])`.

Every practice mode picks the new content up automatically. Throughout the data
files the field `ta` means "the text in the language being learned" — the name
is historical, from when this was a Tamil-only app.

### Adding a whole language

1. Add an entry to `LANGUAGES` in `languages.js`: its id, name, native name,
   speech locale, script regex (or `null` for Latin), web font and fold rules.
2. Give it a theme — either reuse an existing one by name, or add an entry to
   `THEMES` (a palette for light and dark, six topic hues) and a tile to
   `MOTIFS` (a small SVG that repeats).
3. Write `courses/<id>.js` following any existing course, ending with
   `window.KILI.register("<id>", { … })`.

Nothing else needs to change — the picker, the topic grid, progress and sync
all pick it up from the registry.

## Notes on the languages

Transliteration uses a light scholarly scheme for the languages that have an
established one (Tamil, Hindi, Arabic) and pinyin/rōmaji where those are
standard; for the Latin-script languages the middle line is a plain-English
respelling with the stressed syllable in CAPS, which is the one thing spelling
alone won't tell you. Typing exercises also accept plain-ASCII spellings, so
you're never fighting diacritics. Corrections and additions are welcome.
