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

export default apiClient;
export { baseURL };

// API methods
export const api = {
  // Descriptions
  getDescriptions: () => apiClient.get('/descriptions'),
  createDescription: (data) => apiClient.post('/descriptions', data),
  deleteDescription: (id) => apiClient.delete(`/descriptions/${id}`),

  // Colors
  getColors: () => apiClient.get('/colors'),
  createColor: (data) => apiClient.post('/colors', data),

  // Stock entries
  createStockEntry: (data) => apiClient.post('/stock', data),
  getMonthlyReport: (yearMonth) => apiClient.get(`/stock/monthly/${yearMonth}`),

  // For Excel-style report
  getMonthlyReportByYearMonth: (year, month) =>
    apiClient.get(`/stock/monthly/${year}-${String(month).padStart(2, '0')}`),

  // Master Admin: upload store list (CSV)
  uploadStoreList: (file, masterAdminKey) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = (apiClient.defaults.baseURL || '') + '/admin/upload-store-list';
    return axios.post(url, formData, {
      headers: { 'X-Master-Admin-Key': masterAdminKey },
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
};
