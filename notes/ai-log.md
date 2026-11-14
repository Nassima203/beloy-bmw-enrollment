# AI log

## Step 1: i18n (Claude Code, plan mode)
- Asked: create js/i18n.js, i18n/en.json and i18n/fr.json covering all 6 screens, packages, add-ons, documents and every API error.
- Got: an i18n loader (fetch + flat-key t() with {placeholder} interpolation) and EN/FR copy files. Keys use the API codes directly, so screens need no mapping table. Package descriptions don't repeat what the API returns.
- Checked: a Node script confirmed both files are valid JSON with the same 209 keys.
- My review: kept the monthly "from" price at the Essential figure (€38.50 / month). French is machine-assisted, to mention in the write-up.
## Step 2: config, money, stubbed API (Claude Code)
## Step 2: config, money formatter, stubbed API (Claude Code, plan mode)
- Asked: create js/config.js (BASE_URL and PROGRAM in one place), js/money.js (the only formatter, the only place that divides by 100) and js/api.js with createQuote and createContract returning the documented responses after a delay, plus the documented error cases and a way to force quote_expired and internal_error.
- Got: config.js with a USE_STUB switch so moving to a real server is a one-line change; money.js that throws on non-integer amounts, which catches values divided too early; api.js that returns the documented responses after 900ms and throws an ApiError in the documented shape ({ code, message, request_id }). ?fail=409 forces quote_expired on the contract call, ?fail=500 forces internal_error on both calls. The real fetch path is already written with BASE_URL and the x-program header.
- Checked: in the browser console, formatMoney(81600, 'fr-FR') gives 816,00 €, formatMoney(7480, 'fr-FR') gives 74,80 € and formatMoney(81600, 'en-GB') gives €816.00, matching the API documentation.
- My review: kept Claude's choice to make the stub compute the contract from the chosen package, add-ons and frequency, so the payment screen never contradicts what the customer picked. Noted two ambiguities in remarks.md (licence "under two years" counted from today; fixed figures vs chosen frequency). Field-level checks (missing fields, past delivery date) stay in the screen forms.

## Step 3: app shell (Claude Code, plan mode)
- Asked: create index.html, base.css, components.css, state.js, router.js, main.js and the button, field, stepper and error-panel components, with header (wordmark, EN/FR, light/dark), stepper and Back, focus moved to each screen h1, mobile first, only tokens and i18n keys.
- Got: a hash router that loads one screen module into <main id="app"> and moves focus to its h1; a skip link; theme and language saved in localStorage, defaulting to the OS and browser; buttons using aria-disabled so they stay focusable; fields with hints and errors linked for screen readers; logError() sending code, message and request_id to console.error only. Claude added the missing tokens (44px touch target, widths, spinner) and four i18n keys.
- Checked: Claude ran syntax, i18n key and hardcoded-colour checks. I checked the layout at 375px and 320px in Chrome device mode, since Claude could not test phone widths.
- My review: removed the stepper from the landing so it reads as a product page rather than a form; steps now start at the vehicle screen.

## Step 4: landing, vehicle and driver screens (Claude Code, plan mode)
- Asked: build the landing (product-page feel, "from" price through formatMoney, one call to action), the vehicle screen (prefilled i4, model select, future delivery date) and the driver screen (all fields, inline validation, createQuote with a loading state, human message on driver_ineligible).
- Got: a hero with a BMW-style price tag and benefit cards; a "From your order" card with the list price read-only; seven driver fields validated on blur and on submit, with focus moved to the first error; a spinner button during the quote; "Edit my answers" for ineligible drivers and "Try again" for server or network errors. Claude also added a small dates.js helper.
- Checked: I tested by hand: empty form (errors under each field, focus on the first), a valid profile (moves to step 3 of 5), a licence held under two years (clear refusal panel, no error code, "Edit my answers" returns to the licence field).
- My review: fixed the French wordmark accent (Électrique instead of Electrique) in fr.json.

## Step 5: cover screen (Claude Code, plan mode)
- Asked: three package cards (side by side on desktop, stacked on mobile), nothing selected on open, a clear selected state, a yearly/monthly switch showing the API figure, included add-ons locked, a running total announced with aria-live and sticky on mobile, Continue disabled until a package is chosen.
- Got: package cards with a thick blue border and tinted background when selected; add-ons with an empty state before a package is chosen; included add-ons locked with an "Included" badge and never saved; a sticky total bar with a fixed height; the total logic in a separate pricing.js. Claude tested the reference total in Node but could not render the screen with a quote.
- Checked: I tested by hand: comfort + Wallbox + Battery + Glass gives €74.80 monthly and €816.00 yearly, matching the API documentation; switching to Integral marks Wallbox and Glass as included; cards stack and the total stays pinned at the bottom at 375px; dark theme is readable; the whole screen works with the keyboard only (Tab to move, Space to select).
- My review: at 375px the Monthly/Yearly switch left empty space on the right. I asked Claude to fix it: on phones both options now share the full width equally, and from tablet width up the switch goes back to its content width so it does not stretch across the screen. I also had the outdated "Step X of 6" comments updated to 5 steps; Claude found the same leftover in stepper.js as well as index.html, so the comments now match the behaviour.