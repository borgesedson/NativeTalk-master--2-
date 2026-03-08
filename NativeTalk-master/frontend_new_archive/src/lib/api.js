import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const authApi = {
    login: (email, password) => api.post('/auth/login', { email, password }).then(res => res.data),
    register: (data) => api.post('/auth/signup', data).then(res => res.data),
    getMe: () => api.get('/auth/me').then(res => res.data),
    getStreamToken: () => api.get('/chat/token').then(res => res.data),
};

// User endpoints
export const userApi = {
    getFriends: () => api.get('/users/friends').then(res => res.data),
    getRecommended: () => api.get('/users/recommended').then(res => res.data),
    getFriendRequests: () => api.get('/users/friend-requests').then(res => res.data),
    sendRequest: (userId) => api.post('/users/friend-request', { userId }).then(res => res.data),
    acceptRequest: (requestId) => api.post(`/users/friend-request/${requestId}/accept`).then(res => res.data),
};

// Group endpoints
export const groupApi = {
    getMyGroups: () => api.get('/groups/user').then(res => res.data),
    getAllGroups: () => api.get('/groups').then(res => res.data),
    getById: (id) => api.get(`/groups/${id}`).then(res => res.data),
    create: (formData) => api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
    join: (id) => api.post(`/groups/${id}/join`).then(res => res.data),
    leave: (id) => api.post(`/groups/${id}/leave`).then(res => res.data),
};

// Translation endpoints
export const translateApi = {
    translate: (text, targetUserId) => api.post('/translation/translate', { text, targetUserId }).then(res => res.data),
};

export default api;
