// Screen 3: driver. The seven questions from the brief, checked inline,
// then POST /v1/quotes. Success -> cover screen. Failure -> error panel
// with a plain message and a way forward (house rule 6).
//
// Eligibility (licence under 2 years, 3+ claims) is the insurer's decision:
// it is not checked here, the API answers driver_ineligible.

import { createTextElement } from '../i18n.js';
import { getState, updateState, setState } from '../state.js';
import { createQuote } from '../api.js';
import { todayIso, yearsAgoIso } from '../dates.js';
import { createButton, setButtonLoading } from '../components/button.js';
import {
  createInputField,
  createRadioGroup,
  validateOnChange,
  validateFields,
  focusField,
  dateEntryError,
  checkedValue,
} from '../components/field.js';
import { createErrorPanel, focusErrorPanel, errorCodeOf, logError } from '../components/error-panel.js';

const MINIMUM_AGE = 18;

// Errors where trying the same answers again can work. For the others, the answers must change.
const RETRYABLE_CODES = ['internal_error', 'network', 'unknown'];

export function render({ navigate }) {
  const { driver } = getState();

  const screen = document.createElement('div');
  screen.className = 'screen';

  const header = document.createElement('header');
  header.className = 'screen__header';
  header.append(
    createTextElement('h1', 'screen__title', 'flow.driver.title'),
    createTextElement('p', 'screen__lead', 'flow.driver.lead')
  );

  // Where the error panel appears if the quote fails. Empty (and hidden) otherwise.
  const alertSlot = document.createElement('div');
  alertSlot.className = 'screen__alert';
  alertSlot.hidden = true;

  // --- Fields, in the brief's order -----------------------------------------

  const birthDate = createInputField({
    name: 'birth_date',
    type: 'date',
    labelKey: 'flow.driver.birthDateLabel',
    hintKey: 'flow.driver.birthDateHint',
    value: driver.birth_date,
    autocomplete: 'bday',
    attributes: { max: todayIso() },
  });

  const licenceSince = createInputField({
    name: 'licence_since',
    type: 'date',
    labelKey: 'flow.driver.licenceSinceLabel',
    hintKey: 'flow.driver.licenceSinceHint',
    value: driver.licence_since,
    attributes: { max: todayIso() },
  });

  // type="text" + inputmode="numeric": a digit keypad on phones, without the
  // quirks of type="number" (scroll wheel changes, "e" accepted, no spaces).
  const claims = createInputField({
    name: 'claims_3y',
    labelKey: 'flow.driver.claimsLabel',
    hintKey: 'flow.driver.claimsHint',
    value: driver.claims_3y === null ? '' : String(driver.claims_3y),
    inputMode: 'numeric',
    attributes: { maxlength: '2' },
  });

  const annualKm = createInputField({
    name: 'annual_km',
    labelKey: 'flow.driver.annualKmLabel',
    hintKey: 'flow.driver.annualKmHint',
    value: driver.annual_km === null ? '' : String(driver.annual_km),
    inputMode: 'numeric',
    suffixKey: 'flow.driver.annualKmUnit',
    attributes: { maxlength: '7' },
  });

  const postcode = createInputField({
    name: 'postcode',
    labelKey: 'flow.driver.postcodeLabel',
    hintKey: 'flow.driver.postcodeHint',
    value: driver.postcode,
    inputMode: 'numeric',
    autocomplete: 'postal-code',
    attributes: { maxlength: '5' },
  });

  const parking = createRadioGroup({
    name: 'parking',
    legendKey: 'flow.driver.parkingLabel',
    value: driver.parking,
    layout: 'inline',
    options: ['garage', 'driveway', 'street'].map((value) => ({
      value,
      labelKey: `flow.driver.parking.${value}`,
    })),
  });

  const charging = createRadioGroup({
    name: 'charging',
    legendKey: 'flow.driver.chargingLabel',
    value: driver.charging,
    layout: 'inline',
    options: ['home', 'work', 'public'].map((value) => ({
      value,
      labelKey: `flow.driver.charging.${value}`,
    })),
  });

  // --- Checks: each returns an i18n error key, or null ----------------------

  function checkBirthDate() {
    const value = birthDate.input.value;
    if (dateEntryError(birthDate.input)) return dateEntryError(birthDate.input);
    if (value > todayIso()) return 'flow.validation.dateInFuture';
    if (value > yearsAgoIso(MINIMUM_AGE)) return 'flow.validation.tooYoung';
    return null;
  }

  function checkLicenceSince() {
    const value = licenceSince.input.value;
    if (dateEntryError(licenceSince.input)) return dateEntryError(licenceSince.input);
    if (value > todayIso()) return 'flow.validation.dateInFuture';
    // Only compared once the birth date itself is valid.
    if (!checkBirthDate() && value <= birthDate.input.value) return 'flow.validation.licenceBeforeBirth';
    return null;
  }

  function checkClaims() {
    if (claims.input.value.trim() === '') return 'flow.validation.required';
    return parseWholeNumber(claims.input.value) === null ? 'flow.validation.claimsInvalid' : null;
  }

  function checkAnnualKm() {
    if (annualKm.input.value.trim() === '') return 'flow.validation.required';
    return parseWholeNumber(annualKm.input.value) === null ? 'flow.validation.kmInvalid' : null;
  }

  function checkPostcode() {
    const value = postcode.input.value.trim();
    if (value === '') return 'flow.validation.required';
    return /^\d{5}$/.test(value) ? null : 'flow.validation.postcodeInvalid';
  }

  function checkParking() {
    return checkedValue(parking.inputs) ? null : 'flow.validation.chooseOne';
  }

  function checkCharging() {
    return checkedValue(charging.inputs) ? null : 'flow.validation.chooseOne';
  }

  const checks = [
    { field: birthDate, check: checkBirthDate },
    { field: licenceSince, check: checkLicenceSince },
    { field: claims, check: checkClaims },
    { field: annualKm, check: checkAnnualKm },
    { field: postcode, check: checkPostcode },
    { field: parking, check: checkParking },
    { field: charging, check: checkCharging },
  ];
  for (const { field, check } of checks) {
    validateOnChange(field, check);
  }

  // --- Form -----------------------------------------------------------------

  const submit = createButton({ labelKey: 'flow.driver.submit', type: 'submit', block: true });
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.append(submit);

  const form = document.createElement('form');
  form.className = 'form';
  form.noValidate = true;
  form.append(
    birthDate.element,
    licenceSince.element,
    claims.element,
    annualKm.element,
    postcode.element,
    parking.element,
    charging.element,
    actions
  );

  // The answers in the API's shape (numbers as integers, or null if not valid yet).
  function readForm() {
    return {
      birth_date: birthDate.input.value,
      licence_since: licenceSince.input.value,
      claims_3y: parseWholeNumber(claims.input.value),
      annual_km: parseWholeNumber(annualKm.input.value),
      postcode: postcode.input.value.trim(),
      parking: checkedValue(parking.inputs),
      charging: checkedValue(charging.inputs),
    };
  }

  // Saved as they change, so a language switch or Back never loses them.
  form.addEventListener('change', () => updateState('driver', readForm()));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAlert();

    const firstInvalid = validateFields(checks);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    const answers = readForm();
    updateState('driver', answers);

    // While the quote is priced: spinner + "Working out your price…", clicks ignored.
    setButtonLoading(submit, true, 'flow.driver.submitLoading');
    try {
      const quote = await createQuote({ vehicle: getState().vehicle, driver: answers });
      setState('quote', quote);
      // A new quote means new prices: the cover screen opens with nothing selected.
      updateState('selection', { packageId: null, options: [] });
      navigate('cover');
    } catch (error) {
      logError(error, 'createQuote');
      showAlert(errorCodeOf(error));
    } finally {
      setButtonLoading(submit, false);
    }
  });

  // --- Error panel ----------------------------------------------------------

  function showAlert(code) {
    const onAction = RETRYABLE_CODES.includes(code)
      ? () => retry() // "Try again": same answers, new call
      : () => editAnswers(code); // "Edit my answers" / "Check my answers"

    const panel = createErrorPanel({ code, onAction });
    alertSlot.replaceChildren(panel);
    alertSlot.hidden = false;
    focusErrorPanel(panel);
  }

  function hideAlert() {
    alertSlot.hidden = true;
    alertSlot.replaceChildren();
  }

  // The panel (which has focus) disappears on submit, so focus moves first to
  // the submit button, where the loading state is shown.
  function retry() {
    submit.focus();
    form.requestSubmit();
  }

  // driver_ineligible is about the licence date or the claims: start at the licence.
  function editAnswers(code) {
    hideAlert();
    focusField(code === 'driver_ineligible' ? licenceSince : birthDate);
  }

  // The panel goes after the form, right below the button the customer pressed:
  // nothing above it moves when it appears or disappears.
  screen.append(header, form, alertSlot);
  return screen;
}

// "12 000" -> 12000, "3" -> 3, "" / "12.5" / "abc" -> null.
// Spaces are allowed because French writes thousands as "12 000".
function parseWholeNumber(text) {
  const compact = text.replace(/\s/g, '');
  return /^\d+$/.test(compact) ? Number(compact) : null;
}
