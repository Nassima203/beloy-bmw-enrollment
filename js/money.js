// The only money formatter in the project.
// Amounts travel everywhere as integers in minor units (81600 = 816.00 EUR).
// This is the one place that divides by 100, and only to display.

// formatMoney(81600, 'en-GB') -> "€816.00"
// formatMoney(81600, 'fr-FR') -> "816,00 €"
export function formatMoney(minor, locale, currency = 'EUR') {
  // A decimal or a string here means someone divided too early: fail loudly in dev.
  if (!Number.isInteger(minor)) {
    throw new TypeError(`[money] Expected an integer in minor units, got ${minor}`);
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(minor / 100);
}
