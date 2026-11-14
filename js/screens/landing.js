// Screen 1: landing. Says what the cover is, what it starts from, and offers one way in.
// Built like a product page (hero, price tag, benefits), with no form fields.

import { t, tWithElement, getLocale, createTextElement } from '../i18n.js';
import { formatMoney } from '../money.js';
import { createButton } from '../components/button.js';

// One line icon per benefit, drawn with currentColor (decorative: the text says it all).
const BENEFITS = [
  {
    id: 'delivery', // calendar
    icon: '<rect x="3.5" y="5" width="17" height="15" rx="1"/><path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 4-4"/>',
  },
  {
    id: 'charging', // plug
    icon: '<path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5"/>',
  },
  {
    id: 'battery', // battery with charge bolt
    icon: '<rect x="3" y="7" width="16" height="10" rx="1"/><path d="M21 10.5v3M12 9l-2 3h3l-2 3"/>',
  },
  {
    id: 'assistance', // map pin
    icon: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  },
];

export function render({ navigate }) {
  const screen = document.createElement('div');
  screen.className = 'landing';
  screen.append(createHero(navigate), createBenefits());
  return screen;
}

function createHero(navigate) {
  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.setAttribute('aria-labelledby', 'landing-title');

  const eyebrow = createTextElement('p', 'hero__eyebrow', 'flow.landing.eyebrow');
  const title = createTextElement('h1', 'hero__title', 'flow.landing.title');
  title.id = 'landing-title';
  const lead = createTextElement('p', 'hero__lead', 'flow.landing.lead');

  const cta = document.createElement('div');
  cta.className = 'hero__cta';
  cta.append(
    createButton({ labelKey: 'flow.landing.cta', block: true, onClick: () => navigate('vehicle') }),
    createTextElement('p', 'hero__cta-hint', 'flow.landing.ctaHint')
  );

  // Price and way in stay together: under the text on phones, on the right on desktop.
  const aside = document.createElement('div');
  aside.className = 'hero__aside';
  aside.append(createPriceTag(), cta);

  hero.append(eyebrow, title, lead, aside);
  return hero;
}

// "From €38.50 a month", with the amount set large like a BMW price tag.
// The "from" figure is marketing copy: it lives in the copy file (flow.landing.fromPrice,
// in minor units) and goes through the one money formatter.
function createPriceTag() {
  const tag = document.createElement('div');
  tag.className = 'price-tag';

  const amount = document.createElement('span');
  amount.className = 'price-tag__amount tabular';
  amount.textContent = formatMoney(t('flow.landing.fromPrice'), getLocale());

  const sentence = document.createElement('p');
  sentence.className = 'price-tag__sentence';
  sentence.append(...tWithElement('flow.landing.from', 'amount', amount));

  tag.append(sentence, createTextElement('p', 'price-tag__note', 'flow.landing.fromNote'));
  return tag;
}

function createBenefits() {
  const section = document.createElement('section');
  section.className = 'benefits';
  section.setAttribute('aria-labelledby', 'benefits-title');

  const title = createTextElement('h2', 'benefits__title', 'flow.landing.benefitsTitle');
  title.id = 'benefits-title';

  const list = document.createElement('ul');
  list.className = 'benefits__list';

  for (const benefit of BENEFITS) {
    const item = document.createElement('li');
    item.className = 'benefit';
    item.insertAdjacentHTML(
      'beforeend',
      '<svg class="icon benefit__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ' +
        'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        `${benefit.icon}</svg>`
    );
    item.append(
      createTextElement('h3', 'benefit__title', `flow.landing.benefits.${benefit.id}.title`),
      createTextElement('p', 'benefit__body', `flow.landing.benefits.${benefit.id}.body`)
    );
    list.append(item);
  }

  section.append(title, list);
  return section;
}
