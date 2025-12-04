import { defineStore } from 'pinia'
import orderApi from '@/api/order'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    list: [],
    loading: false,
    error: null,
  }),

  getters: {
    count: (state) => state.list.length,
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await orderApi.index(params)
        // backend might return array or paginated object
        this.list = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data)
        this.loading = false
        return this.list
      } catch (e) {
        this.error = e
        this.loading = false
        throw e
      }
    },

    async getOne(id) {
      try {
        const res = await orderApi.show(id)
        return res.data
      } catch (e) {
        throw e
      }
    },

    async create(payload) {
      try {
        const res = await orderApi.create(payload)
        // refresh list
        await this.fetchAll()
        return res.data
      } catch (e) {
        throw e
      }
    },

    async update(id, payload) {
      try {
        const res = await orderApi.update(id, payload)
        await this.fetchAll()
        return res.data
      } catch (e) {
        throw e
      }
    },

    async remove(id) {
      try {
        const res = await orderApi.remove(id)
        await this.fetchAll()
        return res.data
      } catch (e) {
        throw e
      }
    },
  },
})
