import API from "./axios";

export const getNotifications = () => API.get("/notifications/");

export const getUnreadCount = () =>
  API.get("/notifications/unread_count/");

export const markNotificationRead = (id) =>
  API.post(`/notifications/${id}/mark_read/`);

export const markAllNotificationsRead = () =>
  API.post("/notifications/mark_all_read/");

export const getMessages = () => API.get("/messages/");

export const sendMessage = (data) => API.post("/messages/", data);