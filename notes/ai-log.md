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