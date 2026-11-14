// Screen 6: payment reference. Its only job: hand over the reference without
// the customer losing it (brief). Nothing is charged here, there is no card form.
//
// - policy number first;
// - entity, reference and amount together, large, monospace, each with Copy;
// - the amount is what the API returned in payment.amount: on monthly that is
//   the first instalment, not the year;
// - the due date, the next steps, and that cover starts only once paid.

import { t, getLocale, getLanguage, createTextElement } from '../i18n.js';
import { formatMoney, formatAmount } from '../money.js';
import { formatDate } from '../dates.js';
import { getState, resetState } from '../state.js';
import { createButton, setButtonLabel } from '../components/button.js';
import { createErrorPanel } from '../components/error-panel.js';

const COPIED_FEEDBACK_MS = 2000;

export function render({ navigate }) {
  const { contract } = getState();
  if (!contract) {
    return createMissingContract(navigate);
  }

  const locale = getLocale();
  const { payment, premium } = contract;
  const startsOn = formatDate(contract.starts_on, locale);
  const dueBy = formatDate(payment.due_by, locale);

  const screen = document.createElement('div');
  screen.className = 'screen';

  const header = document.createElement('header');
  header.className = 'screen__header';
  const lead = document.createElement('p');
  lead.className = 'screen__lead';
  lead.textContent = t('flow.payment.lead', { date: startsOn });
  header.append(createTextElement('h1', 'screen__title', 'flow.payment.title'), lead);

  // Screen readers hear "Copied" (or the failure message) here.
  const copyStatus = document.createElement('p');
  copyStatus.className = 'payment-card__status';
  copyStatus.setAttribute('role', 'status');

  screen.append(
    header,
    createPolicy(contract, locale),
    createPaymentCard(payment, premium.frequency, dueBy, locale, copyStatus),
    createNextSteps(dueBy),
    createActions(navigate)
  );
  return screen;
}

// Policy number + cover period.
function createPolicy(contract, locale) {
  const block = document.createElement('section');
  block.className = 'policy';
  block.setAttribute('aria-labelledby', 'policy-label');

  const label = createTextElement('h2', 'policy__label', 'flow.payment.policyNumberLabel');
  label.id = 'policy-label';

  const number = document.createElement('p');
  number.className = 'policy__number mono';
  number.textContent = contract.policy_number;

  const period = document.createElement('p');
  period.className = 'policy__period';
  period.textContent = t('flow.payment.coverPeriod', {
    start: formatDate(contract.starts_on, locale),
    end: formatDate(contract.ends_on, locale),
  });

  block.append(label, number, period);
  return block;
}

