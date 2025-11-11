<!-- <template>
  <div class="register-page d-flex justify-content-center align-items-center">
    <div class="register-card shadow-lg p-4 rounded-4 bg-glass w-100" style="max-width: 420px;">
      <div class="d-flex justify-content-center align-items-center">
      <div>
      <h2 class="text-center fw-bold text-gradient mb-3">Create Account ✨</h2>
      <p class="text-center text-muted mb-4">Join us — it's quick, easy, and free.</p>

      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="form-label">Full Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="John Doe"
            class="form-control form-control-lg"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="example@email.com"
            class="form-control form-control-lg"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Password</label>
          <div class="input-group">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="form-control form-control-lg"
            />
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Confirm Password</label>
          <input
            v-model="password_confirmation"
            type="password"
            placeholder="••••••••"
            class="form-control form-control-lg"
          />
        </div>

        <p v-if="error" class="text-danger text-center small">{{ error }}</p>

        <button
          type="submit"
          class="btn btn-lg w-100 text-white gradient-btn mt-2"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Creating...' : 'Register' }}
        </button>

        <p class="text-center mt-4 text-muted">
          Already have an account?
          <RouterLink to="/login" class="text-gradient fw-semibold">Login</RouterLink>
        </p>
      </form>
    </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const password_confirmation = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  try {
    loading.value = true
    await auth.register(name.value, email.value, password.value, password_confirmation.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>  -->


<template>
  <div class="register-page d-flex justify-content-center align-items-center">
    <div class="register-card shadow-lg p-4 rounded-4 bg-glass w-100" style="max-width: 420px;">
      <div>
        <h2 class="text-center fw-bold text-gradient mb-3">Create Account ✨</h2>
        <p class="text-center text-muted mb-4">Join us — it's quick, easy, and free.</p>

        <!-- General server message (non-field) -->
        <div v-if="serverMessage" class="alert alert-danger py-2">
          {{ serverMessage }}
        </div>

        <form @submit.prevent="submit" novalidate>
          <!-- Name -->
          <div class="mb-3">
            <label class="form-label">Full Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="John Doe"
              :class="['form-control', 'form-control-lg', { 'is-invalid': errors.name }]"
            />
            <div v-if="errors.name" class="invalid-feedback">
              {{ firstError(errors.name) }}
            </div>
          </div>

          <!-- Email -->
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

          <!-- Password -->
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
              <div v-if="errors.password" class="invalid-feedback d-block">
                {{ firstError(errors.password) }}
              </div>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="mb-3">
            <label class="form-label">Confirm Password</label>
            <input
              v-model="password_confirmation"
              type="password"
              placeholder="••••••••"
              :class="['form-control', 'form-control-lg', { 'is-invalid': errors.password_confirmation }]"
            />
            <div v-if="errors.password_confirmation" class="invalid-feedback">
              {{ firstError(errors.password_confirmation) }}
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-lg w-100 text-white gradient-btn mt-2"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Creating...' : 'Register' }}
          </button>

          <p class="text-center mt-4 text-muted">
            Already have an account?
            <RouterLink to="/login" class="text-gradient fw-semibold">Login</RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const password_confirmation = ref('')

const loading = ref(false)
const serverMessage = ref('')           // non-field general message
const errors = ref({})                  // { name: ['..'], email: ['..'], ... }
const showPassword = ref(false)

// helper: get first message (server may return string or array)
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
    // call your auth store (should throw axios error on 422/400)
    await auth.register(name.value, email.value, password.value, password_confirmation.value)

    // success -> redirect
    router.push('/')
  } catch (e) {
    // Axios-style error parsing
    const resp = e?.response?.data

    // 1) If Laravel validation errors: resp.errors is an object
    if (resp && resp.errors && typeof resp.errors === 'object') {
      errors.value = resp.errors
    } else if (resp && resp.message) {
      // 2) Laravel often returns message string (e.g., "The given data was invalid.")
      //    Sometimes validation messages are in resp.message and details in resp.errors (handled above).
      serverMessage.value = resp.message
      // If resp has nested errors under "data" or "error", try a couple more fallbacks
      if (resp.data && resp.data.errors) errors.value = resp.data.errors
      if (resp.error && resp.error.errors) errors.value = resp.error.errors
    } else if (e?.response?.status === 422 && e.response.data) {
      // fallback: sometimes backend returns raw object
      errors.value = e.response.data
    } else {
      // Generic fallback
      serverMessage.value = (e && e.message) ? e.message : 'Registration failed'
    }
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
/* Background gradient */
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff66b3, #a855f7, #6366f1);
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
  background: linear-gradient(90deg, #e11d7a, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Button gradient */
.gradient-btn {
  background: linear-gradient(90deg, #e11d7a, #7c3aed);
  border: none;
  transition: 0.3s;
}

.gradient-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.input-group .invalid-feedback {
  margin-top: .25rem;
  width: 100%;
}
</style>