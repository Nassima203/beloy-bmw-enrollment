// Screen 5: review. Answers read back (each section with a Change link),
// contact details, the documents to read, the three consents (unticked),
// then POST /v1/contracts. Success -> payment screen.

import { t, tWithElement, getLocale, getLanguage, createTextElement } from '../i18n.js';
import { formatMoney } from '../money.js';
import { formatDate } from '../dates.js';
import { getState, updateState, setState } from '../state.js';
import { createContract, createQuote } from '../api.js';
import { findPackage, selectionTotal, keepSelectableOptions, priceKey } from '../pricing.js';
import { createButton, setButtonLoading } from '../components/button.js';
import {
  createInputField,
  createCheckboxField,
  validateOnChange,
  validateFields,
  focusField,
} from '../components/field.js';
import { createErrorPanel, focusErrorPanel, errorCodeOf, logError } from '../components/error-panel.js';

// Invented document names (brief: "the links do not need to go anywhere").
const DOCUMENTS = ['ipid', 'preContractual', 'generalConditions', 'assistance', 'privacy'];

// API consent field -> copy key.
const CONSENTS = [
  { field: 'pre_contractual_information', key: 'preContractual' },
  { field: 'general_conditions', key: 'generalConditions' },
  { field: 'data_processing', key: 'dataProcessing' },
];

const RETRYABLE_CODES = ['internal_error', 'network', 'unknown'];

