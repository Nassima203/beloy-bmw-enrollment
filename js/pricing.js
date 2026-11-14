// Prices of the customer's selection, from the quote and nothing else.
// Every figure is read from the API response for the chosen frequency
// ('annual' or 'monthly'): a monthly price is never derived from a yearly one.
// All amounts are integers in minor units.

export function findPackage(quote, packageId) {
  return quote.packages.find((pkg) => pkg.id === packageId) ?? null;
}

// Package price + prices of the ticked add-ons, same frequency. No discount.
// Included add-ons are skipped: they cost nothing and are never in `optionCodes`.
// Reference: comfort + WALLBOX + BATTERY + GLASS = 81600 annual / 7480 monthly.
export function selectionTotal(pkg, optionCodes, frequency) {
  let total = pkg.price[frequency];
  for (const option of pkg.options) {
    if (!option.included && optionCodes.includes(option.code)) {
      total += option.price[frequency];
    }
  }
  return total;
}

// When the customer switches package, keep the add-ons they ticked that the
// new package still sells separately (drops the ones it already includes).
export function keepSelectableOptions(pkg, optionCodes) {
  return optionCodes.filter((code) =>
    pkg.options.some((option) => option.code === code && !option.included)
  );
}

// "{amount} a month" or "{amount} a year", matching the frequency.
export function priceKey(frequency) {
  return frequency === 'annual' ? 'flow.common.priceAnnual' : 'flow.common.priceMonthly';
}
