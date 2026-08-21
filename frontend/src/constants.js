/* ======================================================================
   constants.js
   All fixed configuration: default categories, ledger metadata, dropdown
   options, storage key naming, and small formatting helpers.
   Nothing in here holds state — it's just data + pure functions.
   ====================================================================== */

export const DEFAULT_CATEGORIES = {
  student: {
    income: [
      "Tuition Fee", "Admission Fee", "Annual Fee", "Book Charges",
      "Uniform / Socks", "Cab / Transport Fee", "Late Fee", "Old Due Collection",
      "Other Student Income",
    ],
    expense: ["Fee Refund", "Scholarship / Concession", "Other Student Expense"],
  },
  general: {
    income: ["Loan Received", "PF Contribution Received", "Bank Interest", "Other Income"],
    expense: [
      "Teaching Staff Salary", "Non-Teaching Staff Salary", "PF Staff Salary",
      "Rent", "Loan / EMI", "Fuel & Petrol", "Driver Lunch", "Bank Charges",
      "Stationery & Books", "Maintenance", "Other Expense",
    ],
  },
};

export const LEDGER_META = {
  student: { label: "Student Fees Ledger", short: "Student Fees", partyLabel: "Student Name" },
  general: { label: "General Accounts Ledger", short: "General Accounts", partyLabel: "Party / Description" },
};

export const MODES = ["Cash", "Bank"];
export const CLASS_OPTIONS = ["NUR", "LKG", "UKG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const STORAGE_PREFIX = "school-ledger";
export const txKey = (ledger) => `${STORAGE_PREFIX}:${ledger}:transactions`;
export const catKey = (ledger) => `${STORAGE_PREFIX}:${ledger}:categories`;

export const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  type: "income",
  category: "",
  party: "",
  className: "",
  mode: "Cash",
  amount: "",
  remarks: "",
});

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const nowIso = () => new Date().toISOString();

export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};