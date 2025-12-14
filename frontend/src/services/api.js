import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000 // 2 minutes timeout (increased for bulk operations)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

export const tokenAPI = {
  generate: (packageId) => api.post('/tokens/generate', { packageId }),
  generateBulk: (tokenRequests) => api.post('/tokens/generate-bulk', { tokenRequests }),
  getMyTokens: () => api.get('/tokens/my-tokens'),
  getAllTokens: (filters) => api.get('/tokens/all', { params: filters })
};

export const pdfAPI = {
  generateTokenPDF: (tokenIds) => api.post('/pdf/tokens', { tokenIds }, { responseType: 'blob' })
};

export const routerAPI = {
  getAll: () => api.get('/routers'),
  getById: (id) => api.get(`/routers/${id}`),
  create: (data) => api.post('/routers', data),
  update: (id, data) => api.put(`/routers/${id}`, data),
  delete: (id) => api.delete(`/routers/${id}`),
  testConnection: (id) => api.post(`/routers/${id}/test`),
  getInfo: (id) => api.get(`/routers/${id}/info`),
  getStats: (id) => api.get(`/routers/${id}/stats`),
  getStatistics: (id, startDate, endDate) => api.get(`/routers/${id}/statistics`, { params: { startDate, endDate } }),
  getActiveUsers: (id) => api.get(`/routers/${id}/active-users`),
  sync: (id) => api.post(`/routers/${id}/sync`)
};

export const packageAPI = {
  getAll: (activeOnly = true) => api.get('/packages', { params: { activeOnly } }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`)
};

export const analyticsAPI = {
  getOverview: (startDate, endDate, routerId) => api.get('/analytics/overview', { params: { startDate, endDate, routerId } }),
  getRevenue: (startDate, endDate, routerId, staffId) => api.get('/analytics/revenue', { params: { startDate, endDate, routerId, staffId } }),
  getRouters: (startDate, endDate) => api.get('/analytics/routers', { params: { startDate, endDate } }),
  getStaff: (startDate, endDate) => api.get('/analytics/staff', { params: { startDate, endDate } })
};

export const adminAPI = {
  getUsers: (filters) => api.get('/admin/users', { params: filters }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  assignRouter: (userId, routerId) => api.post(`/admin/users/${userId}/assign-router`, { routerId }),
  getAlerts: (filters) => api.get('/admin/alerts', { params: filters }),
  resolveAlert: (id) => api.put(`/admin/alerts/${id}/resolve`),
  getStats: () => api.get('/admin/stats')
};

export default api;

