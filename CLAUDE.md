# Project: BMW x Ardenne Assurance enrollment flow (Beloy case study)

Take-home exercise for the Junior Front-End Developer role at Beloy.
The brief and the API documentation are in `docs/` (read them before any significant task):
- `docs/brief.pdf`: the full brief
- `docs/api.pdf`: the Ardenne Assurance API contract
- `notes/brand.md`: what I extracted from bmw.fr (colours, type, spacing, dark theme, AA adjustments)
- `notes/bmw-variables.css`, `notes/bmw-dark.css`: raw CSS custom properties copied from bmw.fr

Deadline: Tuesday 17 November 2026, 9am. Budget: about 4 hours of actual work.

## What we are building

A six-screen flow branded as BMW, responsive (mobile first), light and dark theme:
1. Landing: what the cover is, the "from" price (copy file, not the API), a way in
2. Vehicle: confirm or correct the prefilled model + delivery date (must be in the future)
3. Driver: date of birth, licence held since, claims in the last 3 years, annual mileage, postcode, parking, charging
4. Cover: three packages side by side, add-ons, yearly/monthly switch, running total, Continue disabled until a package is chosen, nothing selected when the screen opens
5. Review: answers read back, name and contact details, three consents, pre-contractual documents (invented names)
6. Payment reference: policy number, entity + reference + amount together, due date, what to do next

## Stack (non-negotiable)

- Plain HTML, CSS and JavaScript. No React, Vue, Svelte, Lit, TypeScript or build step.
- ES modules (`<script type="module">`), one file per component and per screen.
- Run with `npx serve .` (modules do not load from file://).
- No npm dependency in the shipped code. A library added with a script/link tag is tolerated but must be driven by our tokens.
- Code, file names, comments and commit messages in English.

## Beloy house rules, to respect in every file

1. **One source for colours and sizes**: `css/tokens.css`. No hex, rgb(), hsl() or named colour anywhere else. Components only use semantic tokens (`--color-bg`, `--color-accent`, `--space-4`…), never primitives. If a value is missing, add it to tokens.css first.
2. **One source for copy**: `i18n/en.json` and `i18n/fr.json`, same keys in both, keys like `flow.cover.title`. No visible text hardcoded in HTML or JS. Package names, add-on names, descriptions, legal wording, errors: all come from these files.
3. **One money formatter**: `js/money.js` (`Intl.NumberFormat`). Amounts stay in minor units (integers) everywhere, divide by 100 only at display time. Never build a price string by hand.
4. **AA contrast** on both themes, everything keyboard reachable, visible focus. If a BMW colour fails AA, change the token and record it in `notes/decisions.md`.
5. **No payment integration**: no card form, no gateway. The flow ends at the reference.
6. **No error code reaches the customer**: every error shows a title, a plain sentence and a way forward (retry, edit my answers, start a new quote). Code, message and request_id go to `console.error` only.
7. **Every wait has a defined state**: loading button or skeleton during a call, and nothing jumps when the answer lands (reserved heights).

## API rules (see docs/api.pdf)

- `BASE_URL` defined in one place only: `js/config.js`.
- Header `x-program: bmw-fr-ev` on every call.
- Annual and monthly: display the figure returned by the API for the chosen frequency. Never compute one from the other.
- Total = package price + prices of selected add-ons (same frequency). No discount.
- Add-on with `included: true`: shown as included, always on, cannot be unticked, and NOT sent in the contract `options`.
- For now the API is stubbed in `js/api.js` (documented example responses + delay), with the error cases: 422 driver_ineligible (licence < 2 years or claims_3y >= 3), 422 consent_required, 409 quote_expired, 500 internal_error.
- Reference test: comfort + WALLBOX + BATTERY + GLASS = €816.00 / year or €74.80 / month (816,00 € / 74,80 € in French).

## Folder structure

```
index.html
css/tokens.css  css/base.css  css/components.css
i18n/en.json  i18n/fr.json
js/config.js  js/api.js  js/money.js  js/i18n.js  js/state.js  js/router.js  js/main.js
js/screens/   landing.js vehicle.js driver.js cover.js review.js payment.js
js/components/ button.js field.js package-card.js stepper.js error-panel.js
dev/          tokens.html (token preview page)
notes/        brand.md decisions.md ai-log.md remarks.md
docs/         brief.pdf api.pdf (not versioned)
```

## How to work with me

- I must be able to explain every line in the interview: simple, readable code, no unnecessary tricks, short comments where it is not obvious.
- Work in small steps. Before a big task, propose a plan and wait for my approval.
- After each step, summarise in 3 lines what was done and why, so I can log it in `notes/ai-log.md`.
- If something in the brief is ambiguous, tell me (I log it in `notes/remarks.md`) rather than silently guessing.
- **Never run `git commit` or `git push` without my explicit permission.** I review everything first.
- Do not install packages or run commands that change the system without asking me.
