# CodeHelper for Students — Deploying to Netlify

This project has two parts:
1. **Frontend** (`src/`) — the React app (your original CodeHelper UI).
2. **Backend function** (`netlify/functions/generate.js`) — a tiny server that holds your Anthropic API key safely and calls Claude on your behalf. The frontend never talks to Anthropic directly.

## 1. Get a Gemini API key (free)
Go to https://aistudio.google.com → "Get API key" → Create API key. Copy it. This app uses `gemini-2.0-flash`, which is on Google's free tier — no billing required. (A Google AI Pro/Ultra *subscription* is a separate product and doesn't affect this API key either way.)

## How requests work
Each click of "Explain It!" sends exactly **one** request to Gemini (not two, not repeated). Your specific project's free tier is limited to just **5 requests per minute** for `gemini-2.5-flash` — tighter than the general published free-tier numbers, but that's what this project actually has. To respect that, the app enforces a 15-second cooldown after each click before you can ask again.

## 2. Push this project to GitHub
```bash
cd codehelper
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 3. Deploy on Netlify
1. Go to https://app.netlify.com → **Add new site → Import an existing project**.
2. Connect GitHub and pick your repo.
3. Build settings should auto-fill from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Before deploying, go to **Site configuration → Environment variables** and add:
   - Key: `GEMINI_API_KEY`
   - Value: your key from step 1
5. Click **Deploy site**.

Netlify will build the React app and automatically detect `netlify/functions/generate.js` as a serverless function, available at `/.netlify/functions/generate`.

## 4. Test it
Once deployed, open the live URL Netlify gives you, type a programming problem, and click "Explain It!". If something breaks, check **Site → Functions → generate → Logs** in the Netlify dashboard for the error.

## Local development (optional)
```bash
npm install
npm install -g netlify-cli
netlify dev
```
`netlify dev` runs both the React app and the function locally, using a `.env` file for `GEMINI_API_KEY` (create one with `GEMINI_API_KEY=your-key-here`, and add `.env` to `.gitignore` so you never commit it).

## Costs
Both Netlify's free tier and Gemini's free tier (for `gemini-2.5-flash`) cover this easily for personal use — $0 total, just with daily rate limits. If you ever outgrow the free quota, Gemini Flash is still very cheap per request.
