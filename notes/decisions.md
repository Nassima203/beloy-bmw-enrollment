# Decisions

## Brand
- Colours come from BMW's own CSS custom properties on :root (bmw.fr). The dark theme is based on BMW's .ctx-mode--dark sections.
- Typeface: Inter (Google Fonts) instead of the licensed BMW Type Next: close in shape, has the four weights BMW uses (300, 400, 500, 700) and tabular figures for prices and the payment reference.
- Logo: a typographic wordmark of my own, no roundel.

## Design tokens (css/tokens.css)

Two levels: primitives (BMW values) and semantic tokens (roles). Components only use semantic tokens, so changing one primitive recolours the whole flow.

### AA adjustments to BMW colours (house rule 4)

| # | Where | BMW value | Problem | New value | Result |
|---|---|---|---|---|---|
| 1 | Success text, light | `#3db014` | 2.8:1 on white | `#2a7a0e` | 5.4:1 on white, 4.7:1 on `#e8f2eb`. BMW green kept for icons (`--color-success-icon`) |
| 2 | Warning, both themes | `#ffad1f` | fails as text | not used as text | only `--color-warning-bg` / `--color-warning-icon`, with normal text on top |
| 3 | Disabled primary button | white on `#bbd2f3` | unreadable | text `#666666` | 3.7:1 (disabled controls are exempt, but the label stays readable) |
| 4 | Accent in dark | `#1c69d4` | 2.9:1 on `#262626` | links white, focus ring `#6ea0ec` + 1px white | 5.7:1 on `#262626` |
| 5 | Error in dark | `#d20000` | 2.7:1 on `#262626` | `#ff6b6b` | 5.5:1 on `#262626`, 7.6:1 on black |

Extra: the selected-card border uses `--color-selected-border`: BMW blue in light, `#6ea0ec` in dark, because BMW blue is only 2.9:1 on the dark surface (3:1 is required for UI parts).

### Invented dark-theme values

bmw.fr has no dark theme, only dark sections. The roles those sections don't cover were chosen and contrast-checked (also listed in brand.md, "Dark theme"):
surface-alt `#1a1a1a`, selected bg `#0f2a4d`, error bg `#3a1414`, success bg `#14301a`, warning bg `#3d2e0a`, disabled button `#4d4d4d` / `#bbbbbb`.

### Fluid type range

Headings and body-1 scale with `clamp()` between a 400px viewport (BMW mobile measurement) and 1280px (assumed desktop width; the desktop measurement width wasn't recorded). Sizes measured only on mobile stay fixed.

### Dark theme selectors

The dark values are written twice: under `:root[data-theme="dark"]` (manual toggle) and under `@media (prefers-color-scheme: dark)` on `:root:not([data-theme="light"])` (OS setting). Plain CSS can't share one block between the two selectors, so both copies must be edited together.

## Flow and layout
- The landing has no stepper or Back button: its job is to make the customer want to continue, so it should feel like a product page, not a form. Steps are counted from the vehicle screen ("Step X of 5").
- Back is hidden on the payment screen, because the policy is already issued.
- Breakpoints are written as 48em directly, because CSS does not allow custom properties inside @media.
- Answers live in memory only: the brief says a reload does not need to keep them.
- On first load, the page shows a spinner with aria-busy until the first screen renders, and the flow bar starts hidden, so nothing jumps.
- Both language files are cached and the second one is fetched in the background, so switching is instant. If a copy file fails, the app falls back to English rather than showing a blank page.
- Inter loads with display=swap: text can reflow once on the very first visit, but the brand typeface always shows. display=optional would avoid the reflow but could leave a first-time visitor on the system font.

## Cover screen
- Included add-ons are real disabled checkboxes: Tab skips them, but their "Included" label is still read. They are never sent in the contract options.
- The total bar is sticky on desktop too, so the total stays visible while the customer picks add-ons. It has a fixed minimum height so nothing jumps when the first package is chosen.
- The total is computed in one small module (pricing.js): package price + selected add-ons, for the chosen frequency, using the API figures only.
- The Monthly/Yearly switch fills the full width on phones (both options equal), and goes back to its content width from tablet up so it does not stretch across the screen.

## Review and payment
- On an expired quote, the customer is re-priced with their saved answers and taken back to the cover screen to confirm the new prices, rather than starting over.
- The payment reference uses the system monospace font (SF Mono, Menlo, Consolas), so nothing extra is downloaded. Inter's tabular figures are used everywhere else.
- Entity, reference and amount are shown together in one card, each with its own Copy button. The reference is copied without spaces and the amount without the € sign, because a banking app expects bare digits.
- On phones, each payment row stacks label, value, hint and a full-width Copy button (44px touch target), so the three rows look the same whatever the value length. From tablet width up, the value and the Copy button sit side by side.
- The payment screen has a print stylesheet, so the customer can print or save the reference as a PDF.

## Known limit
- One radius token (--radius) is used for buttons, inputs and cards. A brand with pill-shaped buttons would also round the cards. I found this while practising a rebrand on two other sites. Next step: split it into --radius-button and --radius-card.
