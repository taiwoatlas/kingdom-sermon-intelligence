# Kingdom Sermon Intelligence

A mobile-friendly sermon-to-resource workspace for pastors and church media teams.

## Current working workflow

- Enter sermon title, optional speaker/date/Scripture references, and transcript.
- Generate eight transcript-grounded resources using the Groq API: summary, outline, Scripture-reference review, devotional, small-group guide, social captions, quote candidates, and slide outline.
- The server validates request size and checks the returned resource structure before the app replaces the current resource set.
- Edit resources, copy them, export an individual text file, or export the complete resource pack.
- Save and reopen sermon projects in the current browser's local library.
- All generated resources remain drafts until a human reviews them. Nothing is published automatically.

## Free AI setup for Vercel

AI generation requires a Groq API key. Groq has a free plan with model-specific rate limits. **Keep the account on the Free plan; do not upgrade to a paid Developer plan.** If free limits are reached, generation stops with an error and the app does not switch to paid usage.

1. Create or sign in to a Groq account at https://console.groq.com/.
2. Create an API key in the Groq console: https://console.groq.com/keys.
3. In the Vercel project, open **Settings → Environment Variables**.
4. Add `GROQ_API_KEY` with the key value for Preview and Production (and Development if needed).
5. Save the variable and redeploy the latest commit.
6. Keep the key server-side only. Never put it in a `NEXT_PUBLIC_...` variable or commit it to GitHub.

The generation endpoint uses the `openai/gpt-oss-20b` model through Groq's OpenAI-compatible chat completions API. Provider limits and available models can change; check https://console.groq.com/docs/rate-limits. This project does not automatically upgrade the provider plan.

## Local development

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Create a local `.env.local` file containing:

```text
GROQ_API_KEY=your_free_plan_key_here
```

Do not commit `.env.local`.

## Current limitations

- The AI generation endpoint accepts up to 16,000 transcript characters per request. Split longer transcripts into sections until chunked generation is implemented.
- The sermon library and workspace autosave use browser local storage. They do not sync across devices and are not suitable for confidential multi-user production use.
- Authentication, shared database storage, server-side project ownership, audio transcription, and church team roles are not implemented yet.
- Bible references are detected and contextualised by the model but are not verified against a licensed Bible text source. Review every reference, quote, and generated resource before use.
- The free AI provider has rate limits and availability restrictions. Generation needs a configured server-side key.

## Verification

Run `npm run build` before treating a change as deployment-ready. Do not mark a resource approved or publish it without human review.
