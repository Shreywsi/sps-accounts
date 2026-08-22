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

// Payments
export const collectPayment = (data) =>
  API.post("/fees/payments/", data);

// Dashboard / reports
export const getDashboardData = () =>
  API.get("/fees/dashboard/");

export const getDueFeesReport = () =>
  API.get("/fees/reports/due-fees/");