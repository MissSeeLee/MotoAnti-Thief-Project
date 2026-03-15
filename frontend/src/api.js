import axios from 'axios';

const apiClient = axios.create({
  // ✅ เปลี่ยนมาดึงค่าจาก Vercel แทน (ถ้ารันในเครื่องตัวเองให้ใช้ localhost)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api', 
  
  headers: {
    'Content-Type': 'application/json',
  }
});

// ส่วนนี้เหมือนเดิม (เอาไว้แนบ Token อัตโนมัติ)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;