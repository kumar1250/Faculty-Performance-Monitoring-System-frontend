import axios from 'axios';

const API = axios.create({
  baseURL: 'https://faculty-jpqu.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject your custom JWT token into every protected request header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;