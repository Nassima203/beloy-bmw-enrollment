# BMW Electric Cover: enrollment flow

```
npx serve .
```

Then open http://localhost:3000. Node is needed for `npx`; nothing else is installed.
The app uses ES modules, which browsers do not load from `file://`, so open it through the server.

Plain HTML, CSS and JavaScript. No framework, no build step, no npm dependency.
The API is stubbed in `js/api.js`, using the example responses from the Ardenne Assurance documentation.

## Structure

```
index.html            Page shell: header, Back + stepper, <main>, footer
css/
  tokens.css          Every colour and size (light and dark)
  base.css            Reset, type, page layout
  components.css      Buttons, fields, cards, screens
i18n/
  en.json  fr.json    Every string the customer reads
js/
  main.js             Start-up: theme, language, header switches
  router.js           Hash routes (#/vehicle, #/driver…), one screen at a time
  state.js            Answers and API results, in memory for one visit
  api.js              createQuote, createContract (stub or real fetch)
  config.js           BASE_URL and program, in one place
  money.js            The only money formatter
  pricing.js          Total = package + ticked add-ons, for the chosen frequency
  i18n.js  dates.js   Copy loading, date helpers
  components/         button, field, stepper, package-card, error-panel
  screens/            landing, vehicle, driver, cover, review, payment
dev/tokens.html       Preview of every token, both themes (not part of the app)
notes/                Brand extraction, decisions, remarks, AI log
```

## Tokens

`css/tokens.css` is the only file with colour values and sizes. It has three layers:

1. **Primitives**: the raw values taken from bmw.fr (`--bmw-blue-500`, `--size-4`…).
2. **Semantic tokens**: what the components use (`--color-accent`, `--color-text`, `--space-4`…).
   Components never use a primitive directly.
3. **Dark theme**: redefines the semantic colours only.

Change a semantic token and the whole flow follows. For example, set `--color-accent` to another primitive and every primary button, selected card and progress bar changes with it.

The dark values appear twice: once for the theme switch (`[data-theme="dark"]`) and once for the OS setting (`prefers-color-scheme`). Edit both together.
Where a BMW colour failed AA contrast, the token was changed; see `notes/decisions.md`.

## Copy (i18n)

- `i18n/en.json` and `i18n/fr.json` have the same keys, in the same order, e.g. `flow.cover.title`.
- In JavaScript: `t('flow.cover.title')`, or `t('flow.payment.nextStep3', { date })` for a sentence with a value.
- In HTML: `<span data-i18n="flow.common.skipLink"></span>` is filled when the page loads.
- Package names, add-on names, legal wording and error messages all live in these files. The API only returns codes.
- The EN / FR switch re-renders the current screen; answers are kept.
- Prices and dates are formatted for the language: €816.00 in English, 816,00 € in French.

## Testing the error cases

Each one shows a title, a plain sentence and a way forward. The code, message and `request_id` go to the browser console only.

| Case | How to trigger it | What you should see |
|---|---|---|
| Quote expired (409) | Open `http://localhost:3000/?fail=409#/`, go through the flow and confirm on Review | "Your quote has expired" → "Get an updated price" re-prices with the same answers and goes back to Cover |
| Server error (500) | Open `http://localhost:3000/?fail=500#/`, submit the Driver screen (or confirm on Review) | "We've hit a problem on our side" → "Try again" |
| Driver not eligible: licence | On Driver, enter a licence date less than two years ago | "We can't offer cover online for this driver" → "Edit my answers" puts the cursor on the licence date |
| Driver not eligible: claims | On Driver, enter `3` claims | Same message and way forward |
| No quote | Reload the page on `#/cover`, `#/review` or `#/payment` | "We couldn't find your quote" → a way back into the flow |

`?fail=` must come **before** the `#`, as in the links above. Remove it to go back to normal answers.

Reference test for the total: Comfort + Home wallbox + Battery health + Glass cover = €816.00 a year or €74.80 a month (816,00 € / 74,80 € in French).
