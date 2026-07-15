/*
 * Tamil course content.
 *
 * The whole course is data. To add material, extend UNITS below — the app
 * renders whatever it finds here. Every string of Tamil carries a
 * transliteration (`tr`) and an English gloss (`en`) so absolute beginners
 * always have three anchors.
 *
 * Exercise types understood by the engine (see app.js):
 *   select : multiple choice. { prompt, promptSub, ask, choices:[], answer, note }
 *   match  : match Tamil tiles to English. { title, pairs:[{ta,tr,en}] }
 *   build  : tap word-tiles to build a translation. { prompt, promptSub, en, answer:[], pool:[] }
 *   type   : type the answer. { prompt, promptSub, ask, accept:[] }
 *   info   : a teaching card, no scoring. { title, body, rows:[{ta,tr,en}] }
 */

const COURSE = {
  title: "Tamil",
  units: [
    /* ───────────────────────── UNIT 1 · The Alphabet ───────────────────────── */
    {
      id: "alphabet",
      title: "The Alphabet",
      subtitle: "Uyir & Mei — the sounds of Tamil",
      color: "#58cc02",
      icon: "🔤",
      lessons: [
        {
          id: "vowels-1",
          title: "Vowels · உயிர் (part 1)",
          exercises: [
            {
              type: "info",
              title: "Uyir eluttu — the 12 vowels",
              body: "Tamil has 12 vowels (உயிர் எழுத்து, uyir eluttu — 'life letters'). Here are the first six. Tap 🔊 to hear each one.",
              rows: [
                { ta: "அ", tr: "a", en: "as in 'about'" },
                { ta: "ஆ", tr: "aa", en: "as in 'father'" },
                { ta: "இ", tr: "i", en: "as in 'sit'" },
                { ta: "ஈ", tr: "ii", en: "as in 'see'" },
                { ta: "உ", tr: "u", en: "as in 'put'" },
                { ta: "ஊ", tr: "uu", en: "as in 'food'" }
              ]
            },
            { type: "select", prompt: "அ", promptSub: "", ask: "Which sound is this?",
              choices: ["a", "aa", "i", "u"], answer: "a" },
            { type: "select", prompt: "ஆ", promptSub: "", ask: "Which sound is this?",
              choices: ["aa", "a", "ii", "uu"], answer: "aa" },
            { type: "select", prompt: "Pick the letter for the sound “ii”", ask: "",
              choices: ["ஈ", "இ", "உ", "அ"], answer: "ஈ" },
            { type: "match", title: "Match the vowel to its sound",
              pairs: [ { ta: "இ", tr: "i", en: "i" }, { ta: "உ", tr: "u", en: "u" },
                       { ta: "ஊ", tr: "uu", en: "uu" }, { ta: "ஆ", tr: "aa", en: "aa" } ] },
            { type: "select", prompt: "உ", ask: "Which sound is this?",
              choices: ["u", "uu", "a", "i"], answer: "u" }
          ]
        },
        {
          id: "vowels-2",
          title: "Vowels · உயிர் (part 2)",
          exercises: [
            {
              type: "info",
              title: "The last six vowels",
              body: "These complete the 12. எ/ஏ and ஒ/ஓ come in short/long pairs; ஐ and ஔ are diphthongs.",
              rows: [
                { ta: "எ", tr: "e", en: "as in 'pen' (short)" },
                { ta: "ஏ", tr: "ee", en: "as in 'play' (long)" },
                { ta: "ஐ", tr: "ai", en: "as in 'aisle'" },
                { ta: "ஒ", tr: "o", en: "as in 'off' (short)" },
                { ta: "ஓ", tr: "oo", en: "as in 'go' (long)" },
                { ta: "ஔ", tr: "au", en: "as in 'cow'" }
              ]
            },
            { type: "select", prompt: "ஏ", ask: "Which sound is this?",
              choices: ["ee", "e", "ai", "o"], answer: "ee" },
            { type: "select", prompt: "ஐ", ask: "Which sound is this?",
              choices: ["ai", "au", "o", "e"], answer: "ai" },
            { type: "select", prompt: "Pick the letter for the sound “au”", ask: "",
              choices: ["ஔ", "ஓ", "ஐ", "எ"], answer: "ஔ" },
            { type: "match", title: "Match the vowel to its sound",
              pairs: [ { ta: "எ", tr: "e", en: "e" }, { ta: "ஏ", tr: "ee", en: "ee" },
                       { ta: "ஒ", tr: "o", en: "o" }, { ta: "ஓ", tr: "oo", en: "oo" } ] },
            { type: "select", prompt: "ஒ", ask: "Which sound is this?",
              choices: ["o", "oo", "au", "a"], answer: "o" }
          ]
        },
        {
          id: "consonants-1",
          title: "Consonants · மெய் (part 1)",
          exercises: [
            {
              type: "info",
              title: "Mei eluttu — consonants",
              body: "Consonants (மெய், mei — 'body letters') carry a dot (puḷḷi) on top, meaning 'no vowel'. Here are six common ones.",
              rows: [
                { ta: "க்", tr: "k", en: "k / g" },
                { ta: "ங்", tr: "ṅ", en: "ng, as in 'sing'" },
                { ta: "ச்", tr: "c", en: "ch / s" },
                { ta: "ட்", tr: "ṭ", en: "hard t / d" },
                { ta: "த்", tr: "t", en: "soft th, as in 'the'" },
                { ta: "ப்", tr: "p", en: "p / b" }
              ]
            },
            { type: "select", prompt: "க்", ask: "Which sound is this?",
              choices: ["k", "ch", "p", "t"], answer: "k" },
            { type: "select", prompt: "ப்", ask: "Which sound is this?",
              choices: ["p", "k", "t", "ch"], answer: "p" },
            { type: "match", title: "Match the consonant to its sound",
              pairs: [ { ta: "ச்", tr: "c", en: "ch" }, { ta: "த்", tr: "t", en: "th" },
                       { ta: "ட்", tr: "ṭ", en: "hard t" }, { ta: "ங்", tr: "ṅ", en: "ng" } ] },
            {
              type: "info",
              title: "Vowel + consonant = a full letter",
              body: "A consonant with the inherent 'a' vowel drops the dot: க் (k) + அ (a) = க (ka). Add other vowels with signs:",
              rows: [
                { ta: "க", tr: "ka", en: "k + a" },
                { ta: "கா", tr: "kaa", en: "k + aa" },
                { ta: "கி", tr: "ki", en: "k + i" },
                { ta: "கு", tr: "ku", en: "k + u" }
              ]
            },
            { type: "select", prompt: "கா", ask: "How is this read?",
              choices: ["kaa", "ka", "ki", "ku"], answer: "kaa" }
          ]
        }
      ]
    },

    /* ───────────────────────── UNIT 2 · Greetings & Basics ───────────────────────── */
    {
      id: "basics",
      title: "Greetings & Basics",
      subtitle: "Say hello and be polite",
      color: "#1cb0f6",
      icon: "👋",
      lessons: [
        {
          id: "greetings-1",
          title: "First words",
          exercises: [
            {
              type: "info",
              title: "Everyday words",
              body: "The words you'll use most. வணக்கம் works for both 'hello' and 'goodbye'.",
              rows: [
                { ta: "வணக்கம்", tr: "vaṇakkam", en: "hello / goodbye" },
                { ta: "நன்றி", tr: "naṉṟi", en: "thank you" },
                { ta: "ஆம்", tr: "aam", en: "yes" },
                { ta: "இல்லை", tr: "illai", en: "no" }
              ]
            },
            { type: "select", prompt: "வணக்கம்", promptSub: "vaṇakkam", ask: "What does this mean?",
              choices: ["hello", "thank you", "yes", "sorry"], answer: "hello" },
            { type: "select", prompt: "Which word means “thank you”?", ask: "",
              choices: ["நன்றி", "வணக்கம்", "ஆம்", "இல்லை"], answer: "நன்றி",
              subFor: { "நன்றி": "naṉṟi", "வணக்கம்": "vaṇakkam", "ஆம்": "aam", "இல்லை": "illai" } },
            { type: "match", title: "Match Tamil to English",
              pairs: [ { ta: "வணக்கம்", tr: "vaṇakkam", en: "hello" },
                       { ta: "நன்றி", tr: "naṉṟi", en: "thank you" },
                       { ta: "ஆம்", tr: "aam", en: "yes" },
                       { ta: "இல்லை", tr: "illai", en: "no" } ] },
            { type: "type", prompt: "இல்லை", promptSub: "illai", ask: "Type the meaning in English",
              accept: ["no"] },
            { type: "select", prompt: "ஆம்", promptSub: "aam", ask: "What does this mean?",
              choices: ["yes", "no", "hello", "please"], answer: "yes" }
          ]
        },
        {
          id: "greetings-2",
          title: "Being polite",
          exercises: [
            {
              type: "info",
              title: "Polite phrases",
              body: "A few more to sound friendly.",
              rows: [
                { ta: "தயவு செய்து", tr: "tayavu ceytu", en: "please" },
                { ta: "மன்னிக்கவும்", tr: "maṉṉikkavum", en: "sorry / excuse me" },
                { ta: "நலம்", tr: "nalam", en: "well / fine" },
                { ta: "நீங்கள் எப்படி இருக்கிறீர்கள்?", tr: "nīṅgaḷ eppaṭi irukkiṟīrgaḷ?", en: "How are you?" }
              ]
            },
            { type: "select", prompt: "மன்னிக்கவும்", promptSub: "maṉṉikkavum", ask: "What does this mean?",
              choices: ["sorry", "thank you", "hello", "yes"], answer: "sorry" },
            { type: "build", prompt: "How are you?", promptSub: "", en: "Build the Tamil sentence",
              answer: ["நீங்கள்", "எப்படி", "இருக்கிறீர்கள்"],
              pool: ["வணக்கம்", "நன்றி"],
              tr: { "நீங்கள்": "nīṅgaḷ", "எப்படி": "eppaṭi", "இருக்கிறீர்கள்": "irukkiṟīrgaḷ",
                    "வணக்கம்": "vaṇakkam", "நன்றி": "naṉṟi" } },
            { type: "select", prompt: "Which word means “please”?", ask: "",
              choices: ["தயவு செய்து", "மன்னிக்கவும்", "நன்றி", "நலம்"], answer: "தயவு செய்து",
              subFor: { "தயவு செய்து": "tayavu ceytu", "மன்னிக்கவும்": "maṉṉikkavum",
                        "நன்றி": "naṉṟi", "நலம்": "nalam" } },
            { type: "match", title: "Match Tamil to English",
              pairs: [ { ta: "தயவு செய்து", tr: "tayavu ceytu", en: "please" },
                       { ta: "மன்னிக்கவும்", tr: "maṉṉikkavum", en: "sorry" },
                       { ta: "நலம்", tr: "nalam", en: "fine" } ] }
          ]
        }
      ]
    },

    /* ───────────────────────── UNIT 3 · Numbers ───────────────────────── */
    {
      id: "numbers",
      title: "Numbers",
      subtitle: "Count from 1 to 10",
      color: "#ff9600",
      icon: "🔢",
      lessons: [
        {
          id: "numbers-1",
          title: "One to five",
          exercises: [
            {
              type: "info",
              title: "1–5",
              body: "Counting words. Tamil also has its own digits, but everyday writing uses 1, 2, 3…",
              rows: [
                { ta: "ஒன்று", tr: "oṉṟu", en: "one (1)" },
                { ta: "இரண்டு", tr: "iraṇṭu", en: "two (2)" },
                { ta: "மூன்று", tr: "mūṉṟu", en: "three (3)" },
                { ta: "நான்கு", tr: "nāṉku", en: "four (4)" },
                { ta: "ஐந்து", tr: "aindu", en: "five (5)" }
              ]
            },
            { type: "select", prompt: "மூன்று", promptSub: "mūṉṟu", ask: "Which number is this?",
              choices: ["3", "2", "4", "5"], answer: "3" },
            { type: "select", prompt: "Which word means “5”?", ask: "",
              choices: ["ஐந்து", "நான்கு", "இரண்டு", "ஒன்று"], answer: "ஐந்து",
              subFor: { "ஐந்து": "aindu", "நான்கு": "nāṉku", "இரண்டு": "iraṇṭu", "ஒன்று": "oṉṟu" } },
            { type: "match", title: "Match the number",
              pairs: [ { ta: "ஒன்று", tr: "oṉṟu", en: "1" }, { ta: "இரண்டு", tr: "iraṇṭu", en: "2" },
                       { ta: "நான்கு", tr: "nāṉku", en: "4" }, { ta: "ஐந்து", tr: "aindu", en: "5" } ] },
            { type: "type", prompt: "இரண்டு", promptSub: "iraṇṭu", ask: "Type the number (digits)",
              accept: ["2"] }
          ]
        },
        {
          id: "numbers-2",
          title: "Six to ten",
          exercises: [
            {
              type: "info",
              title: "6–10",
              rows: [
                { ta: "ஆறு", tr: "āṟu", en: "six (6)" },
                { ta: "ஏழு", tr: "ēḻu", en: "seven (7)" },
                { ta: "எட்டு", tr: "eṭṭu", en: "eight (8)" },
                { ta: "ஒன்பது", tr: "oṉpatu", en: "nine (9)" },
                { ta: "பத்து", tr: "pattu", en: "ten (10)" }
              ]
            },
            { type: "select", prompt: "பத்து", promptSub: "pattu", ask: "Which number is this?",
              choices: ["10", "8", "9", "7"], answer: "10" },
            { type: "select", prompt: "எட்டு", promptSub: "eṭṭu", ask: "Which number is this?",
              choices: ["8", "6", "9", "10"], answer: "8" },
            { type: "match", title: "Match the number",
              pairs: [ { ta: "ஆறு", tr: "āṟu", en: "6" }, { ta: "ஏழு", tr: "ēḻu", en: "7" },
                       { ta: "ஒன்பது", tr: "oṉpatu", en: "9" }, { ta: "பத்து", tr: "pattu", en: "10" } ] },
            { type: "type", prompt: "seven", ask: "Type the Tamil word (transliteration is fine)",
              accept: ["ஏழு", "eelu", "ezhu", "ēḻu", "elu"] }
          ]
        }
      ]
    },

    /* ───────────────────────── UNIT 4 · People & Pronouns ───────────────────────── */
    {
      id: "people",
      title: "People & Pronouns",
      subtitle: "I, you, he, she…",
      color: "#ce82ff",
      icon: "🧑",
      lessons: [
        {
          id: "pronouns-1",
          title: "Pronouns",
          exercises: [
            {
              type: "info",
              title: "Who's who",
              body: "Tamil has two 'you's: நீ (informal) and நீங்கள் (polite/plural). Same idea as tu/vous.",
              rows: [
                { ta: "நான்", tr: "nāṉ", en: "I" },
                { ta: "நீ", tr: "nī", en: "you (informal)" },
                { ta: "நீங்கள்", tr: "nīṅgaḷ", en: "you (polite/plural)" },
                { ta: "அவன்", tr: "avaṉ", en: "he" },
                { ta: "அவள்", tr: "avaḷ", en: "she" },
                { ta: "அது", tr: "atu", en: "it" },
                { ta: "நாங்கள்", tr: "nāṅgaḷ", en: "we" },
                { ta: "அவர்கள்", tr: "avargaḷ", en: "they" }
              ]
            },
            { type: "select", prompt: "நான்", promptSub: "nāṉ", ask: "What does this mean?",
              choices: ["I", "you", "he", "we"], answer: "I" },
            { type: "select", prompt: "அவள்", promptSub: "avaḷ", ask: "What does this mean?",
              choices: ["she", "he", "it", "they"], answer: "she" },
            { type: "match", title: "Match the pronoun",
              pairs: [ { ta: "நான்", tr: "nāṉ", en: "I" }, { ta: "நீ", tr: "nī", en: "you" },
                       { ta: "அவன்", tr: "avaṉ", en: "he" }, { ta: "நாங்கள்", tr: "nāṅgaḷ", en: "we" } ] },
            { type: "select", prompt: "Which is the polite “you”?", ask: "",
              choices: ["நீங்கள்", "நீ", "நான்", "அவர்கள்"], answer: "நீங்கள்",
              subFor: { "நீங்கள்": "nīṅgaḷ", "நீ": "nī", "நான்": "nāṉ", "அவர்கள்": "avargaḷ" } },
            { type: "type", prompt: "they", ask: "Type the Tamil (transliteration is fine)",
              accept: ["அவர்கள்", "avargal", "avarkal", "avargaḷ"] }
          ]
        },
        {
          id: "family-1",
          title: "Family",
          exercises: [
            {
              type: "info",
              title: "Family words",
              rows: [
                { ta: "அம்மா", tr: "ammā", en: "mother" },
                { ta: "அப்பா", tr: "appā", en: "father" },
                { ta: "அண்ணா", tr: "aṇṇā", en: "elder brother" },
                { ta: "அக்கா", tr: "akkā", en: "elder sister" },
                { ta: "நண்பன்", tr: "naṇpaṉ", en: "friend (m)" }
              ]
            },
            { type: "select", prompt: "அம்மா", promptSub: "ammā", ask: "What does this mean?",
              choices: ["mother", "father", "sister", "friend"], answer: "mother" },
            { type: "match", title: "Match the family word",
              pairs: [ { ta: "அப்பா", tr: "appā", en: "father" }, { ta: "அண்ணா", tr: "aṇṇā", en: "elder brother" },
                       { ta: "அக்கா", tr: "akkā", en: "elder sister" }, { ta: "நண்பன்", tr: "naṇpaṉ", en: "friend" } ] },
            { type: "select", prompt: "Which word means “father”?", ask: "",
              choices: ["அப்பா", "அம்மா", "அக்கா", "அண்ணா"], answer: "அப்பா",
              subFor: { "அப்பா": "appā", "அம்மா": "ammā", "அக்கா": "akkā", "அண்ணா": "aṇṇā" } }
          ]
        }
      ]
    },

    /* ───────────────────────── UNIT 5 · Words & Verbs ───────────────────────── */
    {
      id: "words",
      title: "Everyday Words",
      subtitle: "Nouns and verbs you need",
      color: "#ff4b4b",
      icon: "🍚",
      lessons: [
        {
          id: "nouns-1",
          title: "Common nouns",
          exercises: [
            {
              type: "info",
              title: "Things around you",
              rows: [
                { ta: "வீடு", tr: "vīṭu", en: "house" },
                { ta: "தண்ணீர்", tr: "taṇṇīr", en: "water" },
                { ta: "சாப்பாடு", tr: "sāppāṭu", en: "food / meal" },
                { ta: "புத்தகம்", tr: "puttakam", en: "book" },
                { ta: "பள்ளி", tr: "paḷḷi", en: "school" },
                { ta: "நாய்", tr: "nāy", en: "dog" }
              ]
            },
            { type: "select", prompt: "தண்ணீர்", promptSub: "taṇṇīr", ask: "What does this mean?",
              choices: ["water", "food", "house", "book"], answer: "water" },
            { type: "select", prompt: "Which word means “book”?", ask: "",
              choices: ["புத்தகம்", "பள்ளி", "வீடு", "நாய்"], answer: "புத்தகம்",
              subFor: { "புத்தகம்": "puttakam", "பள்ளி": "paḷḷi", "வீடு": "vīṭu", "நாய்": "nāy" } },
            { type: "match", title: "Match the noun",
              pairs: [ { ta: "வீடு", tr: "vīṭu", en: "house" }, { ta: "சாப்பாடு", tr: "sāppāṭu", en: "food" },
                       { ta: "பள்ளி", tr: "paḷḷi", en: "school" }, { ta: "நாய்", tr: "nāy", en: "dog" } ] },
            { type: "type", prompt: "வீடு", promptSub: "vīṭu", ask: "Type the meaning in English",
              accept: ["house", "home"] }
          ]
        },
        {
          id: "verbs-1",
          title: "Action verbs",
          exercises: [
            {
              type: "info",
              title: "Verb roots (commands)",
              body: "These are the plain roots — also used as informal commands: 'eat!', 'go!'.",
              rows: [
                { ta: "சாப்பிடு", tr: "sāppiṭu", en: "eat" },
                { ta: "குடி", tr: "kuṭi", en: "drink" },
                { ta: "போ", tr: "pō", en: "go" },
                { ta: "வா", tr: "vā", en: "come" },
                { ta: "படி", tr: "paṭi", en: "read / study" },
                { ta: "பார்", tr: "pār", en: "see / look" }
              ]
            },
            { type: "select", prompt: "வா", promptSub: "vā", ask: "What does this mean?",
              choices: ["come", "go", "eat", "see"], answer: "come" },
            { type: "select", prompt: "படி", promptSub: "paṭi", ask: "What does this mean?",
              choices: ["read", "drink", "come", "go"], answer: "read" },
            { type: "match", title: "Match the verb",
              pairs: [ { ta: "சாப்பிடு", tr: "sāppiṭu", en: "eat" }, { ta: "குடி", tr: "kuṭi", en: "drink" },
                       { ta: "போ", tr: "pō", en: "go" }, { ta: "பார்", tr: "pār", en: "see" } ] },
            { type: "type", prompt: "go", ask: "Type the Tamil (transliteration is fine)",
              accept: ["போ", "po", "pō"] }
          ]
        }
      ]
    },

    /* ───────────────────────── UNIT 6 · Sentences & Grammar ───────────────────────── */
    {
      id: "sentences",
      title: "Sentences & Grammar",
      subtitle: "Word order, cases and tenses",
      color: "#2b70c9",
      icon: "📝",
      lessons: [
        {
          id: "svo-1",
          title: "Simple sentences",
          exercises: [
            {
              type: "info",
              title: "Tamil is Subject–Object–Verb",
              body: "Unlike English (I eat food), Tamil puts the verb last: I food eat. நான் சாப்பாடு சாப்பிடுகிறேன்.",
              rows: [
                { ta: "நான் சாப்பிடுகிறேன்", tr: "nāṉ sāppiṭukiṟēṉ", en: "I eat / I am eating" },
                { ta: "நீ வருகிறாய்", tr: "nī varukiṟāy", en: "you come / you are coming" },
                { ta: "அவன் படிக்கிறான்", tr: "avaṉ paṭikkiṟāṉ", en: "he reads / he is reading" }
              ]
            },
            { type: "select", prompt: "நான் சாப்பிடுகிறேன்", promptSub: "nāṉ sāppiṭukiṟēṉ",
              ask: "What does this mean?",
              choices: ["I am eating", "you are eating", "he is eating", "I am drinking"], answer: "I am eating" },
            { type: "build", prompt: "I am reading", promptSub: "", en: "Remember: verb goes last",
              answer: ["நான்", "படிக்கிறேன்"],
              pool: ["சாப்பிடுகிறேன்", "நீ"],
              tr: { "நான்": "nāṉ", "படிக்கிறேன்": "paṭikkiṟēṉ",
                    "சாப்பிடுகிறேன்": "sāppiṭukiṟēṉ", "நீ": "nī" } },
            { type: "build", prompt: "He is reading a book", promptSub: "",
              en: "Order: he — book — reads",
              answer: ["அவன்", "புத்தகம்", "படிக்கிறான்"],
              pool: ["நான்", "சாப்பிடுகிறேன்"],
              tr: { "அவன்": "avaṉ", "புத்தகம்": "puttakam", "படிக்கிறான்": "paṭikkiṟāṉ",
                    "நான்": "nāṉ", "சாப்பிடுகிறேன்": "sāppiṭukiṟēṉ" } },
            { type: "select", prompt: "In Tamil, where does the verb usually go?", ask: "",
              choices: ["at the end", "at the start", "in the middle", "it varies freely"], answer: "at the end" }
          ]
        },
        {
          id: "cases-1",
          title: "“I want water”",
          exercises: [
            {
              type: "info",
              title: "Wanting and having",
              body: "வேண்டும் (vēṇṭum) = 'is wanted/needed'. The wanter takes the -kku ending: enakku = 'to me'.",
              rows: [
                { ta: "எனக்கு", tr: "eṉakku", en: "to me / for me" },
                { ta: "வேண்டும்", tr: "vēṇṭum", en: "want / need" },
                { ta: "எனக்கு தண்ணீர் வேண்டும்", tr: "eṉakku taṇṇīr vēṇṭum", en: "I want water" },
                { ta: "எனக்கு சாப்பாடு வேண்டும்", tr: "eṉakku sāppāṭu vēṇṭum", en: "I want food" }
              ]
            },
            { type: "build", prompt: "I want water", promptSub: "",
              en: "Literally: to-me — water — is-wanted",
              answer: ["எனக்கு", "தண்ணீர்", "வேண்டும்"],
              pool: ["சாப்பாடு", "நான்"],
              tr: { "எனக்கு": "eṉakku", "தண்ணீர்": "taṇṇīr", "வேண்டும்": "vēṇṭum",
                    "சாப்பாடு": "sāppāṭu", "நான்": "nāṉ" } },
            { type: "select", prompt: "எனக்கு சாப்பாடு வேண்டும்", promptSub: "eṉakku sāppāṭu vēṇṭum",
              ask: "What does this mean?",
              choices: ["I want food", "I want water", "I have food", "I like food"], answer: "I want food" },
            { type: "type", prompt: "I want water", ask: "Type it in Tamil (transliteration is fine)",
              accept: ["எனக்கு தண்ணீர் வேண்டும்", "enakku thanneer vendum", "enakku tanneer vendum",
                       "eṉakku taṇṇīr vēṇṭum"] }
          ]
        },
        {
          id: "tenses-1",
          title: "Past, present, future",
          exercises: [
            {
              type: "info",
              title: "Three tenses of one verb",
              body: "Tamil tense sits in the middle of the verb. For 'I' (nāṉ), watch the middle change: -kiṟ- (present), -t/-nt- (past), -v/-p- (future).",
              rows: [
                { ta: "நான் சாப்பிடுகிறேன்", tr: "nāṉ sāppiṭukiṟēṉ", en: "I eat (present)" },
                { ta: "நான் சாப்பிட்டேன்", tr: "nāṉ sāppiṭṭēṉ", en: "I ate (past)" },
                { ta: "நான் சாப்பிடுவேன்", tr: "nāṉ sāppiṭuvēṉ", en: "I will eat (future)" }
              ]
            },
            { type: "select", prompt: "நான் சாப்பிட்டேன்", promptSub: "nāṉ sāppiṭṭēṉ",
              ask: "Which tense — what does it mean?",
              choices: ["I ate", "I eat", "I will eat", "I am eating"], answer: "I ate" },
            { type: "select", prompt: "நான் சாப்பிடுவேன்", promptSub: "nāṉ sāppiṭuvēṉ",
              ask: "What does this mean?",
              choices: ["I will eat", "I ate", "I eat", "I want to eat"], answer: "I will eat" },
            { type: "match", title: "Match the tense",
              pairs: [ { ta: "சாப்பிடுகிறேன்", tr: "sāppiṭukiṟēṉ", en: "I eat" },
                       { ta: "சாப்பிட்டேன்", tr: "sāppiṭṭēṉ", en: "I ate" },
                       { ta: "சாப்பிடுவேன்", tr: "sāppiṭuvēṉ", en: "I will eat" } ] },
            { type: "build", prompt: "I will go", promptSub: "", en: "Future tense",
              answer: ["நான்", "போவேன்"],
              pool: ["போனேன்", "போகிறேன்"],
              tr: { "நான்": "nāṉ", "போவேன்": "pōvēṉ", "போனேன்": "pōṉēṉ", "போகிறேன்": "pōkiṟēṉ" } }
          ]
        }
      ]
    }
  ]
};

if (typeof window !== "undefined") window.COURSE = COURSE;
