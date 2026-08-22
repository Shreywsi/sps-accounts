import API from "./axios";

/* ---------------- Events (folders) ---------------- */

export const getEvents = (params = {}) => API.get("/events/events/", { params });

export const getEvent = (id) => API.get(`/events/events/${id}/`);

export const getEventTree = (id) => API.get(`/events/events/${id}/tree/`);

export const createEvent = (data) => API.post("/events/events/", data);

export const updateEvent = (id, data) => API.patch(`/events/events/${id}/`, data);

export const deleteEvent = (id) => API.delete(`/events/events/${id}/`);

export const approveEvent = (id) => API.patch(`/events/events/${id}/approve/`);

export const rejectEvent = (id, reason = "") =>
  API.patch(`/events/events/${id}/reject/`, { reason });

/* ---------------- Categories (nestable) ---------------- */

export const createEventCategory = (data) => API.post("/events/categories/", data);

export const renameEventCategory = (id, name) =>
  API.patch(`/events/categories/${id}/`, { name });

export const deleteEventCategory = (id) => API.delete(`/events/categories/${id}/`);

/* ---------------- Entries (the actual spend lines) ---------------- */

const toFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });
  return formData;
};

export const createEventEntry = (data) =>
  API.post("/events/entries/", toFormData(data));

export const updateEventEntry = (id, data) =>
  API.patch(`/events/entries/${id}/`, toFormData(data));

export const deleteEventEntry = (id) => API.delete(`/events/entries/${id}/`);

/* ---------------- Comments ---------------- */

export const getEventComments = (eventId) =>
  API.get("/events/comments/", { params: { event: eventId } });

export const createEventComment = (data) => API.post("/events/comments/", data);
