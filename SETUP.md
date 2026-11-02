# Raghavendra Kumar portfolio

Static pages with a server-side Vercel function for optional Gemini chat.

## Gemini activation

1. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/apikey
2. In the existing Vercel project (`fast-cobalt-w1xh9ue`, team `test11-50bf1`), add `GEMINI_API_KEY` in Settings → Environment Variables for Production. Keep the key server-side only.
3. Optionally set `GEMINI_MODEL` to a model available to the key. The default is `gemini-flash-latest`.
4. Redeploy after adding or changing environment variables.
5. Open the assistant and choose `Gemini AI · live`. Ask a question and verify a live answer.

Without a configured key, resume answers work locally and Gemini mode falls back clearly to resume answers. Questions are sent to Google only in Gemini mode. No chat history is stored by this application.

## Deployment

From this directory, use Vercel CLI login, link to the existing project, and deploy:

```
npx vercel login
npx vercel link --yes --project fast-cobalt-w1xh9ue --scope test11-50bf1
npx vercel deploy --prod --yes
```

The public production domain is https://raghavendra-kumar-qa.vercel.app.

## Files

- `index.html`, `app.js`, `style.css`: presentation and browser interactions.
- `portrait.jpeg`: supplied portrait.
- `resume.pdf`: supplied resume.
- `api/chat.js`: server-side Gemini API integration.
- `about/`, `work/`, `expertise/`, `contact/`: static route copies for compatible hosting.
- `vercel.json`: routing and response headers.

The API key must never be added to these files or to frontend code.
