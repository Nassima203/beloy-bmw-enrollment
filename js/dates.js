// Calendar dates as "YYYY-MM-DD" strings: the API format and the value of
// <input type="date">. Strings in this format sort like dates, so plain
// < and > comparisons work ("2027-06-04" > "2026-11-14").
// Everything uses the customer's local day, not UTC.

// Date object -> "YYYY-MM-DD"
export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

// Today plus `days` (used for "tomorrow" as the earliest delivery date).
export function daysFromTodayIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

// The same day `years` years ago: someone born on or before it is at least that old.
export function yearsAgoIso(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return toIsoDate(date);
}
