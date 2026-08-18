# progress/

Saved learner progress, one JSON file per username — e.g. `progress/aadhav.json`.

The app reads these straight from GitHub (no token needed, the repo is public) and
writes them back through the GitHub Contents API when you add a token in
**Account → sync**. Because they're ordinary files in the repo, your progress is
versioned in git: `git log progress/aadhav.json` shows every session.

## Format

One file holds **every language you study**, each under its own key. XP, streak,
daily goal and spaced-repetition memory are all kept per language.

```jsonc
{
  "username": "aadhav",
  "updatedAt": "2026-07-28T12:34:56.000Z",  // used to resolve conflicts
  "app": "kili",
  "version": 3,
  "languages": {
    "tamil": {
      "xp": 390,
      "streak": 4,
      "lastActive": "2026-07-28",
      "goal": 30,
      "today": { "date": "2026-07-28", "xp": 45 },
      "activeDates": ["2026-07-25", "2026-07-28"],
      "practiced": { "food": true },
      "srs": {
        // "<word in the target language>␟<english>": spaced-repetition record
        "தண்ணீர்␟water": {
          "reps": 3, "interval": 7, "ease": 2.45,
          "due": "2026-08-04", "lapses": 0, "seen": "2026-07-28"
        }
      }
    },
    "spanish": {
      "xp": 120, "streak": 2, "goal": 30,
      "srs": { "el agua␟water": { "reps": 1, "interval": 1, "due": "2026-07-29" } }
    }
  }
}
```

Files written before the app went multilingual hold a single top-level `state`
instead (`"version": 2`). Those are still read — as the Tamil course — and are
rewritten in the new shape the next time you sync.

## Merging

Devices merge rather than overwrite, so practising on your phone while offline
doesn't wipe what you did on your laptop. Each language merges independently,
and a sync pulls down *every* language in the file — not only the one you have
open — so switching course on a new device finds your progress already waiting:

| Field | Rule |
|-------|------|
| `xp` | higher wins |
| `srs` (per word) | the record seen most recently wins |
| `activeDates`, `practiced` | union |
| `streak`, `lastActive`, `goal` | from whichever side was updated later |
| `today` | if the same date, the higher XP wins |

## Privacy

This repo is public, so anything here is world-readable. It holds only study
progress — no email, no password, nothing personal beyond the username you pick.
Use a name you're happy to have public, and don't reuse a password as a username.
