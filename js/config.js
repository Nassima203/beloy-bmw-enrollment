// The only place that knows where the Ardenne Assurance API lives.
// In a real integration this is the one line that changes between
// a laptop, a test environment and production (see docs/api.pdf, "Conventions").

export const BASE_URL = 'http://127.0.0.1:4000';

// Program identifier: sent as the `x-program` header on every call
// and as `program` in the quote body.
export const PROGRAM = 'bmw-fr-ev';

// true: js/api.js answers with the documented example responses (no network).
// false: js/api.js calls BASE_URL for real (e.g. a local mock server).
export const USE_STUB = true;
