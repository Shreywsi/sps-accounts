/* ======================================================================
   storage.js
   Every read/write to window.storage goes through here. Keeping it in
   one place means if you ever swap the backend (e.g. to a real API),
   this is the only file that changes.
   ====================================================================== */

import { DEFAULT_CATEGORIES, txKey, catKey } from "./constants";

// Loads both ledgers (student + general) on app start.
// Falls back to empty transactions / default categories if nothing saved yet.
export async function loadAllLedgers() {
  const out = { student: null, general: null };
  for (const ledger of ["student", "general"]) {
    let transactions = [];
    let categories = DEFAULT_CATEGORIES[ledger];
    try {
      const r = await window.storage.get(txKey(ledger), true);
      if (r?.value) transactions = JSON.parse(r.value);
    } catch (_) {
      // key doesn't exist yet — that's fine, keep the default
    }
    try {
      const r = await window.storage.get(catKey(ledger), true);
      if (r?.value) categories = JSON.parse(r.value);
    } catch (_) {}
    out[ledger] = { transactions, categories };
  }
  return out;
}

export async function saveTransactions(ledger, transactions) {
  return window.storage.set(txKey(ledger), JSON.stringify(transactions), true);
}

export async function saveCategories(ledger, categories) {
  return window.storage.set(catKey(ledger), JSON.stringify(categories), true);
}