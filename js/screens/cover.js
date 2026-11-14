// Screen 4: cover. Yearly / monthly switch, three packages, add-ons, running total.
//
// Rules (docs/api.pdf and CLAUDE.md):
// - nothing is selected when a new quote opens (driver.js clears the selection);
// - every price is the API figure for the chosen frequency, never converted;
// - included add-ons are shown ticked and locked, and never stored in `options`;
// - total = package + ticked add-ons (js/pricing.js);
// - Continue stays disabled until a package is chosen.
//
// What re-draws when:
//   frequency changes -> package prices, add-on list, total
//   package changes   -> add-on list, total, Continue
//   add-on ticked     -> total only (so focus stays on the checkbox)

import { t, tWithElement, getLocale, createTextElement } from '../i18n.js';
import { formatMoney } from '../money.js';
import { getState, updateState } from '../state.js';
import { findPackage, selectionTotal, keepSelectableOptions, priceKey } from '../pricing.js';
import { createButton, setButtonDisabled } from '../components/button.js';
import { createRadioGroup, checkedValue } from '../components/field.js';
import { createPackageCard, updatePackagePrice } from '../components/package-card.js';
import { createErrorPanel } from '../components/error-panel.js';

export function render({ navigate }) {
  const { quote } = getState();

  // Reached without a quote (typed URL, reload): no prices to show.
  if (!quote) {
    return createMissingQuote(navigate);
  }

  // Always read the latest selection: updateState() replaces the object.
  const selection = () => getState().selection;

  const screen = document.createElement('div');
  screen.className = 'screen screen--wide';

  const header = document.createElement('header');
  header.className = 'screen__header';
  header.append(
    createTextElement('h1', 'screen__title', 'flow.cover.title'),
    createTextElement('p', 'screen__lead', 'flow.cover.lead')
  );

  // --- Yearly / monthly ------------------------------------------------------

  const frequency = createRadioGroup({
    name: 'frequency',
    legendKey: 'flow.cover.frequencyLabel',
    hintKey: 'flow.cover.frequencyHint',
    value: selection().frequency,
    layout: 'segmented',
    options: [
      { value: 'monthly', labelKey: 'flow.common.frequencyMonthly' },
      { value: 'annual', labelKey: 'flow.common.frequencyAnnual' },
    ],
  });

  // --- Packages ---------------------------------------------------------------

  const packagesGroup = createGroup('flow.cover.packagesTitle');
  const packageList = document.createElement('div');
  packageList.className = 'package-list';
  const cards = quote.packages.map((pkg) => {
    const card = createPackageCard({
      pkg,
      frequency: selection().frequency,
      checked: pkg.id === selection().packageId,
    });
    packageList.append(card);
    return { pkg, card };
  });
  packagesGroup.append(packageList);

  // --- Add-ons ----------------------------------------------------------------

  const addonsGroup = createGroup('flow.cover.addonsTitle');
  const addonList = document.createElement('div');
  addonList.className = 'addon-list';
  addonsGroup.append(createTextElement('p', 'cover-group__lead', 'flow.cover.addonsLead'), addonList);

  function renderAddons() {
    const pkg = findPackage(quote, selection().packageId);
    if (!pkg) {
      // Empty state: there is nothing to price add-ons against yet.
      addonList.replaceChildren(createTextElement('p', 'addon-list__empty', 'flow.cover.addonsEmpty'));
      return;
    }
    addonList.replaceChildren(
      ...pkg.options.map((option) =>
        createAddonRow(option, selection().frequency, selection().options.includes(option.code))
      )
    );
  }

  // --- Total + Continue (sticky bar) -----------------------------------------

  const totalValue = document.createElement('p');
  totalValue.className = 'cover-total__value';

  // aria-live: screen readers hear the new total after each change.
  // aria-atomic: they hear the label with it ("Your total, €74.80 a month").
  const total = document.createElement('div');
  total.className = 'cover-total';
  total.setAttribute('aria-live', 'polite');
  total.setAttribute('aria-atomic', 'true');
  total.append(createTextElement('p', 'cover-total__label', 'flow.cover.totalLabel'), totalValue);

  function renderTotal() {
    const pkg = findPackage(quote, selection().packageId);
    if (!pkg) {
      totalValue.classList.add('is-empty');
      totalValue.replaceChildren(t('flow.cover.totalEmpty'));
      return;
    }
    const amount = document.createElement('span');
    amount.className = 'cover-total__amount tabular';
    amount.textContent = formatMoney(selectionTotal(pkg, selection().options, selection().frequency), getLocale());
    totalValue.classList.remove('is-empty');
    totalValue.replaceChildren(...tWithElement(priceKey(selection().frequency), 'amount', amount));
  }

  const continueButton = createButton({
    labelKey: 'flow.common.continue',
    block: true,
    onClick: () => navigate('review'),
  });
  // Read with the button while it is disabled: says why it cannot be used yet.
  const continueHint = createTextElement('p', 'visually-hidden', 'flow.cover.continueHint');
  continueHint.id = 'cover-continue-hint';

  function renderContinue() {
    const hasPackage = selection().packageId !== null;
    setButtonDisabled(continueButton, !hasPackage);
    if (hasPackage) {
      continueButton.removeAttribute('aria-describedby');
    } else {
      continueButton.setAttribute('aria-describedby', continueHint.id);
    }
  }

  const summary = document.createElement('div');
  summary.className = 'cover-summary';
  summary.append(total, continueButton, continueHint);

  // --- Events -----------------------------------------------------------------

  frequency.element.addEventListener('change', () => {
    updateState('selection', { frequency: checkedValue(frequency.inputs) });
    for (const { pkg, card } of cards) {
      updatePackagePrice(card, pkg, selection().frequency);
    }
    renderAddons();
    renderTotal();
  });

  packageList.addEventListener('change', (event) => {
    const pkg = findPackage(quote, event.target.value);
    updateState('selection', {
      packageId: pkg.id,
      options: keepSelectableOptions(pkg, selection().options),
    });
    renderAddons();
    renderTotal();
    renderContinue();
  });

  addonList.addEventListener('change', () => {
    // Included add-ons are disabled, so :not(:disabled) leaves them out of `options`.
    const ticked = addonList.querySelectorAll('.addon__input:checked:not(:disabled)');
    updateState('selection', { options: Array.from(ticked, (input) => input.value) });
    renderTotal();
  });

  renderAddons();
  renderTotal();
  renderContinue();

  screen.append(header, frequency.element, packagesGroup, addonsGroup, summary);
  return screen;
}

