import { defineStore } from "pinia";
import api from "@/api/api";
import router from "@/router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
  }),

  getters: {
    // token presence -> authenticated
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    // call this on app start if there's a token
    async init() {
      if (this.token && !this.user) {
        try {
          await this.fetchUser();
        } catch (e) {
          // token invalid -> clear
          await this.logout();
        }
      }
    },

    async login(email, password) {
      this.loading = true;
      try {
        const res = await api.post("/login", { email, password }); // no trailing slash
        const token = res.data.token || res.data.access_token;

        // token save & axios header set
        this.token = token;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // user fetch (if not returned)
        this.user = res.data.user ?? (await this.fetchUser());
        this.loading = false;
        return true;
      } catch (e) {
        this.loading = false;
        throw e;
      }
    },

    async register(name, email, password, password_confirmation) {
      this.loading = true;
      try {
        const res = await api.post("/register", {
          name,
          email,
          password,
          password_confirmation,
        }); // no trailing slash
        const token = res.data.token || res.data.access_token;

        // token save & axios header set
        this.token = token;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        this.user = res.data.user ?? (await this.fetchUser());
        this.loading = false;
        return true;
      } catch (e) {
        this.loading = false;
        throw e;
      }
    },

    async fetchUser() {
      try {
        // header attach
        if (this.token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
        }

        const res = await api.get("/me");
        this.user = res.data;
        return this.user;
      } catch (e) {
        // if token invalid, clear everything
        await this.logout();
        throw e;
      }
    },

    async logout() {
      try {
        if (this.token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
          await api.post("/logout");
        }
      } catch (e) {
        console.error(e);
      } finally {
        localStorage.removeItem("token");
        this.user = null;
        this.token = null;
        delete api.defaults.headers.common["Authorization"];
        router.replace({ path: '/login', query: { t: Date.now() } })
      }
    },
  },
});
