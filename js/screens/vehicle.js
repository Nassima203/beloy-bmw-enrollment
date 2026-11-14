// Screen 2: vehicle. The model and price arrive with the order (prefilled in state.js);
// the customer confirms or corrects the model and gives the delivery date.

import { getLocale, createTextElement } from '../i18n.js';
import { formatMoney } from '../money.js';
import { getState, updateState } from '../state.js';
import { todayIso, daysFromTodayIso } from '../dates.js';
import { createButton } from '../components/button.js';
import {
  createSelectField,
  createInputField,
  validateOnChange,
  validateFields,
  focusField,
  dateEntryError,
} from '../components/field.js';

// The six model codes the API accepts (docs/api.pdf, vehicle.model_code).
const MODEL_CODES = ['i4', 'i5', 'i7', 'iX1', 'iX2', 'iX3'];

export function render({ navigate }) {
  const { vehicle } = getState();

  const screen = document.createElement('div');
  screen.className = 'screen';

  const header = document.createElement('header');
  header.className = 'screen__header';
  header.append(
    createTextElement('h1', 'screen__title', 'flow.vehicle.title'),
    createTextElement('p', 'screen__lead', 'flow.vehicle.lead')
  );

  const model = createSelectField({
    name: 'model_code',
    labelKey: 'flow.vehicle.modelLabel',
    value: vehicle.model_code,
    options: MODEL_CODES.map((code) => ({ value: code, labelKey: `flow.vehicle.models.${code}` })),
  });

  const deliveryDate = createInputField({
    name: 'delivery_date',
    type: 'date',
    labelKey: 'flow.vehicle.deliveryDateLabel',
    hintKey: 'flow.vehicle.deliveryDateHint',
    value: vehicle.delivery_date,
    // The date picker starts at tomorrow; the check below still enforces it for typed dates.
    attributes: { min: daysFromTodayIso(1) },
  });

  function checkDeliveryDate() {
    const value = deliveryDate.input.value;
    return dateEntryError(deliveryDate.input) ?? (value <= todayIso() ? 'flow.validation.deliveryNotFuture' : null);
  }
  validateOnChange(deliveryDate, checkDeliveryDate);

  // Form: the order card (what arrived with the order), then the date, then Continue.
  const form = document.createElement('form');
  form.className = 'form';
  form.noValidate = true; // our inline messages replace the browser's bubbles
  form.append(
    createOrderCard(model, vehicle.list_price),
    deliveryDate.element,
    createActions()
  );

  // Answers are saved as they change, so a language switch (which re-renders
  // the screen) or Back/Continue never loses them.
  form.addEventListener('change', () => {
    updateState('vehicle', { model_code: model.select.value, delivery_date: deliveryDate.input.value });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstInvalid = validateFields([{ field: deliveryDate, check: checkDeliveryDate }]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    updateState('vehicle', { model_code: model.select.value, delivery_date: deliveryDate.input.value });
    navigate('driver');
  });

  screen.append(header, form);
  return screen;
}

// Grey card tagged "From your order": the model (editable) and the configured price (read-only).
function createOrderCard(model, listPrice) {
  const card = document.createElement('div');
  card.className = 'order-card';

  const price = document.createElement('dl');
  price.className = 'readout';
  const priceValue = document.createElement('dd');
  priceValue.className = 'readout__value tabular';
  priceValue.textContent = formatMoney(listPrice, getLocale());
  price.append(createTextElement('dt', 'readout__label', 'flow.vehicle.listPriceLabel'), priceValue);

  card.append(createTextElement('p', 'order-card__tag', 'flow.vehicle.fromOrder'), model.element, price);
  return card;
}

function createActions() {
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.append(createButton({ labelKey: 'flow.common.continue', type: 'submit', block: true }));
  return actions;
}
