import API from "../utils/api";

export const getPackages = async () => {
  const res = await API.get("/packages/normal");
  return { data: res.data };
};

export const getPromotions = async () => {
  const res = await API.get("/packages/promotion");
  return { data: res.data };
};

export const applyService = (data) => API.post("/applications", data);
export const getApplications = () => API.get("/applications");
export const deleteApplication = (id) => API.delete(`/applications/${id}`);

export const createRequest = (data) => API.post("/requests", data);
export const getRequests = () => API.get("/requests");
export const deleteRequest = (id) => API.delete(`/requests/${id}`);
export const updateRequest = (id, data) => API.put(`/requests/${id}`, data);
export const payRequest = (id) => API.put(`/requests/${id}/pay`);

//Inquiry API

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Inquiries
export const fetchInquiries = async () => {
  const res = await fetch(`${API_BASE}/inquiries`);
  if (!res.ok) throw new Error("Failed to load inquiries");
  return res.json();
};

export const createInquiry = async (inquiry) => {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  if (!res.ok) throw new Error("Failed to create inquiry");
  return res.json();
};

export const deleteInquiry = async (id) => {
  const res = await fetch(`${API_BASE}/inquiries/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete inquiry");
  return res.json();
};

// Messages
export const fetchMessages = async (inquiryId) => {
  const res = await fetch(`${API_BASE}/inquiries/messages/${inquiryId}`);
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
};

export const sendMessage = async (message) => {
  const res = await fetch(`${API_BASE}/inquiries/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
};

// Notifications
export const fetchNotifications = async (userId) => {
  const res = await fetch(`${API_BASE}/notifications/user/${userId}`);
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
};

export const deleteNotification = async (notificationId) => {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete notification");
  return res.json();
};
