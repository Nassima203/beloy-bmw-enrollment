// The only money formatter in the project.
// Amounts travel everywhere as integers in minor units (81600 = 816.00 EUR).
// This is the one place that divides by 100, and only to display.

// formatMoney(81600, 'en-GB') -> "€816.00"
// formatMoney(81600, 'fr-FR') -> "816,00 €"
export function formatMoney(minor, locale, currency = 'EUR') {
  return format(minor, locale, { style: 'currency', currency });
}

// The same amount without the currency sign, for the Copy button on the
// payment screen: a banking app's amount field expects "74,80", not "74,80 €".
// formatAmount(7480, 'fr-FR') -> "74,80"
export function formatAmount(minor, locale) {
  return format(minor, locale, { style: 'decimal', useGrouping: false });
}

function format(minor, locale, options) {
  // A decimal or a string here means someone divided too early: fail loudly in dev.
  if (!Number.isInteger(minor)) {
    throw new TypeError(`[money] Expected an integer in minor units, got ${minor}`);
  }

  const formatter = new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(minor / 100);
}