export function render({ navigate }) {
  const { quote, selection, holder, consents } = getState();
  const pkg = quote ? findPackage(quote, selection.packageId) : null;

  // Reached without a quote or a package (typed URL, reload).
  if (!pkg) {
    return createMissingSelection(navigate, quote ? 'cover' : 'driver');
  }

  const screen = document.createElement('div');
  screen.className = 'screen';

  const header = document.createElement('header');
  header.className = 'screen__header';
  header.append(
    createTextElement('h1', 'screen__title', 'flow.review.title'),
    createTextElement('p', 'screen__lead', 'flow.review.lead')
  );

  const alertSlot = document.createElement('div');
  alertSlot.className = 'screen__alert';
  alertSlot.hidden = true;

  // --- Contact details ------------------------------------------------------

  const firstName = createInputField({
    name: 'first_name',
    labelKey: 'flow.review.firstNameLabel',
    value: holder.first_name,
    autocomplete: 'given-name',
  });
  const lastName = createInputField({
    name: 'last_name',
    labelKey: 'flow.review.lastNameLabel',
    value: holder.last_name,
    autocomplete: 'family-name',
  });
  const email = createInputField({
    name: 'email',
    type: 'email',
    labelKey: 'flow.review.emailLabel',
    hintKey: 'flow.review.emailHint',
    value: holder.email,
    autocomplete: 'email',
  });
  const phone = createInputField({
    name: 'phone',
    type: 'tel',
    labelKey: 'flow.review.phoneLabel',
    hintKey: 'flow.review.phoneHint',
    value: holder.phone,
    autocomplete: 'tel',
  });

  const required = (field) => () => (field.input.value.trim() === '' ? 'flow.validation.required' : null);

  function checkEmail() {
    const value = email.input.value.trim();
    if (value === '') return 'flow.validation.required';
    // Deliberately loose: something@something.something. The insurer confirms by email anyway.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'flow.validation.emailInvalid';
  }

  function checkPhone() {
    if (phone.input.value.trim() === '') return 'flow.validation.required';
    return normalisePhone(phone.input.value) ? null : 'flow.validation.phoneInvalid';
  }

  // --- Consents (unticked until the customer ticks them) --------------------

  const consentFields = CONSENTS.map(({ field, key }) => ({
    field,
    control: createCheckboxField({
      name: field,
      labelKey: `flow.review.consents.${key}`,
      checked: consents[field],
    }),
  }));

  const checks = [
    { field: firstName, check: required(firstName) },
    { field: lastName, check: required(lastName) },
    { field: email, check: checkEmail },
    { field: phone, check: checkPhone },
    ...consentFields.map(({ control }) => ({
      field: control,
      check: () => (control.input.checked ? null : 'flow.validation.consentRequired'),
    })),
  ];
  for (const { field, check } of checks) {
    validateOnChange(field, check);
  }

  // --- Form -----------------------------------------------------------------

  const submit = createButton({ labelKey: 'flow.review.submit', type: 'submit', block: true });
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.append(createTextElement('p', 'form-actions__note', 'flow.review.reassurance'), submit);

  const holderSection = createSection('flow.review.holderTitle');
  holderSection.append(firstName.element, lastName.element, email.element, phone.element);

  const consentsSection = createSection('flow.review.consentsTitle');
  consentsSection.id = 'review-consents';
  consentsSection.append(...consentFields.map(({ control }) => control.element));

  const form = document.createElement('form');
  form.className = 'form form--sections';
  form.noValidate = true;
  form.append(holderSection, createDocuments(), consentsSection, actions);

  function readHolder() {
    return {
      first_name: firstName.input.value.trim(),
      last_name: lastName.input.value.trim(),
      email: email.input.value.trim(),
      phone: phone.input.value.trim(),
    };
  }

  function readConsents() {
    const values = {};
    for (const { field, control } of consentFields) {
      values[field] = control.input.checked;
    }
    return values;
  }

  // Saved as they change, so a language switch or a Change link never loses them.
  form.addEventListener('change', () => {
    updateState('holder', readHolder());
    updateState('consents', readConsents());
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAlert();

    const firstInvalid = validateFields(checks);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    updateState('holder', readHolder());
    updateState('consents', readConsents());
    const state = getState();

    setButtonLoading(submit, true, 'flow.review.submitLoading');
    try {
      const contract = await createContract({
        quoteId: state.quote.quote_id,
        packageId: pkg.id,
        // Never send an add-on the package already includes (docs/api.pdf).
        // The cover screen never stores one, and this filter makes the rule explicit.
        options: keepSelectableOptions(pkg, state.selection.options),
        frequency: state.selection.frequency,
        // The API gets the phone in international format: "06 12 34 56 78" -> "+33612345678".
        holder: { ...state.holder, phone: normalisePhone(state.holder.phone) },
        consents: state.consents,
      });
      setState('contract', contract);
      navigate('payment');
    } catch (error) {
      logError(error, 'createContract');
      showAlert(errorCodeOf(error));
    } finally {
      setButtonLoading(submit, false);
    }
  });

  // --- Error panel ----------------------------------------------------------

  function showAlert(code) {
    const panel = createErrorPanel({ code, onAction: () => handleAction(code, panel) });
    alertSlot.replaceChildren(panel);
    alertSlot.hidden = false;
    focusErrorPanel(panel);
  }

  function hideAlert() {
    alertSlot.hidden = true;
    alertSlot.replaceChildren();
  }

  function handleAction(code, panel) {
    if (RETRYABLE_CODES.includes(code)) {
      form.requestSubmit(); // "Try again"
    } else if (code === 'consent_required') {
      hideAlert(); // "Go to the agreements": first unticked box
      const unticked = consentFields.find(({ control }) => !control.input.checked) ?? consentFields[0];
      focusField(unticked.control);
    } else if (code === 'quote_expired') {
      refreshQuote(panel.querySelector('button')); // "Get an updated price"
    } else if (code === 'invalid_request') {
      hideAlert(); // "Check my answers"
      focusField(firstName);
    } else {
      navigate('driver'); // quote_not_found / driver_ineligible: new quote from the driver answers
    }
  }

  // quote_expired: price again with the answers already given, then back to the
  // cover screen so the customer sees (and confirms) the updated prices.
  async function refreshQuote(button) {
    setButtonLoading(button, true);
    try {
      const { vehicle, driver } = getState();
      setState('quote', await createQuote({ vehicle, driver }));
      navigate('cover');
    } catch (error) {
      logError(error, 'createQuote (refresh)');
      showAlert(errorCodeOf(error));
    }
  }

  screen.append(header, createSummary(pkg), alertSlot, form);
  return screen;
}

// ---------------------------------------------------------------------------
// Answers read back
// ---------------------------------------------------------------------------

