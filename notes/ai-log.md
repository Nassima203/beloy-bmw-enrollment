# AI log

Tools: Claude (chat) as guide and reviewer, Claude Code in VS Code (Opus) as builder, always in plan mode, with a CLAUDE.md holding the stack, the 7 house rules and the API rules. I approved each plan, reviewed each file, tested in the browser and committed myself.

## Step 0: brand extraction and tokens
- Asked: nothing for the extraction itself. I inspected bmw.fr in Chrome DevTools and found BMW's design tokens as CSS custom properties on :root. With the help of my AI assistant I got a short script, which I pasted into the Console to copy them (183 variables, plus the .ctx-mode--dark rules). Then I asked Claude Code to build css/tokens.css (primitives + semantic tokens, light and dark) and a dev/tokens.html preview from my notes/brand.md.
- Got: a two-level token file (components only use semantic tokens such as --color-accent, which point to primitives such as --bmw-blue-500). Claude Code checked WCAG contrast with a small Python script and flagged that my dark theme table was missing some roles instead of guessing.
- Checked: changing one primitive recolours the whole flow in both themes.
- My review: I supplied the missing dark theme values after checking their contrast, and recorded the five AA adjustments in decisions.md.

## Step 1: i18n
- Asked: create js/i18n.js, i18n/en.json and i18n/fr.json covering all 6 screens, packages, add-ons, documents and every API error.
- Got: an i18n loader (fetch + flat-key t() with {placeholder} interpolation) and EN/FR copy files. Keys use the API codes directly, so screens need no mapping table. Package descriptions don't repeat what the API returns.
- Checked: a Node script confirmed both files are valid JSON with the same keys.
- My review: kept the monthly "from" price at the Essential figure (€38.50 / month). French is machine-assisted.
- Remarks: 1 ("from" price), 2 (payment method), 3 (server error) in remarks.md.

## Step 2: config, money formatter, stubbed API
- Asked: create js/config.js (BASE_URL and PROGRAM in one place), js/money.js (the only formatter, the only place that divides by 100) and js/api.js with createQuote and createContract returning the documented responses after a delay, plus the documented error cases and a way to force quote_expired and internal_error.
- Got: config.js with a USE_STUB switch so moving to a real server is a one-line change; money.js that throws on non-integer amounts, which catches values divided too early; api.js that returns the documented responses after 900ms and throws an ApiError in the documented shape ({ code, message, request_id }). ?fail=409 forces quote_expired on the contract call, ?fail=500 forces internal_error on both calls. The real fetch path is already written with BASE_URL and the x-program header.
- Checked: in the browser console, formatMoney(81600, 'fr-FR') gives 816,00 €, formatMoney(7480, 'fr-FR') gives 74,80 € and formatMoney(81600, 'en-GB') gives €816.00, matching the API documentation.
- My review: kept Claude's choice to make the stub compute the contract from the chosen package, add-ons and frequency, so the payment screen never contradicts what the customer picked. Field-level checks (missing fields, past delivery date) stay in the screen forms.
- Remarks: 4 (two years of licence) and 5 (monthly or yearly amount: the API stub returns the amount for the chosen frequency) in remarks.md.

## Step 3: app shell
- Asked: create index.html, base.css, components.css, state.js, router.js, main.js and the button, field, stepper and error-panel components, with header (wordmark, EN/FR, light/dark), stepper and Back, focus moved to each screen h1, mobile first, only tokens and i18n keys.
- Got: a hash router that loads one screen module into <main id="app"> and moves focus to its h1; a skip link; theme and language saved in localStorage, defaulting to the OS and browser; buttons using aria-disabled so they stay focusable; fields with hints and errors linked for screen readers; logError() sending code, message and request_id to console.error only.
- Checked: Claude ran syntax, i18n key and hardcoded-colour checks. I checked the layout at 375px and 320px in Chrome device mode, since Claude could not test phone widths.
- My review: removed the stepper from the landing so it reads as a product page rather than a form; steps now start at the vehicle screen ("Step X of 5").

