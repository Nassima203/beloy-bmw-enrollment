// Hash router: #/ is the landing, #/vehicle, #/driver… are the next screens.
// Hash URLs work with any static server (npx serve) and keep the browser
// Back button working, with no server configuration.
//
// Each screen is a module in js/screens/ that exports:
//   render({ navigate, goBack }) -> HTMLElement (or a Promise of one)
// The element must contain exactly one <h1>: the router moves focus to it.

import { t } from './i18n.js';
import { createErrorPanel, logError } from './components/error-panel.js';

// The six screens, in flow order.
// stepKey: the screen is a flow step, counted in "Step X of 5". The landing has
// none: it is the way in, so it shows neither the stepper nor Back.
// canGoBack: false hides the Back button (once the policy is issued, going back
// to the review would make no sense).
export const ROUTES = [
  { path: '', screen: 'landing', stepKey: null, canGoBack: false },
  { path: 'vehicle', screen: 'vehicle', stepKey: 'flow.stepper.vehicle', canGoBack: true },
  { path: 'driver', screen: 'driver', stepKey: 'flow.stepper.driver', canGoBack: true },
  { path: 'cover', screen: 'cover', stepKey: 'flow.stepper.cover', canGoBack: true },
  { path: 'review', screen: 'review', stepKey: 'flow.stepper.review', canGoBack: true },
  { path: 'payment', screen: 'payment', stepKey: 'flow.stepper.payment', canGoBack: false },
];

// The screens counted by the stepper: vehicle, driver, cover, review, payment.
export const FLOW_STEPS = ROUTES.filter((route) => route.stepKey !== null);

let app = null;
let onRender = null;
let renderCount = 0;

// startRouter({ app: document.getElementById('app'), onRender: (route, index) => … })
// onRender runs after each screen is in the page (main.js updates the stepper there).
export function startRouter(options) {
  app = options.app;
  onRender = options.onRender;

  // Browser Back/Forward and navigate() both end up here.
  window.addEventListener('hashchange', () => renderCurrent({ moveFocus: true }));

  // First load: focus stays at the top of the page, where the skip link is.
  return renderCurrent({ moveFocus: false });
}

// navigate('driver') -> #/driver
export function navigate(path) {
  const hash = `#/${path}`;
  if (window.location.hash === hash) {
    renderCurrent({ moveFocus: true }); // same screen: hashchange would not fire
  } else {
    window.location.hash = hash;
  }
}

// The Back button goes to the previous screen in the flow (not browser history),
// so it always does the same thing, even after a reload.
export function goBack() {
  const index = currentIndex();
  if (index > 0) {
    navigate(ROUTES[index - 1].path);
  }
}

// Position of the current hash in ROUTES, or -1 if unknown.
function currentIndex() {
  const path = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.findIndex((route) => route.path === path);
}

// Renders the screen for the current hash into <main id="app">.
// moveFocus: true after a navigation; false on first load and on language change
// (there, focus must stay on the language button the customer just pressed).
export async function renderCurrent({ moveFocus }) {
  let index = currentIndex();
  if (index === -1) {
    // Unknown address: show the landing. replaceState does not fire hashchange.
    history.replaceState(null, '', '#/');
    index = 0;
  }
  const route = ROUTES[index];

  // If the customer navigates again while this screen is loading,
  // only the latest navigation is allowed to fill the page.
  renderCount += 1;
  const thisRender = renderCount;

  let view;
  try {
    const screen = await import(`./screens/${route.screen}.js`);
    view = await screen.render({ navigate, goBack });
  } catch (error) {
    // A screen that fails to load still gets a proper error screen, never a blank page.
    logError(error, `router: ${route.screen}`);
    view = createErrorPanel({
      code: 'unknown',
      headingLevel: 1,
      onAction: () => renderCurrent({ moveFocus: true }),
    });
  }

  if (thisRender !== renderCount) {
    return;
  }

  app.replaceChildren(view);
  if (onRender) {
    onRender(route, index);
  }

  const heading = app.querySelector('h1');
  document.title = heading
    ? t('flow.common.documentTitle', { screen: heading.textContent, site: t('flow.common.pageTitle') })
    : t('flow.common.pageTitle');

  if (moveFocus && heading) {
    // A screen reader announces the new screen title; Tab continues from there.
    window.scrollTo(0, 0);
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}
