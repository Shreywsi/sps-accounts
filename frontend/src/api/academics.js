import API from "./axios";

export const getClasses = () =>
  API.get("/academics/classes/");

export const createClass = (data) =>
  API.post("/academics/classes/", data);

export const updateClass = (id, data) =>
  API.put(`/academics/classes/${id}/`, data);

export const deleteClass = (id) =>
  API.delete(`/academics/classes/${id}/`);

export const getSections = (classId) =>
  API.get("/academics/sections/", {
    params: classId ? { school_class: classId } : {},
  });

export const createSection = (data) =>
  API.post("/academics/sections/", data);

export const updateSection = (id, data) =>
  API.put(`/academics/sections/${id}/`, data);

export const deleteSection = (id) =>
  API.delete(`/academics/sections/${id}/`);