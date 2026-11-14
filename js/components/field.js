// Form fields: a text-like input, a select, and a radio group.
// Each one comes with its label, an optional hint and a (hidden) error message,
// all wired together with for/id and aria-describedby.
//
// Every create function returns { element, … }: `element` goes into the page,
// the other properties give the screen direct access to the controls.

import { t, createTextElement as textElement } from '../i18n.js';

const ERROR_ICON =
  '<svg class="icon icon--small" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
  '<path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
  '</svg>';

// Unique ids, so two fields with the same name never clash.
let idCounter = 0;
function nextId(name) {
  idCounter += 1;
  return `field-${name}-${idCounter}`;
}

// Label (or legend) text, with "(Optional)" after it when asked.
function labelElement(tag, labelKey, optional) {
  const label = textElement(tag, 'field__label', labelKey);
  if (optional) {
    label.append(' ', textElement('span', 'field__optional', 'flow.common.optional'));
  }
  return label;
}

// Builds the parts every field shares. `describes` is the element that gets
// aria-describedby: the input/select itself, or the fieldset for a radio group.
function buildShell({ tag, id, labelKey, hintKey, optional }) {
  const element = document.createElement(tag);
  element.className = 'field';
  element.dataset.fieldId = id;

  const label = labelElement(tag === 'fieldset' ? 'legend' : 'label', labelKey, optional);
  if (tag !== 'fieldset') {
    label.htmlFor = id;
  }
  element.append(label);

  if (hintKey) {
    const hint = textElement('p', 'field__hint', hintKey);
    hint.id = `${id}-hint`;
    element.append(hint);
  }

  return element;
}

function buildError(id) {
  const error = document.createElement('p');
  error.className = 'field__error';
  error.id = `${id}-error`;
  error.hidden = true;
  error.insertAdjacentHTML('beforeend', ERROR_ICON);

  const text = document.createElement('span');
  text.className = 'field__error-text';
  error.append(text);
  return error;
}

// Text, date, email, tel…
// createInputField({ name: 'postcode', labelKey: 'flow.driver.postcodeLabel', inputMode: 'numeric' })
// suffixKey: a unit shown inside the field, on the right (e.g. "km").
// attributes: any extra HTML attributes, e.g. { min: '2026-11-15', maxlength: '5' }.
export function createInputField({
  name,
  labelKey,
  hintKey = null,
  type = 'text',
  value = '',
  inputMode = null,
  autocomplete = null,
  optional = false,
  suffixKey = null,
  attributes = {},
}) {
  const id = nextId(name);
  const element = buildShell({ tag: 'div', id, labelKey, hintKey, optional });

  const input = document.createElement('input');
  input.className = 'field__input field__control';
  input.id = id;
  input.name = name;
  input.type = type;
  input.value = value ?? '';
  input.required = !optional;
  if (inputMode) input.inputMode = inputMode;
  if (autocomplete) input.autocomplete = autocomplete;
  for (const [attribute, attributeValue] of Object.entries(attributes)) {
    input.setAttribute(attribute, attributeValue);
  }

  if (suffixKey) {
    // The label already names the unit ("Kilometres…"), so the suffix is visual only.
    const wrap = document.createElement('div');
    wrap.className = 'field__input-wrap';
    const suffix = textElement('span', 'field__suffix', suffixKey);
    suffix.setAttribute('aria-hidden', 'true');
    wrap.append(input, suffix);
    element.append(wrap);
  } else {
    element.append(input);
  }

  element.append(buildError(id));
  updateDescribedBy(element, false);
  return { element, input };
}

// options: [{ value: 'i4', labelKey: 'flow.vehicle.models.i4' }, …]
export function createSelectField({ name, labelKey, hintKey = null, value = '', options }) {
  const id = nextId(name);
  const element = buildShell({ tag: 'div', id, labelKey, hintKey, optional: false });

  const select = document.createElement('select');
  select.className = 'field__input field__control';
  select.id = id;
  select.name = name;
  select.required = true;

  for (const option of options) {
    const node = textElement('option', '', option.labelKey);
    node.value = option.value;
    node.selected = option.value === value;
    select.append(node);
  }

  // The wrapper draws the chevron (see components.css).
  const wrap = document.createElement('div');
  wrap.className = 'field__select-wrap';
  wrap.append(select);

  element.append(wrap, buildError(id));
  updateDescribedBy(element, false);
  return { element, select };
}

