# Raghavendra Kumar — QA Portfolio

A responsive, business-focused portfolio explaining the value of quality assurance through interactive experiences.

**Live:** https://raghavendra-kumar-qa.vercel.app

## Experiences

- **Without QA / With QA:** CSS 3D release sandbox with simulated checkout failures and validated behavior.
- **Revenue-at-risk calculator:** transparent, hypothetical checkout-failure calculations with editable inputs.
- **Release readiness checklist:** a five-area evidence check, not a release certification.
- **Portfolio assistant:** browser-local resume answers and optional server-side Google Gemini chat.
- Dark/day themes, supplied portrait, professional experience, services, FAQ, resume and social links.
- Responsive layouts, keyboard-accessible controls, semantic HTML and reduced-motion support.

## Run locally

Use Node.js and the Vercel CLI to preview both routes and the serverless endpoint:

```sh
npx vercel dev
```

The CLI prints the local preview URL. Open that URL in your browser. A basic static server can preview the home page, but needs route rewrites to preview all pages.

## Deploy

Import this repository into Vercel, choose **Other** as the framework, and leave the build command empty. The site has no frontend build dependencies. The `api/chat.js` function runs server-side.

To enable live Gemini answers, add `GEMINI_API_KEY` in the Vercel project's Production environment variables and redeploy. Optionally configure `GEMINI_MODEL`; the default is `gemini-flash-latest`. Never put the key into browser JavaScript or commit it to Git.

Without an API key, instant resume answers remain available and live mode falls back to them clearly. The site does not store chat history. Choosing Gemini mode sends that question to Google.

## Source map

| File | Purpose |
| --- | --- |
| `index.html` | Shared document, navigation and social links |
| `app.js` | Portfolio content, theme and assistant |
| `style.css` | Shared responsive styling |
| `quality-lab.js`, `quality-lab.css` | Interactive 3D QA demonstration |
| `marketing.js`, `marketing.css` | Homepage narrative, services, calculator, checklist and FAQ |
| `qa-widget.js` | Floating demo switch and cross-page navigation |
| `api/chat.js` | Server-side Gemini integration |
| `vercel.json` | Routing and response headers |

## Content and privacy

Professional claims come from the supplied resume. Banking client identities remain confidential. Demonstration failures, example transaction amounts and calculator results are illustrative; they are not actual client results or promises of savings. The portrait and resume belong to the portfolio owner. Contact and social links are intentionally public.

## Validation

- JavaScript syntax checks using `node --check`.
- Browser checks for simulated failure and successful checkout paths.
- Calculator example: 10,000 visitors × 2% conversion × 10% checkout failures × ₹1,500 = ₹30,000 illustrative monthly revenue at risk.
- Readiness checkbox count updates with selections.
- Production page, asset and resume URL checks.

Live Gemini output requires a valid API key and has not been verified without one.
