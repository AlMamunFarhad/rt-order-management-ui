import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
}, error => Promise.reject(error))

// optional: response interceptor to catch 401 and auto-logout
api.interceptors.response.use(res => res, err => {
  if (err.response && err.response.status === 401) {
    // token invalid or expired
    localStorage.removeItem('token')
    // optionally redirect to login
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api