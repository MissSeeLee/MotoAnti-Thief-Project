import axios from 'axios';

const apiClient = axios.create({
  // 🔥 บังคับยิงไปที่โดเมน API หลังบ้านของเราโดยตรง!
  baseURL: 'https://api.artip.site', 
  
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