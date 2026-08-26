import API from "./axios";

// Categories
export const getFeeCategories = () =>
  API.get("/fees/categories/");

export const createFeeCategory = (data) =>
  API.post("/fees/categories/", data);

export const deleteFeeCategory = (id) =>
  API.delete(`/fees/categories/${id}/`);

// Structures
export const getFeeStructures = (params = {}) =>
  API.get("/fees/structures/", { params });

export const createFeeStructure = (data) =>
  API.post("/fees/structures/", data);

export const updateFeeStructure = (id, data) =>
  API.patch(`/fees/structures/${id}/`, data);

export const deleteFeeStructure = (id) =>
  API.delete(`/fees/structures/${id}/`);

// Structure items (per-category amounts inside a structure)
export const createFeeStructureItem = (data) =>
  API.post("/fees/structure-items/", data);

export const updateFeeStructureItem = (id, data) =>
  API.patch(`/fees/structure-items/${id}/`, data);

export const deleteFeeStructureItem = (id) =>
  API.delete(`/fees/structure-items/${id}/`);

// Assignment
export const assignFeeToClass = (data) =>
  API.post("/fees/student-fees/assign-class/", data);

export const getStudentFees = (params = {}) =>
  API.get("/fees/student-fees/", { params });

// Payments (legacy FeeStructure-based flow - being phased out, see
// MIGRATION_GUIDE.md. New code should use the ledger + simple-payments
// flow below instead.)
export const collectPayment = (data) =>
  API.post("/fees/payments/", data);

// Monthly fee ledger - the source of truth for "which months has this
// student paid". One row per student per calendar month.
// NOTE: these hit apps.fees.simple_urls, registered at api/v1/fees/
// (no "/simple/" segment - see backend/config/urls.py). getDashboardData
// below uses "/fees/simple/dashboard/", which is a pre-existing path
// mismatch in this codebase; these new endpoints intentionally use the
// path that's actually wired up so they aren't broken from day one.
export const getStudentLedger = (studentId, year) =>
  API.get("/fees/ledger/", { params: { student: studentId, year } });

export const generateLedgerYear = (studentId, year) =>
  API.post("/fees/ledger/generate/", { student: studentId, year });

// Operator entry -> goes to PENDING, admin must approve/reject before it
// affects any balance.
export const recordMonthlyPayment = (data) =>
  API.post("/fees/simple-payments/", data);

export const getPendingPayments = (params = {}) =>
  API.get("/fees/simple-payments/", { params: { status: "PENDING", ...params } });

export const approvePayment = (id) =>
  API.post(`/fees/simple-payments/${id}/approve/`);

export const rejectPayment = (id, reason) =>
  API.post(`/fees/simple-payments/${id}/reject/`, { reason });

// Corrections to an already-approved payment - never edit the payment
// itself, always create an adjustment.
export const createPaymentAdjustment = (data) =>
  API.post("/fees/adjustments/", data);

// Dashboard / reports
export const getDashboardData = () =>
  API.get("/fees/simple/dashboard/");

export const getDueFeesReport = () =>
  API.get("/fees/reports/due-fees/");