// Error panel: a title, a plain sentence and one way forward (house rule 6).
// The customer never sees a code, a status or the insurer's message: those go
// to console.error through logError(), and the copy comes from flow.errors.<code>.*.

import { t } from '../i18n.js';
import { ApiError } from '../api.js';
import { createButton } from './button.js';

// Codes that have their own copy in i18n. Anything else falls back to "unknown".
const KNOWN_CODES = [
  'invalid_request',
  'quote_not_found',
  'quote_expired',
  'driver_ineligible',
  'consent_required',
  'internal_error',
  'network',
  'unknown',
];

const ERROR_ICON =
  '<svg class="icon error-panel__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
  '<path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
  '</svg>';

// Turns whatever was thrown into one of KNOWN_CODES.
export function errorCodeOf(error) {
  if (error instanceof ApiError) {
    return KNOWN_CODES.includes(error.error.code) ? error.error.code : 'unknown';
  }
  // fetch() rejects with a TypeError when the network is down.
  if (error instanceof TypeError) {
    return 'network';
  }
  return 'unknown';
}

// Everything technical goes here, and only here.
export function logError(error, context) {
  if (error instanceof ApiError) {
    const { code, message, request_id } = error.error;
    console.error(`[${context}] ${error.status} ${code}`, { message, request_id });
  } else {
    console.error(`[${context}]`, error);
  }
}

// createErrorPanel({ code: 'quote_expired', onAction: () => … })
// headingLevel: 1 when the panel replaces a whole screen, 2 inside a screen.
export function createErrorPanel({ code, onAction, headingLevel = 2 }) {
  const safeCode = KNOWN_CODES.includes(code) ? code : 'unknown';
  const prefix = `flow.errors.${safeCode}`;
  const titleId = `error-panel-title-${safeCode}`;

  const panel = document.createElement('section');
  panel.className = 'error-panel';
  panel.setAttribute('aria-labelledby', titleId);
  panel.insertAdjacentHTML('beforeend', ERROR_ICON);

  const title = document.createElement(`h${headingLevel}`);
  title.className = 'error-panel__title';
  title.id = titleId;
  title.tabIndex = -1; // so focusErrorPanel() can move focus here
  title.dataset.i18n = `${prefix}.title`;
  title.textContent = t(`${prefix}.title`);

  const body = document.createElement('p');
  body.className = 'error-panel__body';
  body.dataset.i18n = `${prefix}.body`;
  body.textContent = t(`${prefix}.body`);

  const action = createButton({ labelKey: `${prefix}.action`, onClick: onAction });

  panel.append(title, body, action);
  return panel;
}

// Moves focus to the panel title, so screen reader users hear what happened
// and keyboard users land right above the way forward.
export function focusErrorPanel(panel) {
  panel.querySelector('.error-panel__title').focus();
}
