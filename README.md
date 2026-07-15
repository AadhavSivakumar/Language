# கிளி · Learn Tamil 🦜

A free, Duolingo-style app for learning **Tamil** — right in the browser, no
sign-up, no backend. Everything runs client-side and your progress is saved
locally, so it works offline once loaded and is perfect for **GitHub Pages**.

## Features

- **Six units, from script to sentences** — the Tamil alphabet (உயிர்/மெய்),
  greetings, numbers, pronouns & family, everyday nouns and verbs, and finally
  grammar: word order, cases and the three tenses.
- **Five exercise types**
  - **Multiple choice** — pick the meaning / sound
  - **Word matching** — tap the Tamil word and its English pair
  - **Sentence building** — tap word-tiles to translate (English → Tamil)
  - **Type the answer** — free typing with lenient checking (script *or*
    transliteration accepted)
  - **Teaching cards** — learn before you're tested
- **Script + transliteration + English** on everything, so absolute beginners
  always have three anchors.
- **Tamil audio** via the browser's speech synthesis (tap 🔊). Availability of a
  Tamil voice depends on your OS/browser.
- **Progress, XP, day streak and hearts**, all saved in `localStorage`.
  Lessons unlock as you complete the previous one. Hearts refill daily.
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

All course material lives in [`data.js`](./data.js) as plain data — no code
needed to extend it. Each unit has lessons, each lesson has a list of
exercises. The comment block at the top of the file documents every exercise
type and its fields. Add a row, a lesson, or a whole new unit and the app
renders it automatically.

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
