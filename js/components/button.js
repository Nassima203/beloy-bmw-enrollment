// Button: primary (blue), secondary (black) or ghost (text + icon, used for Back).
//
// Unavailable buttons use aria-disabled="true" rather than the disabled attribute:
// they stay focusable, so keyboard and screen reader users can still find them
// and hear the hint that explains why (e.g. "Choose a package to continue").
// A click on an unavailable button does nothing, and does not submit its form.

import { t } from '../i18n.js';

// Inline icons, drawn with currentColor so they follow the button text colour.
const ICONS = {
  'arrow-left':
    '<svg class="icon icon--small" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>',
  copy:
    '<svg class="icon icon--small" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="8" y="8" width="12" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '</svg>',
};

// createButton({ labelKey: 'flow.common.continue', onClick: () => … })
// variant: 'primary' | 'secondary' | 'outline' | 'ghost'
// type: 'button' | 'submit'
// block: true makes it full width on phones (natural width from tablet up)
// small: true for a compact button next to a value (still a 44px touch target)
export function createButton({
  labelKey,
  variant = 'primary',
  type = 'button',
  icon = null,
  block = false,
  small = false,
  onClick = null,
}) {
  const button = document.createElement('button');
  button.type = type;
  button.className = `button button--${variant}`;
  if (block) {
    button.classList.add('button--block');
  }
  if (small) {
    button.classList.add('button--small');
  }

  if (icon) {
    button.insertAdjacentHTML('beforeend', ICONS[icon]);
  }

  // Shown only while loading (CSS), so the button keeps its layout.
  const spinner = document.createElement('span');
  spinner.className = 'spinner button__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  // data-i18n lets translateDom() update the label when the language changes.
  const label = document.createElement('span');
  label.className = 'button__label';
  label.dataset.i18n = labelKey;
  label.textContent = t(labelKey);

  button.append(spinner, label);

  // Registered first, so it runs before any listener a screen adds later.
  button.addEventListener('click', (event) => {
    if (isButtonUnavailable(button)) {
      event.preventDefault(); // also stops a submit button from submitting its form
      event.stopImmediatePropagation();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  });

  return button;
}

// Changes the visible label, e.g. "Copy" -> "Copied" for a moment.
export function setButtonLabel(button, labelKey) {
  const label = button.querySelector('.button__label');
  label.dataset.i18n = labelKey;
  label.textContent = t(labelKey);
}

// Disabled = the customer cannot use it yet (nothing chosen, etc.).
export function setButtonDisabled(button, isDisabled) {
  button.dataset.disabled = String(isDisabled);
  updateAvailability(button);
}

// Loading = a call is in flight. The label changes (e.g. "Working out your price…"),
// a spinner appears, and further clicks are ignored so the call is not sent twice.
export function setButtonLoading(button, isLoading, loadingKey = 'flow.common.loading') {
  const label = button.querySelector('.button__label');

  if (isLoading) {
    button.dataset.idleKey = label.dataset.i18n;
    label.dataset.i18n = loadingKey;
    // A shorter loading label must not shrink the button (house rule 7):
    // keep at least the width it had. Measured at run time, not a design size.
    button.style.minWidth = `${button.offsetWidth}px`;
  } else if (button.dataset.idleKey) {
    label.dataset.i18n = button.dataset.idleKey;
    delete button.dataset.idleKey;
    button.style.minWidth = '';
  }

  label.textContent = t(label.dataset.i18n);
  button.classList.toggle('is-loading', isLoading);
  updateAvailability(button);
}

export function isButtonUnavailable(button) {
  return button.getAttribute('aria-disabled') === 'true';
}

// aria-disabled is true while the button is disabled OR loading.
function updateAvailability(button) {
  const unavailable = button.dataset.disabled === 'true' || button.classList.contains('is-loading');
  if (unavailable) {
    button.setAttribute('aria-disabled', 'true');
  } else {
    button.removeAttribute('aria-disabled');
  }
}
