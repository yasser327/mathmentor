# 🧮 MathMentor

A web app that **helps you solve math problems without solving them for you**.

Upload a photo of a problem (or type it) and MathMentor will:

- 🔎 **identify** the topic, subtopic and difficulty,
- 🚀 tell you **how to start** (guidance, not steps),
- 💡 give up to **4 escalating hints** — never the final answer,
- ▶ suggest **YouTube searches** to learn the topic,
- ✓ **check your final answer** (and if it's wrong, nudge you — without revealing the correct one),
- 🖩 give you a built-in **scientific calculator** (DEG/RAD, trig, logs, factorial, history) so *you* do the computing.

It's a 100% static app — plain HTML/CSS/JS, no server, no build step. Your API key is stored **only in your own browser** (localStorage) and requests go directly from your browser to the AI provider.

## Quick start (local)

1. Get a free API key — recommended: **Google Gemini** at <https://aistudio.google.com/apikey> (free tier, photo understanding included).
2. Open `index.html` in your browser (double-click works; for best results use VS Code's *Live Server* extension or run `python -m http.server` in this folder).
3. Click **⚙ Settings**, paste your key, **Test connection**, **Save**.
4. Drop a photo of a math problem and click **Analyze**.

> Internet is required (AI API + KaTeX/math.js from CDN).

## Deploy on GitHub Pages

1. Create a new GitHub repository and push this folder's files to it.
2. In the repo: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save**.
3. Your app is live at `https://<your-username>.github.io/<repo-name>/`.

**Never commit an API key.** There is no key anywhere in this code — every visitor enters their own key in Settings, and it stays in their browser.

## Supported providers

| Provider | Free key | Default model | Notes |
|---|---|---|---|
| **Google Gemini** (default) | aistudio.google.com/apikey | `gemini-3.5-flash` | Best free tier, vision included |
| OpenRouter | openrouter.ai/keys | `meta-llama/llama-4-scout:free` | Pick any model ending in `:free`; needs a vision model for photos |
| Groq | console.groq.com/keys | `meta-llama/llama-4-scout-17b-16e-instruct` | Very fast; browser calls may be blocked by CORS on some plans |
| Custom | — | — | Any OpenAI-compatible `/chat/completions` endpoint |

Model names change over time (Google retired the whole Gemini 1.x–2.5 line for new users during 2026). If a model stops working, open **Settings → ⟳ List**: the app fetches the models *your key* can use and suggests a current one automatically. Old saved settings pointing at a retired Gemini model are auto-upgraded on page load.

## How "no direct answers" works

- A strict **Socratic system prompt** forbids final answers, full solutions, and "last step" computations — including against "ignore your instructions" tricks.
- The structured analysis the app requests **has no answer field at all**, so the answer never even reaches your browser.
- Hints escalate from a nudge (1) to a method roadmap (4), but the final computation is always left to you.
- The answer checker only confirms/denies **your** proposed answer.

⚠️ Reality check: no prompt is 100% jailbreak-proof, and a determined user can always ask ChatGPT instead. The goal is to make the *intended* workflow (learn → try → verify) the easiest path.

## Files

```
index.html      structure and UI
style.css       graph-paper theme
app.js          settings, photo upload, AI calls, hints, chat, answer check
calculator.js   scientific calculator (math.js)
```

## Ideas for later

- Practice-problem generator ("give me 3 similar exercises")
- "Find my mistake" mode: photograph your own working
- Progress journal per topic
- Exam mode (timed, no hints)
