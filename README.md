# கிளி · Learn Tamil 🦜

A free, Duolingo-style app for learning **Tamil** — right in the browser, no
sign-up, no backend. Everything runs client-side and your progress is saved
locally, so it works offline once loaded and is perfect for **GitHub Pages**.

## Features

- **Pick a topic, then pick how you practise.** No fixed path — you choose.
  **25 word topics** to browse: the alphabet, greetings, numbers, colours,
  family, people, pronouns, question words, little words, adjectives, adverbs,
  verbs, food & drink, the body, health, clothing, home & objects, animals,
  nature, places, travel & transport, time & days, work & money, school &
  learning and technology — plus a full **sentences** set.
- **Eight practice modes**, generated fresh from the content each time:
  - **Flashcards** — flip to reveal, learn at your own pace (not scored)
  - **Multiple choice** — pick the meaning (Tamil→English or English→Tamil)
  - **Matching** — tap the Tamil word and its English pair
  - **Type it** — free typing with lenient checking (script *or* transliteration)
  - **Listening** — hear the Tamil, choose the meaning
  - **Speak it** — say the word aloud; your mic checks you (Web Speech, `ta-IN`),
    with an honest self-check fallback where recognition isn't available
  - **Build a sentence** — tap word-tiles in order
  - **Translate** — read a Tamil sentence, choose the English
- **Spaced-repetition Review.** Every answer updates a per-word memory record
  (SM-2-style) in `localStorage`; the **Review** track always pools the words
  you're due to revisit, so weak words come back sooner and mastered ones fade.
- **Progress & mastery.** A progress screen with a daily-XP goal ring, a streak
  calendar, and per-topic mastery bars (a word is "learned" after two correct
  reps).
- **Word search.** Search all ~1,300 words by English, Tamil or transliteration,
  then jump straight into practice on whatever the search turns up.
- **Username sync.** Pick a username and your progress is stored in this repo as
  [`progress/<username>.json`](./progress) — versioned in git, no third-party
  service. Because the repo is public, *loading* on a new device needs nothing but
  the username; *saving* needs a GitHub token you paste once per device (kept in
  that browser only, never committed). Devices merge instead of overwriting, so
  practising in two places never loses work.
- **~1,300 words and ~85 sentences**, each with **Tamil script + transliteration
  + English**, so beginners always have three anchors.
- **Tamil audio** via the browser's speech synthesis (tap 🔊). If no Tamil voice
  is installed, the listening mode falls back to showing the transliteration.
- **XP and a day streak**, saved in `localStorage`. No hearts, no lock-outs —
  practise as much as you like.
- **Light & dark mode**, responsive for phone and desktop.

## Run locally

It's plain static files — just open `index.html`. For the ES-free scripts this
works even from `file://`, but to be safe you can serve it:

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

## Add or edit content

All course material lives in [`data.js`](./data.js) as plain data — and because
the app *generates* the exercises, you never touch the exercise code:

- Add a word by appending a `["தமிழ்", "tamiḻ", "english"]` row to the right
  topic in `VOCAB`.
- Add a sentence to `SENTENCES` with its word tokens (used by the build mode).
- Add a whole new topic to `TOPICS` and give its words a matching `topic` id.

Every practice mode picks up the new content automatically.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Page shell and script tags |
| `styles.css` | All styling (Duolingo-flavoured, theme-aware) |
| `data.js` | The entire course as data |
| `app.js` | Router, lesson engine, exercise types, progress/XP/streak |

## Notes on the Tamil

Transliteration uses a light scholarly scheme (ā, ī, ū, ḷ, ṇ, ṟ, ṭ, ...) for
accuracy; the typing exercises also accept plain-ASCII spellings so you're not
fighting diacritics. Corrections and additions are welcome.
