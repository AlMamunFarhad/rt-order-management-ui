import { createRouter, createWebHistory } from 'vue-router'
import Register from '@/views/Register.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Products from '@/views/Products.vue'
import Orders from '@/views/Orders.vue'
import { useAuthStore } from '@/stores/auth'
import OrderForm from '@/views/OrderForm.vue'

const routes = [
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/register', component: Register, meta: { guest: true } },
  { path: '/', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/products', component: Products, meta: { requiresAuth: true } },
  {path: "/products/:id", name: "product.details", component: () => import("@/views/ProductDetails.vue"), props: true, meta: { requiresAuth: true } },
  { path: '/orders', name: 'orders', component: Orders, meta: { requiresAuth: true } },
  { path: '/orders/create', name: 'orders.create', component: OrderForm },
  { path: '/orders/:id/edit', name: 'orders.edit', component: OrderForm, props: true },
  { path: '/view-order/:id', name: 'orders.view', component: () => import('@/views/ViewOrder.vue'), props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const token = localStorage.getItem('token')
  if (!auth.user && token) {
    try {
      await auth.fetchUser()
    } catch {}
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return next('/')
  }
  next()
})

export default router
