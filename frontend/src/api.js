import axios from 'axios';

const apiClient = axios.create({
  // ✅ จุดที่แก้: ตั้งเป็น '/api' เพื่อให้มันวิ่งเข้าหลังบ้านถูกต้อง
  baseURL: 'https://motoanti-thief.artip.site/api', 
  
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