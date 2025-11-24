<template>
  <div class="login-page d-flex align-items-center justify-content-center">
    <div class="login-card shadow-lg p-4 rounded-4 bg-glass w-100" style="max-width: 420px;">
      <h2 class="text-center fw-bold text-gradient mb-3">Welcome Back 👋</h2>
      <p class="text-center text-muted mb-4">Sign in to continue to your account</p>

      <div v-if="serverMessage" class="alert alert-danger py-2 text-center">
        {{ serverMessage }}
      </div>

      <form @submit.prevent="submit" novalidate>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="example@email.com"
            :class="['form-control', 'form-control-lg', { 'is-invalid': errors.email }]"
          />
          <div v-if="errors.email" class="invalid-feedback">
            {{ firstError(errors.email) }}
          </div>
        </div>

   
        <div class="mb-3">
          <label class="form-label">Password</label>
          <div class="input-group">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              :class="['form-control', 'form-control-lg', { 'is-invalid': errors.password }]"
            />
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
          <div v-if="errors.password" class="invalid-feedback d-block">
            {{ firstError(errors.password) }}
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-lg w-100 text-white gradient-btn mt-2"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <p class="text-center mt-4 text-muted">
          Don’t have an account?
          <RouterLink to="/register" class="text-gradient fw-semibold">Register</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const serverMessage = ref('')
const errors = ref({})
const showPassword = ref(false)

const firstError = (val) => {
  if (!val) return ''
  if (Array.isArray(val)) return val[0]
  if (typeof val === 'string') return val
  return String(val)
}

const submit = async () => {
  loading.value = true
  serverMessage.value = ''
  errors.value = {}

  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    const resp = e?.response?.data

    // Laravel validation (422)
    if (resp && resp.errors && typeof resp.errors === 'object') {
      errors.value = resp.errors
    } else if (resp && resp.message) {
      // General login error
      serverMessage.value = resp.message
    } else if (resp && resp.error) {
      serverMessage.value = resp.error
    } else {
      serverMessage.value = e.message || 'Login failed'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Background gradient */
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
  padding: 1rem;
}

/* Glassmorphism card */
.bg-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* Text gradient */
.text-gradient {
  background: linear-gradient(90deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Button gradient */
.gradient-btn {
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border: none;
  transition: 0.3s;
}

.gradient-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
