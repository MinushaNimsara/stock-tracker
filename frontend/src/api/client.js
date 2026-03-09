import axios from 'axios';

// VITE_API_URL: use for Railway backend (Option B) or local dev override
// If unset in production: use same-origin /api (Vercel serverless - Option A)
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token from localStorage to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData needs browser-set Content-Type (multipart/form-data with boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// On 401, clear token so user is redirected to login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
export { baseURL };

// API methods
export const api = {
  // Auth
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => apiClient.get('/auth/me'),

  // Descriptions
  getDescriptions: () => apiClient.get('/descriptions'),
  createDescription: (data) => apiClient.post('/descriptions', data),
  deleteDescription: (id) => apiClient.delete(`/descriptions/${id}`),

  // Colors
  getColors: () => apiClient.get('/colors'),
  createColor: (data) => apiClient.post('/colors', data),

  // Stock entries
  createStockEntry: (data) => apiClient.post('/stock', data),
  listStockEntries: (params) => apiClient.get('/stock/entries', { params }),
  getStockEntry: (id) => apiClient.get(`/stock/entries/${id}`),
  updateStockEntry: (id, data) => apiClient.patch(`/stock/entries/${id}`, data),
  deleteStockEntry: (id) => apiClient.delete(`/stock/entries/${id}`),
  getMonthlyReport: (yearMonth) => apiClient.get(`/stock/monthly/${yearMonth}`),
  getDepartments: () => apiClient.get('/departments'),
  getDeptGrid: (date) => apiClient.get(`/stock/dept-grid/${date}`),
  saveDeptGrid: (data) => apiClient.post('/stock/dept-grid', data),

  // For Excel-style report
  getMonthlyReportByYearMonth: (year, month) =>
    apiClient.get(`/stock/monthly/${year}-${String(month).padStart(2, '0')}`),

  uploadStoreList: async (file) => {
    // Use base64 JSON - more reliable on Vercel serverless (avoids multipart parsing)
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return apiClient.post('/admin/upload-store-list-base64', {
      content: base64,
      filename: file.name || 'upload.csv',
    });
  },

  // Download Excel
  downloadMonthlyReportExcel: async (year, month) => {
    try {
      const response = await apiClient.get(
        `/stock/monthly/${year}-${String(month).padStart(2, '0')}/excel`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Stock_Report_${year}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      throw error;
    }
  },

  // Users (admin only)
  listUsers: () => apiClient.get('/users'),
  createUser: (username, password, role) =>
    apiClient.post('/users', { username, password, role }),
  updateUserRole: (userId, role) =>
    apiClient.patch(`/users/${userId}/role`, { role }),
  updateUserActive: (userId, active) =>
    apiClient.patch(`/users/${userId}/active`, { active }),
  resetPassword: (userId, new_password) =>
    apiClient.post(`/users/${userId}/reset-password`, { new_password }),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),
};
