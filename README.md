# VANI — Voice Assistant (deploy to Vercel, free)

## What this is
- `app/page.js` — the voice UI (the glowing blob, mic, captions)
- `app/api/chat/route.js` — the real brain. Every time you speak, this calls a real AI model (Groq, free) and gets a genuine answer, not a scripted one.

## Steps to deploy (all free, no credit card needed)

1. **Get a free Groq API key**
   - Go to https://console.groq.com/keys
   - Sign in with Google/GitHub, click "Create API Key"
   - Copy it

2. **Push this folder to GitHub**
   - Create a new repo, upload this whole `vani` folder into it.

3. **Import into Vercel**
   - Go to https://vercel.com/new
   - Import the GitHub repo
   - Framework preset: Next.js (auto-detected)
   - Vercel's free Hobby plan covers this comfortably.

4. **Add the API key**
   - In the Vercel project → Settings → Environment Variables
   - Name: `GROQ_API_KEY`
   - Value: your key from step 1
   - Save, then redeploy

5. **Open the live URL**
   - Use Chrome (desktop or Android — Safari/iOS has limited speech recognition support)
   - Tap the mic, talk, VANI replies with real, unscripted answers and remembers the conversation.

## Notes
- The API key never touches the browser — it only lives on Vercel's server, inside the `/api/chat` route.
- Model used: `llama-3.3-70b-versatile` on Groq — free tier, very fast (important for voice, so replies don't lag).
- To change VANI's personality or what it knows, edit `SYSTEM_PROMPT` in `app/api/chat/route.js`.
- Free tier limits: Groq's free tier is generous for a demo (thousands of requests/day) — plenty for showing your RM.
