// Entry point: theme, language, the header switches, Back + stepper, then the router.

import { loadLanguage, preloadLanguage, translateDom, getLanguage, t, DEFAULT_LANG } from './i18n.js';
import { startRouter, renderCurrent, goBack, FLOW_STEPS } from './router.js';
import { createButton } from './components/button.js';
import { createStepper, updateStepper } from './components/stepper.js';

// Remembered between visits in this browser. Only preferences, never answers.
const LANG_STORAGE_KEY = 'bmw-ev-lang';
const THEME_STORAGE_KEY = 'bmw-ev-theme';

const backButton = createButton({
  labelKey: 'flow.common.back',
  variant: 'ghost',
  icon: 'arrow-left',
  onClick: goBack,
});
const stepper = createStepper();

start();

async function start() {
  // Theme first, so the page is painted in the right colours as early as possible.
  applyTheme(readPreference(THEME_STORAGE_KEY) ?? systemTheme());

  const preferred = readPreference(LANG_STORAGE_KEY) ?? browserLanguage();
  try {
    await loadLanguage(preferred);
  } catch (error) {
    console.error(error);
    // One file failing should not leave a blank page: try English.
    try {
      await loadLanguage(DEFAULT_LANG);
    } catch (fallbackError) {
      // No copy file at all: there is no text we are allowed to show.
      console.error(fallbackError);
      return;
    }
  }

  document.getElementById('back-slot').append(backButton);
  document.getElementById('stepper-slot').append(stepper);

  setUpLanguageSwitch();
  setUpThemeToggle();
  setUpSkipLink();
  translateDom();

  await startRouter({
    app: document.getElementById('app'),
    onRender: updateFlowBar,
  });

  // After the first screen: fetch the other language so switching is instant.
  preloadLanguage(getLanguage() === 'en' ? 'fr' : 'en');
}

// Called by the router after each screen is rendered.
function updateFlowBar(route) {
  // The landing is not a flow step: no stepper, no Back, so the whole bar goes.
  const flowBar = document.querySelector('.flow-bar');
  flowBar.hidden = route.stepKey === null;
  if (flowBar.hidden) {
    return;
  }

  const current = FLOW_STEPS.indexOf(route) + 1;
  updateStepper(stepper, { current, total: FLOW_STEPS.length, nameKey: route.stepKey });

  // visibility (not display) keeps the bar the same height on every flow step.
  backButton.style.visibility = route.canGoBack ? 'visible' : 'hidden';
}

// ---------------------------------------------------------------------------
// Language (EN / FR)
// ---------------------------------------------------------------------------

function setUpLanguageSwitch() {
  document.querySelectorAll('.lang-switch__option').forEach((button) => {
    button.addEventListener('click', () => changeLanguage(button.dataset.lang));
  });
  updateLanguageButtons();
}

async function changeLanguage(lang) {
  if (lang === getLanguage()) {
    return;
  }

  try {
    await loadLanguage(lang);
  } catch (error) {
    // Keep the current language; the page still works.
    console.error(error);
    return;
  }

  savePreference(LANG_STORAGE_KEY, lang);
  translateDom();
  updateLanguageButtons();
  updateThemeButton();
  // Re-render the screen in the new language. Answers live in state.js, so nothing is lost.
  await renderCurrent({ moveFocus: false });
}

function updateLanguageButtons() {
  document.querySelectorAll('.lang-switch__option').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === getLanguage()));
  });
}

// French browsers get French, everyone else English.
function browserLanguage() {
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

// ---------------------------------------------------------------------------
// Theme (light / dark)
// ---------------------------------------------------------------------------

function setUpThemeToggle() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    savePreference(THEME_STORAGE_KEY, next);
    updateThemeButton();
  });
  updateThemeButton();
}

// tokens.css switches every colour from this one attribute.
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function currentTheme() {
  return document.documentElement.dataset.theme;
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// The label says what the button will do: "Switch to dark theme" while light.
function updateThemeButton() {
  const key = currentTheme() === 'dark' ? 'flow.common.themeToggleLight' : 'flow.common.themeToggle';
  const label = document.getElementById('theme-toggle-label');
  label.dataset.i18n = key;
  label.textContent = t(key);
}

// ---------------------------------------------------------------------------
// Skip link
// ---------------------------------------------------------------------------

// href="#app" would change the hash and confuse the router, so focus <main> directly.
function setUpSkipLink() {
  document.querySelector('.skip-link').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('app').focus();
  });
}

// ---------------------------------------------------------------------------
// Preferences in localStorage. It can be blocked (private mode, settings),
// so every access is wrapped and the page works without it.
// ---------------------------------------------------------------------------

function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not saved: the choice still applies for this visit.
  }
}