// A <fieldset> whose legend is an h2: one group for the screen reader, one heading to jump to.
function createGroup(titleKey) {
  const group = document.createElement('fieldset');
  group.className = 'cover-group';
  const legend = document.createElement('legend');
  legend.className = 'cover-group__legend';
  legend.append(createTextElement('h2', 'cover-group__title', titleKey));
  group.append(legend);
  return group;
}

// One add-on as a checkbox card.
// Included: ticked, disabled (cannot be unticked) and marked "Included".
// Otherwise: its price for the chosen frequency.
function createAddonRow(option, frequency, checked) {
  const prefix = `addon-${option.code}`;

  const row = document.createElement('label');
  row.className = option.included ? 'addon is-included' : 'addon';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'addon__input';
  input.value = option.code;
  input.checked = option.included || checked;
  input.disabled = option.included;
  input.setAttribute('aria-labelledby', `${prefix}-name ${prefix}-price`);
  input.setAttribute('aria-describedby', `${prefix}-description`);

  const text = document.createElement('span');
  text.className = 'addon__text';
  const name = createTextElement('span', 'addon__name', `flow.addons.${option.code}.name`);
  name.id = `${prefix}-name`;
  const description = createTextElement('span', 'addon__description', `flow.addons.${option.code}.description`);
  description.id = `${prefix}-description`;
  text.append(name, description);

  const price = document.createElement('span');
  price.className = 'addon__price';
  price.id = `${prefix}-price`;
  if (option.included) {
    price.append(
      createTextElement('span', 'badge', 'flow.cover.addonIncluded'),
      createTextElement('span', 'addon__included-hint', 'flow.cover.addonIncludedHint')
    );
  } else {
    const amount = document.createElement('span');
    amount.className = 'addon__amount tabular';
    amount.textContent = formatMoney(option.price[frequency], getLocale());
    price.append(...tWithElement(priceKey(frequency), 'amount', amount));
  }

  row.append(input, text, price);
  return row;
}

function createMissingQuote(navigate) {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.append(
    createErrorPanel({
      code: 'quote_not_found',
      headingLevel: 1,
      // The answers are still in state: the driver screen gets a fresh quote in one click.
      onAction: () => navigate('driver'),
    })
  );
  return screen;
}
