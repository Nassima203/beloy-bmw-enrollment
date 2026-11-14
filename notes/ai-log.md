# AI log

## Step 1: i18n (Claude Code, plan mode)
- Asked: create js/i18n.js, i18n/en.json and i18n/fr.json covering all 6 screens, packages, add-ons, documents and every API error.
- Got: an i18n loader (fetch + flat-key t() with {placeholder} interpolation) and EN/FR copy files. Keys use the API codes directly, so screens need no mapping table. Package descriptions don't repeat what the API returns.
- Checked: a Node script confirmed both files are valid JSON with the same 209 keys.
- My review: kept the monthly "from" price at the Essential figure (€38.50 / month). French is machine-assisted, to mention in the write-up.