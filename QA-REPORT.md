# QA run — 2 November 2026

Production: https://raghavendra-kumar-qa.vercel.app

## Scope and result

Twenty browser page/layout combinations were checked: Home, Work, Expertise, About and Contact at widths of 320, 390, 768 and 1440 CSS pixels. All had one primary heading, no horizontal overflow and no detected broken images. The unconfigured live-AI option was disabled in all combinations.

## Issues fixed

| Issue | Resolution |
| --- | --- |
| Expertise lacked a primary heading | Promoted its main heading to H1 |
| Home displayed a redundant Home / Home breadcrumb | Removed it on Home |
| Homepage repeated the same QA demo action | Removed the duplicate teaser |
| Floating controls could cover one another/content on narrow screens | Grouped them into one responsive utility dock and reserved bottom space |
| Mobile assistant extended beyond the left viewport edge | Constrained the panel with left/right insets |
| Assistant keyboard focus could escape unexpectedly | Added Tab/Shift+Tab cycling, Escape close and launcher focus restoration |
| A completed AI request could focus a hidden chat input | Prevented focus restoration when the panel is closed |
| Calculator silently clamped invalid values | Added visible invalid state, range/integer validation and a non-numeric result until corrected |
| Live Gemini mode was offered without a configured key | Added a server availability response and disabled unavailable live mode |
| Live mode retained a resume-only header label | Updated the mode label on change |
| Light-theme gold text had insufficient contrast | Darkened the gold used for small text; original measured pair was 4.17:1 |
| Current navigation item lacked aria-current | Added aria-current=page |
| Missing page had no useful portfolio recovery path | Added a custom 404 page with Home and Contact links |
| Floating demo decorations could intercept clicks | Disabled pointer events on decorative overlays |

## Functional checks

- Without QA checkout shows the intentional simulated duplicate-payment/missing-order error.
- With QA checkout shows one payment, one order and correct data.
- Negative calculator input shows an invalid state; valid sample computes ₹30,000.
- Readiness selections update the count.
- Theme survives reload.
- Copy email reports successful clipboard write.
- Chat provides a resume answer, cycles keyboard focus, closes with Escape and restores launcher focus.
- API tests cover availability, unsupported method, malformed/oversized/non-string/empty questions, foreign origin, missing API key, successful mocked provider response, provider error, empty response and thrown failure. No real provider requests are made by those tests.

Run backend regression checks with:

```sh
node --test api.test.cjs
```

## Limits

This was a targeted regression run in the available Chromium browser, not an exhaustive cross-browser audit or a security certification. Native iOS Safari, Firefox, real-device behavior, third-party social-site login availability and live Gemini output were not certified. Gemini still requires a valid server-side GEMINI_API_KEY; its unavailable state is handled intentionally.
