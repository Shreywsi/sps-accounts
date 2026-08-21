import API from "./axios";

export const getExpenses = (params = {}) =>
  API.get("/expenses/expenses/", { params });

export const getExpense = (id) =>
  API.get(`/expenses/expenses/${id}/`);

const toFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });
  return formData;
};

export const createExpense = (data) =>
  API.post("/expenses/expenses/", toFormData(data));

export const updateExpense = (id, data) =>
  API.patch(`/expenses/expenses/${id}/`, toFormData(data));

export const deleteExpense = (id) =>
  API.delete(`/expenses/expenses/${id}/`);

export const getExpenseCategories = () =>
  API.get("/expenses/categories/");

export const createExpenseCategory = (data) =>
  API.post("/expenses/categories/", data);

export const getExpenseSummary = (period = "monthly") =>
  API.get("/expenses/summary/", { params: { period } });