// The three values the customer types in, together in one card.
function createPaymentCard(payment, frequency, dueBy, locale, copyStatus) {
  const card = document.createElement('section');
  card.className = 'payment-card';
  card.setAttribute('aria-labelledby', 'payment-details-title');

  const title = createTextElement('h2', 'payment-card__title', 'flow.payment.detailsTitle');
  title.id = 'payment-details-title';

  const list = document.createElement('dl');
  list.className = 'payment-card__list';
  list.append(
    createValueRow({
      labelKey: 'flow.payment.entityLabel',
      display: payment.entity,
      copyText: payment.entity,
      copyStatus,
    }),
    createValueRow({
      labelKey: 'flow.payment.referenceLabel',
      // Grouped by three to read and type: "907 318 442". Copied without spaces.
      display: groupDigits(payment.reference),
      copyText: payment.reference,
      copyStatus,
    }),
    createValueRow({
      labelKey: 'flow.payment.amountLabel',
      display: formatMoney(payment.amount, locale),
      copyText: formatAmount(payment.amount, locale),
      hintKey: frequency === 'monthly' ? 'flow.payment.amountMonthlyHint' : 'flow.payment.amountAnnualHint',
      copyStatus,
    })
  );

  // "Pay by 1 June 2027"
  const due = document.createElement('div');
  due.className = 'payment-card__due';
  const dueDate = document.createElement('strong');
  dueDate.textContent = dueBy;
  due.append(createTextElement('span', 'payment-card__due-label', 'flow.payment.dueByLabel'), dueDate);

  // Warning-coloured note: keep these details before leaving.
  const keepSafe = document.createElement('p');
  keepSafe.className = 'notice';
  keepSafe.insertAdjacentHTML(
    'beforeend',
    '<svg class="icon notice__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 3l9.5 17h-19z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M12 10v4M12 17v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  );
  keepSafe.append(createTextElement('span', '', 'flow.payment.keepSafe'));

  card.append(title, list, due, keepSafe, copyStatus);
  return card;
}

// One row: label, big monospace value, Copy button (and an optional hint).
function createValueRow({ labelKey, display, copyText, hintKey = null, copyStatus }) {
  const row = document.createElement('div');
  row.className = 'payment-row';

  const label = createTextElement('dt', 'payment-row__label', labelKey);

  const dd = document.createElement('dd');
  dd.className = 'payment-row__body';

  const value = document.createElement('span');
  value.className = 'payment-row__value mono';
  value.textContent = display;

  // Visible text "Copy"; accessible name "Copy reference" (contains the visible word).
  const copy = createButton({ labelKey: 'flow.payment.copy', variant: 'outline', icon: 'copy', small: true });
  copy.setAttribute(
    'aria-label',
    t('flow.payment.copyLabel', { item: t(labelKey).toLocaleLowerCase(getLanguage()) })
  );
  copy.addEventListener('click', () => copyValue(copy, copyText, copyStatus));

  // Order: value, hint, Copy. Phones stack them; tablet up puts Copy beside the value (CSS).
  dd.append(value);
  if (hintKey) {
    dd.append(createTextElement('span', 'payment-row__hint', hintKey));
  }
  dd.append(copy);

  row.append(label, dd);
  return row;
}

// Copies to the clipboard. Success: "Copied" on the button for 2 seconds.
// Failure (old browser, permission refused): a sentence asking to write it down.
async function copyValue(button, text, status) {
  try {
    await navigator.clipboard.writeText(text);
    setButtonLabel(button, 'flow.payment.copied');
    status.textContent = t('flow.payment.copied');
    setTimeout(() => {
      setButtonLabel(button, 'flow.payment.copy');
      status.textContent = '';
    }, COPIED_FEEDBACK_MS);
  } catch (error) {
    console.error('[payment] clipboard', error);
    status.textContent = t('flow.payment.copyFailed');
  }
}

function createNextSteps(dueBy) {
  const section = document.createElement('section');
  section.className = 'next-steps';
  section.setAttribute('aria-labelledby', 'next-steps-title');

  const title = createTextElement('h2', 'next-steps__title', 'flow.payment.nextTitle');
  title.id = 'next-steps-title';

  const list = document.createElement('ol');
  list.className = 'next-steps__list';
  for (const key of ['nextStep1', 'nextStep2', 'nextStep3', 'nextStep4']) {
    const item = document.createElement('li');
    item.textContent = t(`flow.payment.${key}`, { date: dueBy });
    list.append(item);
  }

  section.append(title, list);
  return section;
}

function createActions(navigate) {
  const actions = document.createElement('div');
  actions.className = 'payment-actions';
  actions.append(
    createButton({ labelKey: 'flow.payment.print', variant: 'secondary', block: true, onClick: () => window.print() }),
    createButton({
      labelKey: 'flow.payment.newQuote',
      variant: 'ghost',
      onClick: () => {
        resetState();
        navigate('');
      },
    })
  );
  return actions;
}

// "907318442" -> "907 318 442"
function groupDigits(digits) {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
}

function createMissingContract(navigate) {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.append(
    createErrorPanel({
      code: 'quote_not_found',
      headingLevel: 1,
      onAction: () => {
        resetState();
        navigate('');
      },
    })
  );
  return screen;
}
