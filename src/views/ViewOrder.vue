<template>
  <div class="container py-5 px-4 rounded-4 page-wrap" style="background: #fcfcfc;">
    <div class="d-flex justify-content-between align-items-start my-3 gap-3 flex-wrap">
      <div>
        <h2 class="mb-0">Order — <span class="text-muted small">#{{ order?.invoice_number ?? order?.id }}</span></h2>
        <small class="text-muted">Order details & actions</small>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-sm btn-outline-secondary" @click="printOrder" title="Print" :disabled="!order">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h-1v3H3v-3H2V7z"/></svg>
          <span class="ms-1 d-none d-sm-inline">Print</span>
        </button>

        <router-link v-if="order" :to="{ name: 'orders.edit', params: { id: order.id } }" class="btn btn-primary btn-sm">
          Edit
        </router-link>

        <button class="btn btn-danger btn-sm" @click="confirmDelete" :disabled="!order">Delete</button>
      </div>
    </div>

    <div v-if="loading" class="p-3 text-center text-muted">Loading…</div>
    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div v-if="order && !loading" class="row g-3">
      <!-- Left: order summary -->
      <div class="col-12 col-lg-4">
        <div class="card p-3 shadow-sm">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="invoice-bubble mb-2">{{ order.invoice_number }}</div>
              <div class="small text-muted">{{ formatDate(order.date_time ?? order.created_at) }}</div>
            </div>

            <div>
              <span :class="['status-badge', statusClass(order.status)]">{{ order.status }}</span>
            </div>
          </div>

          <hr/>

          <div>
            <h6 class="mb-1">Customer</h6>
            <div class="fw-medium">{{ order.customer_name ?? (order.customer?.name ?? '-') }}</div>
            <div class="small text-muted">{{ order.customer?.contact ?? '' }}</div>
            <div class="small text-muted mt-2">{{ order.customer?.address ?? '' }}</div>
          </div>

          <hr/>

          <div class="d-flex justify-content-between">
            <div class="small text-muted">Items</div>
            <div class="fw-semibold">{{ (order.products?.length ?? order.products_count) }} items</div>
          </div>

          <div class="d-flex justify-content-between mt-1">
            <div class="small text-muted">Subtotal</div>
            <div class="fw-semibold">{{ formatCurrency(order.sub_total ?? order.subtotal ?? computeSubTotal()) }}</div>
          </div>

          <div class="d-flex justify-content-between mt-1">
            <div class="small text-muted">Tax</div>
            <div class="fw-semibold">{{ formatCurrency(order.tax ?? 0) }}</div>
          </div>

          <div class="d-flex justify-content-between mt-1">
            <div class="small text-muted">Discount</div>
            <div class="fw-semibold">- {{ formatCurrency(order.discount ?? 0) }}</div>
          </div>

          <hr/>

          <div class="d-flex justify-content-between fs-5">
            <div class="fw-bold">Total</div>
            <div class="fw-bold">{{ formatCurrency(order.total_amount ?? order.total ?? computeTotal()) }}</div>
          </div>

          <div class="mt-3">
            <label class="form-label small mb-1">Change status</label>
            <select v-model="statusPending" class="form-select form-select-sm">
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-sm btn-primary" @click="changeStatus" :disabled="statusPending === order.status">Update</button>
              <button class="btn btn-sm btn-outline-secondary" @click="restoreStatus">Reset</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: products table -->
      <div class="col-12 col-lg-8">
        <div class="card p-0 shadow-sm overflow-hidden">
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="text-center">Qty</th>
                  <th class="text-end">Unit</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!(order.products && order.products.length)" class="text-center">
                  <td colspan="4" class="text-muted">No products</td>
                </tr>

                <tr v-for="p in order.products || []" :key="p.id">
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img v-if="p.product?.image" :src="p.product.image" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px" />
                      <div>
                        <div class="fw-medium">{{ p.product?.name ?? p.name ?? 'Unnamed product' }}</div>
                        <div class="small text-muted">{{ p.product?.sku ?? p.product?.barcode ?? '' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-center">{{ p.quantity }}</td>
                  <td class="text-end">{{ formatCurrency(p.unit_price ?? p.unitPrice ?? p.price) }}</td>
                  <td class="text-end fw-semibold">{{ formatCurrency(p.total_price ?? p.subtotal ?? (Number(p.quantity || 0) * Number(p.unit_price || p.unitPrice || 0))) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="p-3 border-top">
            <div class="small text-muted">Notes</div>
            <div class="mt-2">{{ order.order_notes ?? order.notes ?? 'No notes' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && !order" class="p-3 text-center text-muted">Order not found.</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/api'

const route = useRoute()
const router = useRouter()
const store = useOrdersStore()

const order = ref(null)
const loading = ref(false)
const error = ref(null)
const statusPending = ref('Pending')

// derive route id reactively
const id = computed(() => route.params.id)

// helpful computed error message
const errorMessage = computed(() => {
  const e = error.value
  if (!e) return ''
  if (e?.response) return `Server: ${e.response.status} — ${e.response.data?.message ?? JSON.stringify(e.response.data)}`
  return e.message || String(e)
})

// load function 
async function loadOrder(currentId) {
  if (!currentId) {
    order.value = null
    return
  }

  loading.value = true
  error.value = null
  try {
    const res = await store.getOne(currentId)
    order.value = res?.data ?? res ?? null
    if (order.value && order.value.data) {
      order.value = order.value.data
    }
    if (order.value) {
      statusPending.value = order.value.status ?? 'Pending'
    }
  } catch (e) {
    console.error('loadOrder error', e)
    error.value = e
    order.value = null
  } finally {
    loading.value = false
  }
}

// compute subtotal/total if fields missing
function computeSubTotal() {
  if (!order.value?.products) return 0
  return order.value.products.reduce((s, p) => s + (Number(p.unit_price ?? p.unitPrice ?? 0) * Number(p.quantity ?? 0)), 0)
}
function computeTotal() {
  const s = computeSubTotal()
  const tax = Number(order.value?.tax ?? 0)
  const discount = Number(order.value?.discount ?? 0)
  return s + tax - discount
}

// lifecycle + watch route change
onMounted(() => loadOrder(id.value))
watch(id, (v, ov) => {
  if (v && v !== ov) loadOrder(v)
})

// formatting helpers
function formatDate(dt) {
  if (!dt) return '-'
  const d = new Date(dt)
  if (isNaN(d)) return dt
  return d.toLocaleString()
}
function formatCurrency(val) {
  if (val == null || val === '') return '$ 0.00'
  const num = Number(val) || 0
  return '$ ' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function statusClass(s) {
  const st = (s || '').toLowerCase()
  if (st === 'pending') return 'status-pending'
  if (st === 'processing') return 'status-processing'
  if (st === 'delivered') return 'status-delivered'
  if (st === 'cancelled') return 'status-cancelled'
  return 'status-default'
}


async function changeStatus() {
  try {
   const res = await api.put(`/orders/${order.value.id}/status`, { status: statusPending.value })
        order.value.status = res.data.status
  } catch (e) {
    console.error(e)
    alert("Error: " + (e.response?.data?.message || e.message))
  }
}

function restoreStatus() {
  if (!order.value) return
  statusPending.value = order.value.status ?? 'Pending'
}

async function confirmDelete() {
  if (!order.value) return
  if (!confirm('Are you sure you want to delete this order?')) return
  try {
    await store.remove(order.value.id)
    // after delete go back to list
    router.push({ name: 'orders' })
  } catch (e) {
    console.error(e)
    alert('Delete failed: ' + (e.response?.data?.message || e.message))
  }
}

function printOrder() {
  if (!order.value) return
  const html = `
    <html>
      <head>
        <title>Invoice ${order.value.invoice_number}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color: #111; }
          pre { white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <h2>Invoice: ${order.value.invoice_number}</h2>
        <pre>${JSON.stringify(order.value, null, 2)}</pre>
      </body>
    </html>
  `
  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.print()
}
</script>

<style scoped>
/* reuse list styles - badge, invoice bubble, etc. */
.invoice-bubble {
  background: linear-gradient(90deg, #f8fafc, #ffffff);
  border-left: 3px solid #0d6efd;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
}
.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: capitalize;
  box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset;
}
.status-pending { background: #fff7e6; color: #92400e; border: 1px solid rgba(146,64,14,0.08) }
.status-processing { background: #eef2ff; color: #3730a3; border: 1px solid rgba(55,48,163,0.06) }
.status-delivered { background: #ecfdf5; color: #065f46; border: 1px solid rgba(6,95,70,0.05) }
.status-cancelled { background: #fff1f2; color: #9f1239; border: 1px solid rgba(159,18,57,0.05) }
.card { border-radius: 12px; }
</style>
