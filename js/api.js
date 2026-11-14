// Ardenne Assurance API client (contract: docs/api.pdf).
// Screens only call createQuote() and createContract(). Both return the
// response body on success, and throw an ApiError on failure.
//
// While USE_STUB is true (js/config.js), answers come from the documented
// examples below after a short delay, so loading states can be seen.
//
// Forcing errors while testing (query string goes before the #):
//   ?fail=500  -> internal_error on both calls
//   ?fail=409  -> quote_expired on createContract
// Natural errors, as documented:
//   licence held under 2 years, or claims_3y >= 3 -> driver_ineligible (quote)
//   any of the three consents not true             -> consent_required (contract)

import { BASE_URL, PROGRAM, USE_STUB } from './config.js';

const STUB_DELAY_MS = 900;

// Thrown for every API failure. `error` keeps the documented body shape
// { code, message, request_id }. Screens pick their copy from `error.code`;
// `message` and `request_id` are for console.error only, never the screen.
export class ApiError extends Error {
  constructor(status, error) {
    super(`${status} ${error.code}`);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
  }
}

// ---------------------------------------------------------------------------
// Public calls
// ---------------------------------------------------------------------------

// POST /v1/quotes. `vehicle` and `driver` follow the documented request fields.
export function createQuote({ vehicle, driver }) {
  return post('/v1/quotes', { program: PROGRAM, vehicle, driver });
}

// POST /v1/contracts. `options` must not contain add-ons the package includes.
export function createContract({ quoteId, packageId, options, frequency, holder, consents }) {
  return post('/v1/contracts', {
    quote_id: quoteId,
    package_id: packageId,
    options,
    frequency,
    holder,
    consents,
  });
}

// ---------------------------------------------------------------------------
// Transport: stub or real fetch, same result either way
// ---------------------------------------------------------------------------

async function post(path, body) {
  if (USE_STUB) {
    return stubPost(path, body);
  }

  const response = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-program': PROGRAM,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.error);
  }
  return data;
}

async function stubPost(path, body) {
  await wait(STUB_DELAY_MS);

  if (forcedFailure() === '500') {
    throw stubError(500, 'internal_error', 'Unexpected error while processing the request');
  }

  if (path === '/v1/quotes') {
    return stubQuote(body);
  }
  if (path === '/v1/contracts') {
    return stubContract(body);
  }
  throw stubError(400, 'invalid_request', `Unknown path ${path}`);
}

// ---------------------------------------------------------------------------
// Stub behaviour
// ---------------------------------------------------------------------------

function stubQuote({ driver }) {
  if (!hasHeldLicenceTwoYears(driver.licence_since)) {
    throw stubError(422, 'driver_ineligible', 'Licence held for less than two years');
  }
  if (driver.claims_3y >= 3) {
    throw stubError(422, 'driver_ineligible', 'More than two at-fault claims in the last three years');
  }

  // A copy, so a screen can never modify the example data by accident.
  return structuredClone(QUOTE_RESPONSE);
}

function stubContract({ quote_id, package_id, options, frequency, consents }) {
  if (forcedFailure() === '409') {
    throw stubError(409, 'quote_expired', `Quote ${quote_id} expired at ${QUOTE_RESPONSE.expires_at}`);
  }

  const allConsents =
    consents?.pre_contractual_information === true &&
    consents?.general_conditions === true &&
    consents?.data_processing === true;
  if (!allConsents) {
    throw stubError(422, 'consent_required', 'All three consents must be true');
  }

  const contract = structuredClone(CONTRACT_RESPONSE);

  // Play the server's part: price the exact selection from the quote figures,
  // so choosing "annual" or another package gives a coherent reference screen.
  // With comfort + WALLBOX + BATTERY + GLASS monthly, this gives exactly the
  // documented example (81600 / 7480).
  const pkg = QUOTE_RESPONSE.packages.find((p) => p.id === package_id);
  if (!pkg) {
    throw stubError(400, 'invalid_request', `Unknown package_id ${package_id}`);
  }

  let annual = pkg.price.annual;
  let monthly = pkg.price.monthly;
  for (const code of options) {
    const option = pkg.options.find((o) => o.code === code);
    if (!option || option.included) {
      throw stubError(400, 'invalid_request', `Option ${code} is unknown or already included`);
    }
    annual += option.price.annual;
    monthly += option.price.monthly;
  }

  contract.premium = { annual, monthly, frequency };
  contract.payment.amount = frequency === 'annual' ? annual : monthly;
  return contract;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reads ?fail=409 or ?fail=500 from the page URL (null if absent).
function forcedFailure() {
  return new URLSearchParams(window.location.search).get('fail');
}

function stubError(status, code, message) {
  return new ApiError(status, { code, message, request_id: randomRequestId() });
}

// "req_" + 8 hex characters, like the documented "req_41d9c0a7".
function randomRequestId() {
  const hex = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
  return `req_${hex}`;
}

// true if the licence date ("YYYY-MM-DD") is at least two years before today.
function hasHeldLicenceTwoYears(licenceSince) {
  const [year, month, day] = licenceSince.split('-').map(Number);
  const twoYearsLater = new Date(year + 2, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return twoYearsLater <= today;
}

// ---------------------------------------------------------------------------
// Documented example responses (docs/api.pdf), figures unchanged
// ---------------------------------------------------------------------------

const QUOTE_RESPONSE = {
  quote_id: 'qt_7f3a91c2',
  currency: 'EUR',
  expires_at: '2027-05-21T10:00:00Z',
  packages: [
    {
      id: 'essential',
      price: { annual: 42000, monthly: 3850 },
      options: [
        { code: 'WALLBOX', included: false, price: { annual: 4800, monthly: 440 } },
        { code: 'CABLE', included: false, price: { annual: 2400, monthly: 220 } },
        { code: 'BATTERY', included: false, price: { annual: 9600, monthly: 880 } },
        { code: 'STRANDED', included: false, price: { annual: 3600, monthly: 330 } },
        { code: 'GLASS', included: false, price: { annual: 6000, monthly: 550 } },
      ],
    },
    {
      id: 'comfort',
      price: { annual: 61200, monthly: 5610 },
      options: [
        { code: 'WALLBOX', included: false, price: { annual: 4800, monthly: 440 } },
        { code: 'CABLE', included: true, price: { annual: 0, monthly: 0 } },
        { code: 'BATTERY', included: false, price: { annual: 9600, monthly: 880 } },
        { code: 'STRANDED', included: true, price: { annual: 0, monthly: 0 } },
        { code: 'GLASS', included: false, price: { annual: 6000, monthly: 550 } },
      ],
    },
    {
      id: 'integral',
      price: { annual: 86400, monthly: 7920 },
      options: [
        { code: 'WALLBOX', included: true, price: { annual: 0, monthly: 0 } },
        { code: 'CABLE', included: true, price: { annual: 0, monthly: 0 } },
        { code: 'BATTERY', included: false, price: { annual: 9600, monthly: 880 } },
        { code: 'STRANDED', included: true, price: { annual: 0, monthly: 0 } },
        { code: 'GLASS', included: true, price: { annual: 0, monthly: 0 } },
      ],
    },
  ],
};

const CONTRACT_RESPONSE = {
  contract_id: 'ctr_8d41b06f',
  policy_number: 'ARD-FR-2026-0481233',
  status: 'issued',
  starts_on: '2027-06-04',
  ends_on: '2028-06-03',
  premium: { annual: 81600, monthly: 7480, frequency: 'monthly' },
  payment: {
    method: 'atm_reference',
    entity: '21456',
    reference: '907318442',
    amount: 7480,
    due_by: '2027-06-01',
  },
};
