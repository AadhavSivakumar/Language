# கிளி · Learn Tamil 🦜

A free, Duolingo-style app for learning **Tamil** — right in the browser, no
sign-up, no backend. Everything runs client-side and your progress is saved
locally, so it works offline once loaded and is perfect for **GitHub Pages**.

## Features

- **Pick a topic, then pick how you practise.** No fixed path — you choose.
  **17 topics:** the alphabet, greetings, numbers, family, pronouns, food,
  animals, colours, the body, home & objects, nature, time & days, verbs,
  adjectives, places, question words, and full sentences.
- **Seven practice modes**, generated fresh from the content each time:
  - **Flashcards** — flip to reveal, learn at your own pace (not scored)
  - **Multiple choice** — pick the meaning (Tamil→English or English→Tamil)
  - **Matching** — tap the Tamil word and its English pair
  - **Type it** — free typing with lenient checking (script *or* transliteration)
  - **Listening** — hear the Tamil, choose the meaning
  - **Build a sentence** — tap word-tiles in order
  - **Translate** — read a Tamil sentence, choose the English
- **~200 words and ~35 sentences**, each with **Tamil script + transliteration
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
| `app.js` | Router, lesson engine, exercise types, progress/XP/streak/hearts |

## Notes on the Tamil

Transliteration uses a light scholarly scheme (ā, ī, ū, ḷ, ṇ, ṟ, ṭ, ...) for
accuracy; the typing exercises also accept plain-ASCII spellings so you're not
fighting diacritics. Corrections and additions are welcome.