function createSummary(pkg) {
  const { vehicle, driver, selection } = getState();
  const locale = getLocale();

  const extras = selection.options.map((code) => t(`flow.addons.${code}.name`));
  const total = document.createElement('span');
  total.className = 'tabular';
  total.textContent = formatMoney(selectionTotal(pkg, selection.options, selection.frequency), locale);

  const summary = document.createElement('div');
  summary.className = 'summary';
  summary.append(
    createSummaryCard('flow.review.vehicleTitle', 'vehicle', [
      ['flow.vehicle.modelLabel', t(`flow.vehicle.models.${vehicle.model_code}`)],
      ['flow.vehicle.listPriceLabel', formatMoney(vehicle.list_price, locale)],
      ['flow.vehicle.deliveryDateLabel', formatDate(vehicle.delivery_date, locale)],
    ]),
    createSummaryCard('flow.review.driverTitle', 'driver', [
      ['flow.driver.birthDateLabel', formatDate(driver.birth_date, locale)],
      ['flow.driver.licenceSinceLabel', formatDate(driver.licence_since, locale)],
      ['flow.driver.claimsLabel', String(driver.claims_3y)],
      [
        'flow.driver.annualKmLabel',
        `${new Intl.NumberFormat(locale).format(driver.annual_km)} ${t('flow.driver.annualKmUnit')}`,
      ],
      ['flow.driver.postcodeLabel', driver.postcode],
      ['flow.driver.parkingLabel', t(`flow.driver.parking.${driver.parking}`)],
      ['flow.driver.chargingLabel', t(`flow.driver.charging.${driver.charging}`)],
    ]),
    createSummaryCard('flow.review.coverTitle', 'cover', [
      ['flow.review.packageLabel', t(`flow.packages.${pkg.id}.name`)],
      [
        'flow.review.addonsLabel',
        // "Home wallbox, Battery health and Glass cover" / "… et …"
        extras.length > 0
          ? new Intl.ListFormat(locale, { type: 'conjunction' }).format(extras)
          : t('flow.review.addonsNone'),
      ],
      [
        'flow.review.frequencyLabel',
        t(selection.frequency === 'annual' ? 'flow.common.frequencyAnnual' : 'flow.common.frequencyMonthly'),
      ],
      ['flow.review.startsOnLabel', formatDate(vehicle.delivery_date, locale)],
      ['flow.review.totalLabel', tWithElement(priceKey(selection.frequency), 'amount', total)],
    ])
  );
  return summary;
}

// rows: [labelKey, value] where value is a string or an array for append().
function createSummaryCard(titleKey, path, rows) {
  const card = document.createElement('section');
  card.className = 'summary-card';

  const head = document.createElement('div');
  head.className = 'summary-card__head';

  // "Change" on screen; "Change your car" for screen readers, who may list links out of context.
  const change = createTextElement('a', 'summary-card__change', 'flow.common.change');
  change.href = `#/${path}`;
  change.setAttribute(
    'aria-label',
    t('flow.review.changeSection', { section: t(titleKey).toLocaleLowerCase(getLanguage()) })
  );
  head.append(createTextElement('h2', 'summary-card__title', titleKey), change);

  const list = document.createElement('dl');
  list.className = 'summary-list';
  for (const [labelKey, value] of rows) {
    const row = document.createElement('div');
    row.className = 'summary-list__row';
    const dd = document.createElement('dd');
    dd.className = 'summary-list__value';
    dd.append(...(Array.isArray(value) ? value : [value]));
    row.append(createTextElement('dt', 'summary-list__label', labelKey), dd);
    list.append(row);
  }

  card.append(head, list);
  return card;
}

// ---------------------------------------------------------------------------
// Form sections
// ---------------------------------------------------------------------------

function createSection(titleKey) {
  const section = document.createElement('section');
  section.className = 'form-section';
  section.append(createTextElement('h2', 'form-section__title', titleKey));
  return section;
}

function createDocuments() {
  const section = createSection('flow.review.documentsTitle');
  section.append(createTextElement('p', 'form-section__lead', 'flow.review.documentsLead'));

  const list = document.createElement('ul');
  list.className = 'document-list';
  for (const id of DOCUMENTS) {
    const link = document.createElement('a');
    link.className = 'document-link';
    // Placeholder links: a real href would be the PDF. "#" alone would send the
    // router to the landing, so the click is cancelled.
    link.href = '#';
    link.addEventListener('click', (event) => event.preventDefault());
    link.insertAdjacentHTML(
      'beforeend',
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
        'stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">' +
        '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>'
    );
    link.append(
      createTextElement('span', 'document-link__name', `flow.review.documents.${id}`),
      createTextElement('span', 'document-link__format', 'flow.review.documentFormat')
    );
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  section.append(list);
  return section;
}

function createMissingSelection(navigate, path) {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.append(
    createErrorPanel({
      code: path === 'cover' ? 'invalid_request' : 'quote_not_found',
      headingLevel: 1,
      onAction: () => navigate(path),
    })
  );
  return screen;
}

// French phone number -> "+33XXXXXXXXX", or null if it is not one.
// Accepts "06 12 34 56 78", "06.12.34.56.78", "+33 6 12 34 56 78".
function normalisePhone(text) {
  const compact = text.replace(/[\s.\-()]/g, '');
  const match = compact.match(/^(?:\+33|0033|0)([1-9]\d{8})$/);
  return match ? `+33${match[1]}` : null;
}
