// Package card: one radio option of the "Packages" group, drawn as a card.
// The whole card is the click target (it is a <label>), but its accessible name
// is kept short with aria-labelledby: "Comfort, €56.10 a month". The description
// is read as the description. Checked state = selected card (CSS :has()).

import { t, tWithElement, getLocale, createTextElement } from '../i18n.js';
import { formatMoney } from '../money.js';
import { priceKey } from '../pricing.js';

const CHECK_ICON =
  '<svg class="icon icon--small" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>';

// createPackageCard({ pkg: quote.packages[1], frequency: 'monthly', checked: false })
export function createPackageCard({ pkg, frequency, checked }) {
  const prefix = `package-${pkg.id}`;
  const card = document.createElement('label');
  card.className = 'package-card';
  card.dataset.packageId = pkg.id;

  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'package';
  input.value = pkg.id;
  input.checked = checked;
  input.className = 'package-card__input';
  input.setAttribute('aria-labelledby', `${prefix}-name ${prefix}-price`);
  input.setAttribute('aria-describedby', `${prefix}-description`);

  const header = document.createElement('span');
  header.className = 'package-card__header';
  const name = createTextElement('span', 'package-card__name', `flow.packages.${pkg.id}.name`);
  name.id = `${prefix}-name`;
  header.append(input, name);

  const description = createTextElement('span', 'package-card__description', `flow.packages.${pkg.id}.description`);
  description.id = `${prefix}-description`;

  const price = document.createElement('span');
  price.className = 'package-card__price';
  price.id = `${prefix}-price`;

  card.append(header, description, price, createIncludes(pkg), createStatus(pkg));
  updatePackagePrice(card, pkg, frequency);
  return card;
}

// Called when the customer switches yearly / monthly.
// Shows the figure the API returned for that frequency, as it is.
export function updatePackagePrice(card, pkg, frequency) {
  const amount = document.createElement('span');
  amount.className = 'package-card__amount tabular';
  amount.textContent = formatMoney(pkg.price[frequency], getLocale());

  card.querySelector('.package-card__price').replaceChildren(...tWithElement(priceKey(frequency), 'amount', amount));
}

// "Included as standard" + the add-ons this package includes,
// or "Add only the extras you need" when it includes none (Essential).
function createIncludes(pkg) {
  const block = document.createElement('span');
  block.className = 'package-card__includes';

  const included = pkg.options.filter((option) => option.included);
  if (included.length === 0) {
    block.append(createTextElement('span', 'package-card__includes-title', 'flow.cover.packageIncludesNone'));
    return block;
  }

  block.append(createTextElement('span', 'package-card__includes-title', 'flow.cover.packageIncludes'));
  const list = document.createElement('ul');
  list.className = 'package-card__includes-list';
  for (const option of included) {
    const item = document.createElement('li');
    item.insertAdjacentHTML('beforeend', CHECK_ICON);
    item.append(createTextElement('span', '', `flow.addons.${option.code}.name`));
    list.append(item);
  }
  block.append(list);
  return block;
}

// Bottom of the card: "Choose Comfort" before, "✓ Selected" after.
// CSS shows one or the other from the radio state. Both are aria-hidden:
// the radio already announces "selected / not selected".
function createStatus(pkg) {
  const status = document.createElement('span');
  status.className = 'package-card__status';
  status.setAttribute('aria-hidden', 'true');

  const choose = document.createElement('span');
  choose.className = 'package-card__choose';
  choose.textContent = t('flow.cover.packageChoose', { name: t(`flow.packages.${pkg.id}.name`) });

  const selected = document.createElement('span');
  selected.className = 'package-card__selected';
  selected.insertAdjacentHTML('beforeend', CHECK_ICON);
  selected.append(createTextElement('span', '', 'flow.cover.packageSelected'));

  status.append(choose, selected);
  return status;
}
