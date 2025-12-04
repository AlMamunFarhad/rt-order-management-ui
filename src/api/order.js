import api from '@/api/api'

const BASE = '/orders' // your api.js already has baseURL = .../api

export default {
  index: (params = {}) => api.get(BASE, { params }),
  show: (id) => api.get(`${BASE}/${id}`),
  create: (payload) => api.post(BASE, payload),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload),
  remove: (id) => api.delete(`${BASE}/${id}`),
}