## Step 4: landing, vehicle and driver screens
- Asked: build the landing (product-page feel, "from" price through formatMoney, one call to action), the vehicle screen (prefilled i4, model select, future delivery date) and the driver screen (all fields, inline validation, createQuote with a loading state, human message on driver_ineligible).
- Got: a hero with a BMW-style price tag and benefit cards; a "From your order" card with the list price read-only; seven driver fields validated on blur and on submit, with focus moved to the first error; a spinner button during the quote; "Edit my answers" for ineligible drivers and "Try again" for server or network errors.
- Checked: empty form (errors under each field, focus on the first), a valid profile (moves to step 3 of 5), a licence held under two years (clear refusal panel, no error code, "Edit my answers" returns to the licence field), ?fail=500.
- My review: fixed the French wordmark accent (Électrique instead of Electrique) in fr.json.
- Remarks: 6 (price of each model) and 7 (licence and age) in remarks.md.

## Step 5: cover screen
- Asked: three package cards (side by side on desktop, stacked on mobile), nothing selected on open, a clear selected state, a yearly/monthly switch showing the API figure, included add-ons locked, a running total announced with aria-live and sticky on mobile, Continue disabled until a package is chosen.
- Got: package cards with a thick blue border and tinted background when selected; add-ons with an empty state before a package is chosen; included add-ons locked with an "Included" badge and never saved; a sticky total bar with a fixed height; the total logic in a separate pricing.js.
- Checked: comfort + Wallbox + Battery + Glass gives €74.80 monthly and €816.00 yearly, matching the API documentation; switching to Integral marks Wallbox and Glass as included; cards stack and the total stays pinned at the bottom at 375px; dark theme is readable; the whole screen works with the keyboard only.
- My review: at 375px the Monthly/Yearly switch left empty space on the right. On phones both options now share the full width; from tablet up the switch goes back to its content width. I also had the outdated "Step X of 6" comments updated to 5 steps (index.html and stepper.js).
- Remarks: 8 (nothing selected on the cover screen) in remarks.md.

## Step 6: review and payment screens
- Asked: a review screen (answers read back with Edit links, contact details, three unticked consents, pre-contractual documents) and a payment screen (policy number, entity + reference + amount together, large monospace, reference grouped by three, Copy buttons, due date, next steps, first instalment on monthly). Options sent without the included add-ons.
- Got: review cards with "Change" links per step; phone numbers converted to international format; documents as placeholder PDF links; a loading state while the policy is issued; a specific way forward for each error (go to the agreements, get an updated price, try again). A payment card with Copy buttons that announce "Copied", a fallback sentence if copying fails, four numbered next steps and a print stylesheet.
- Checked: the whole flow in the browser, monthly and yearly; the payment screen at 375px and tablet width in both themes. The copied reference pastes as 907318442, without spaces.
- My review: at 375px the reference pushed its Copy button below the value while entity and amount kept theirs on the right. I asked for one consistent layout: on phones each row is label, value, hint, then a full-width 44px Copy button; from tablet up the value and the button sit side by side. The "first monthly instalment" hint now comes before the button, so it stays next to the amount and screen readers hear it in that order.
- Remarks: 9 (phone number format) and 10 (changing answers from the review screen) in remarks.md.

## Step 7: audit against the 7 house rules
- Asked: audit the whole project against the house rules in CLAUDE.md (hardcoded colours or text, missing loading states, layout jumps, keyboard and contrast in both themes, phone issues at 375px), fix what it finds and summarise.
- Got: confirmation that no colour lives outside tokens.css, EN and FR have the same keys, money only goes through money.js and contrast passes in both themes (tightest pair 4.64:1). Nine fixes: a stepper separator hardcoded in JS; a blank page and a flow-bar jump on first load; a wait with no feedback on the language switch; a blank page if a copy file fails to load; the error panel pushing the form down and losing focus on retry; a loading button shrinking; the header wrapping at 375px in French; the sticky total bar hiding keyboard focus (WCAG 2.4.11); date values centred on iOS.
- Checked in the browser at 375px in French: one-line header, no horizontal scroll; server error and refusal panels appear right under the submit button with a clear way forward; tabbing through the add-ons never hides the focused one behind the sticky total; the language switch is instant and keeps the answers.

## Step 8: README
- Asked: a short README with the run command "npx serve ." at the top, the project structure, how the tokens and i18n files work, and how to test the error cases.
- Got: run command and why the folder must be served; one line per folder; the token layers and the dark values written twice; how copy keys work; a table of how to trigger each error case and what the customer should see; the reference total.
- My review: Claude found an example key in an i18n.js comment that did not exist and corrected it.
