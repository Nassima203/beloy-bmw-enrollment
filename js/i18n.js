// Copy loader: every string the customer reads comes from i18n/<lang>.json.
// Keys are flat ("flow.cover.title"), so a lookup is a plain object access.

export const DEFAULT_LANG = 'en';

// Languages we ship, and the Intl locale each one uses for money and dates.
// en-GB gives "€816.00"; fr-FR gives "816,00 €".
const LOCALES = {
  en: 'en-GB',
  fr: 'fr-FR',
};

let currentLang = DEFAULT_LANG;
let strings = {};

// Fetches the copy file for `lang` (falls back to English if unknown).
// The URL is resolved from this module's location, so it works from any page.
export async function loadLanguage(lang) {
  const safeLang = lang in LOCALES ? lang : DEFAULT_LANG;
  const url = new URL(`../i18n/${safeLang}.json`, import.meta.url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[i18n] Could not load ${url} (HTTP ${response.status})`);
  }

  strings = await response.json();
  currentLang = safeLang;
  document.documentElement.lang = safeLang;
}

// Returns the string for `key`, with {placeholders} replaced from `params`.
// Example: t('flow.payment.dueBy', { date: '1 June 2027' })
// Non-string values (like the landing "from" price) are returned as they are.
export function t(key, params = {}) {
  const value = strings[key];

  if (value === undefined) {
    // Showing the key makes a missing translation easy to spot during development.
    console.warn(`[i18n] Missing key: ${key}`);
    return key;
  }

  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (placeholder, name) =>
    name in params ? String(params[name]) : placeholder
  );
}

export function getLanguage() {
  return currentLang;
}

// Locale string for Intl.NumberFormat / Intl.DateTimeFormat.
export function getLocale() {
  return LOCALES[currentLang];
}

// Creates an element whose text comes from the copy file.
// data-i18n lets translateDom() update it when the language changes.
// createTextElement('p', 'screen__lead', 'flow.vehicle.lead')
export function createTextElement(tag, className, key) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.dataset.i18n = key;
  element.textContent = t(key);
  return element;
}

// Like t(), but one {placeholder} becomes an element, e.g. a bold amount.
// Returns [textBefore, element, textAfter], ready for parent.append(...).
// Word order stays whatever each language file says ("From {amount} a month",
// "À partir de {amount} par mois").
export function tWithElement(key, name, element) {
  const [before, after = ''] = t(key).split(`{${name}}`);
  return [before, element, after];
}

// Fills static markup: <span data-i18n="flow.common.skipLink"></span>
export function translateDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
}
