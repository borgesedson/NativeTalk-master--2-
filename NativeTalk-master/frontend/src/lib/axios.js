import axios from "axios";

// ✅ GARANTIR URL CORRETA EM PRODUÇÃO
// ✅ GARANTIR URL CORRETA
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log('🔗 Axios Base URL:', API_BASE_URL);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

// ✅ INTERCEPTORS PARA DEBUG
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔗 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Response Error: ${error.response?.status} from ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);
