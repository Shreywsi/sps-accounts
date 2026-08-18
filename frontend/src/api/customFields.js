import API from "./axios";

export const getCustomFields = (activeOnly = true) =>
  API.get("/custom-fields/", {
    params: activeOnly ? { is_active: true } : {},
  });

export const createCustomField = (data) =>
  API.post("/custom-fields/", data);

export const updateCustomField = (id, data) =>
  API.put(`/custom-fields/${id}/`, data);

export const deactivateCustomField = (id) =>
  API.patch(`/custom-fields/${id}/`, { is_active: false });

export const deleteCustomField = (id) =>
  API.delete(`/custom-fields/${id}/`);