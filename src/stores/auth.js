import { defineStore } from 'pinia'
import api from '@/api/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  actions: {
    async login(email, password) {
      this.loading = true
      try {
        const res = await api.post('/login/', { email, password })
        const token = res.data.token || res.data.access_token
        this.token = token
        localStorage.setItem('token', token)
        this.user = res.data.user ?? (await this.fetchUser())
        this.loading = false
        return true
      } catch (e) {
        this.loading = false
        throw e
      }
    },

    async register(name, email, password, password_confirmation) {
      this.loading = true
      try {
        const res = await api.post('/register/', { name, email, password, password_confirmation })
        const token = res.data.token
        localStorage.setItem('token', token)
        this.token = token
        this.user = res.data.user
        this.loading = false
        return true
      } catch (e) {
        this.loading = false
        throw e
      }
    },

    async fetchUser() {
      try {
        const res = await api.get('/me')
        this.user = res.data
        return this.user
      } catch (e) {
        this.logout()
        throw e
      }
    },

    logout() {
      localStorage.removeItem('token')
      this.user = null
      this.token = null
      // optional: notify backend
      try { api.post('/logout') } catch(e) {}
    }
  }
})
