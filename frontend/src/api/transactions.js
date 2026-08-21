import api from './axios';

export const getTransactions = async (params) => {
  const response = await api.get('/transactions/', { params });
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/transactions/', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await api.patch(`/transactions/${id}/`, data);
  return response.data;
};

export const approveTransaction = async (id) => {
  const response = await api.post(`/transactions/${id}/approve/`);
  return response.data;
};

export const rejectTransaction = async (id, reason = '') => {
  const response = await api.post(`/transactions/${id}/reject/`, { reason });
  return response.data;
};

export const getTransactionCategories = async () => {
  const response = await api.get('/transactions/categories/');
  return response.data;
};

export const getTransactionColumns = async () => {
  const response = await api.get('/transactions/columns/?is_active=true');
  return response.data;
};

export const createTransactionColumn = async (data) => {
  const response = await api.post('/transactions/columns/', data);
  return response.data;
};

export const deleteTransactionColumn = async (id) => {
  const response = await api.delete(`/transactions/columns/${id}/`);
  return response.data;
};

export const createTransactionCategory = async (data) => {
  const response = await api.post('/transactions/categories/', data);
  return response.data;
};

export const deleteTransactionCategory = async (id) => {
  const response = await api.delete(`/transactions/categories/${id}/`);
  return response.data;
};