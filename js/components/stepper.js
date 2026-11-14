// Stepper: "Step 3 of 6 · Driver" plus a bar with one segment per screen.
// The text is what assistive technology reads; the bar is decorative (aria-hidden).

import { t } from '../i18n.js';

export function createStepper() {
  const element = document.createElement('div');
  element.className = 'stepper';

  const text = document.createElement('p');
  text.className = 'stepper__text';

  const track = document.createElement('div');
  track.className = 'stepper__track';
  track.setAttribute('aria-hidden', 'true');

  element.append(text, track);
  return element;
}

// Called on every screen change and every language change.
// updateStepper(stepper, { current: 3, total: 6, nameKey: 'flow.stepper.driver' })
export function updateStepper(element, { current, total, nameKey }) {
  const text = element.querySelector('.stepper__text');
  const track = element.querySelector('.stepper__track');

  const count = document.createElement('span');
  count.className = 'stepper__count';
  count.textContent = t('flow.stepper.stepOf', { current, total });

  const name = document.createElement('span');
  name.className = 'stepper__name';
  name.textContent = t(nameKey);

  // The separator is punctuation, not copy: it reads the same in both languages.
  text.replaceChildren(count, ' · ', name);

  // Rebuild the segments: the ones up to the current screen are filled.
  track.replaceChildren();
  for (let step = 1; step <= total; step += 1) {
    const segment = document.createElement('span');
    segment.className = step <= current ? 'stepper__segment is-done' : 'stepper__segment';
    track.append(segment);
  }
}
