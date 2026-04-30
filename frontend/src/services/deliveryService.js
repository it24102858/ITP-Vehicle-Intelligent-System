import API from '../utils/api';

export const createDelivery = (data) => API.post('/deliveries', data);
export const getMyDeliveries = (name) => API.get(`/deliveries/my?name=${encodeURIComponent(name)}`);
export const getDeliveryById = (id) => API.get(`/deliveries/${id}`);
export const cancelDelivery = (id) => API.put(`/deliveries/${id}/cancel`);

export const getAllDeliveries = (params = {}) => API.get('/deliveries', { params });
export const updateStatus = (id, status) => API.put(`/deliveries/${id}/status`, { status });
export const assignAgent = (id, agentId) => API.put(`/deliveries/${id}/agent`, { agentId });
export const deleteDelivery = (id) => API.delete(`/deliveries/${id}`);
export const getStats = () => API.get('/deliveries/stats');
