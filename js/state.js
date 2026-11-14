// The customer's answers and the API results, kept in memory for one visit.
// The brief says the flow does not need to survive a reload, so nothing is saved.
// Field names follow docs/api.pdf, so a section can be sent to the API as it is.
// Amounts stay in minor units (integers) here, like everywhere else.

function createInitialState() {
  return {
    // Arrives with the order (example values from docs/api.pdf).
    // The vehicle screen lets the customer confirm or correct it.
    vehicle: {
      model_code: 'i4',
      list_price: 5959000,
      delivery_date: '2027-06-04',
    },

    // Empty until the driver screen is filled in.
    driver: {
      birth_date: '',
      licence_since: '',
      claims_3y: null,
      annual_km: null,
      postcode: '',
      parking: '',
      charging: '',
    },

    // POST /v1/quotes response, or null before the call.
    quote: null,

    // Cover screen. No package chosen when the screen opens (brief).
    // Frequency starts on monthly, like the landing "from" price.
    selection: {
      packageId: null,
      options: [], // add-on codes the customer ticked, never the included ones
      frequency: 'monthly',
    },

    holder: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },

    consents: {
      pre_contractual_information: false,
      general_conditions: false,
      data_processing: false,
    },

    // POST /v1/contracts response, or null before the call.
    contract: null,
  };
}

let state = createInitialState();

// Read access. Screens change state only through the two functions below.
export function getState() {
  return state;
}

// Merges values into one section: updateState('driver', { postcode: '75011' })
export function updateState(section, values) {
  state[section] = { ...state[section], ...values };
}

// Replaces one section: setState('quote', response) or setState('quote', null)
export function setState(section, value) {
  state[section] = value;
}

// "Start a new quote": back to the order values, everything else cleared.
export function resetState() {
  state = createInitialState();
}
