import axios from 'axios';

// ✅ CHANGE THIS to your server PC's IP address
// Find your server IP: Open CMD and type "ipconfig"
// Look for "IPv4 Address" under your WiFi/Ethernet adapter

// For DEVELOPMENT on same PC:
// const API_BASE_URL = 'http://127.0.0.1:8000';

// For NETWORK ACCESS (Other PCs):
const API_BASE_URL = 'http://192.168.1.126:8000';

export default API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

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