// A question with a few answers, as a <fieldset> of radio cards.
// inline: true puts the options side by side from tablet up.
export function createRadioGroup({ name, legendKey, hintKey = null, value = '', options, inline = false }) {
  const id = nextId(name);
  const element = buildShell({ tag: 'fieldset', id, labelKey: legendKey, hintKey, optional: false });

  const list = document.createElement('div');
  list.className = inline ? 'field__options field__options--inline' : 'field__options';

  const inputs = options.map((option) => {
    const label = document.createElement('label');
    label.className = 'choice';

    const input = document.createElement('input');
    input.className = 'choice__input';
    input.type = 'radio';
    input.name = name;
    input.value = option.value;
    input.checked = option.value === value;
    input.required = true;

    label.append(input, textElement('span', 'choice__label', option.labelKey));
    list.append(label);
    return input;
  });

  element.append(list, buildError(id));
  updateDescribedBy(element, false);
  return { element, inputs };
}

// Shows (messageKey) or clears (null) the error under a field.
// setFieldError(postcode.element, 'flow.validation.postcodeInvalid')
export function setFieldError(element, messageKey) {
  const error = element.querySelector('.field__error');
  const text = error.querySelector('.field__error-text');
  const hasError = Boolean(messageKey);

  if (hasError) {
    text.dataset.i18n = messageKey;
    text.textContent = t(messageKey);
  } else {
    delete text.dataset.i18n;
    text.textContent = '';
  }
  error.hidden = !hasError;

  element.querySelectorAll('input, select').forEach((control) => {
    if (hasError) {
      control.setAttribute('aria-invalid', 'true');
    } else {
      control.removeAttribute('aria-invalid');
    }
  });

  updateDescribedBy(element, hasError);
}

// ---------------------------------------------------------------------------
// Validation helpers. A "check" is a function that returns an i18n error key,
// or null when the answer is fine.
// ---------------------------------------------------------------------------

// Inline validation: a field is checked when the customer leaves it after a
// change (not while they type, and not when they just tab through an empty field).
// Once it shows an error, it is re-checked on every keystroke so the error
// disappears as soon as the answer is fixed.
export function validateOnChange(field, check) {
  field.element.addEventListener('change', () => {
    setFieldError(field.element, check());
  });
  field.element.addEventListener('input', () => {
    const error = field.element.querySelector('.field__error');
    if (!error.hidden) {
      setFieldError(field.element, check());
    }
  });
}

// On submit: runs every check, shows or clears each error,
// and returns the first field in error (null if the form is valid).
// validateFields([{ field: postcode, check: checkPostcode }, …])
export function validateFields(entries) {
  let firstInvalid = null;
  for (const { field, check } of entries) {
    const errorKey = check();
    setFieldError(field.element, errorKey);
    if (errorKey && !firstInvalid) {
      firstInvalid = field;
    }
  }
  return firstInvalid;
}

// Puts the cursor in a field (for a radio group: the chosen option, or the first).
export function focusField(field) {
  if (field.input) {
    field.input.focus();
  } else if (field.select) {
    field.select.focus();
  } else {
    const checked = field.inputs.find((input) => input.checked);
    (checked ?? field.inputs[0]).focus();
  }
}

// Shared first step for every date check. An empty value means either
// "nothing typed" or "only part of the date typed" (the browser reports
// that as badInput), and they get different messages.
export function dateEntryError(input) {
  if (input.value !== '') {
    return null;
  }
  return input.validity.badInput ? 'flow.validation.dateInvalid' : 'flow.validation.required';
}

// The value of the ticked radio, or '' if none.
export function checkedValue(inputs) {
  const checked = inputs.find((input) => input.checked);
  return checked ? checked.value : '';
}

// The error id is only listed while the error shows: screen readers would
// otherwise read a hidden message too.
function updateDescribedBy(element, hasError) {
  const id = element.dataset.fieldId;
  const ids = [];
  if (element.querySelector('.field__hint')) ids.push(`${id}-hint`);
  if (hasError) ids.push(`${id}-error`);

  const target = element.matches('fieldset') ? element : element.querySelector('.field__control');
  if (ids.length > 0) {
    target.setAttribute('aria-describedby', ids.join(' '));
  } else {
    target.removeAttribute('aria-describedby');
  }
}
