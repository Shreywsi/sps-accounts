import API from "./axios";

export const getStudents = (params = {}) =>
  API.get("/students/", { params });

export const verifyStudent = (id) => {
  return API.post(`/students/${id}/verify/`);
};
export const rejectStudent = (id) => {
  return API.post(`/students/${id}/reject/`);
};
export const reopenStudent = (id) => {
  return API.post(`/students/${id}/reopen/`);
};
export const createStudent = (data) =>
  API.post("/students/", data);

export const updateStudent = (id, data) =>
  API.put(`/students/${id}/`, data);

export const deleteStudent = (id) =>
  API.delete(`/students/${id}/`);