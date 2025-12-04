<template>
  <div class="orders-epic">
    <div class="container py-4 vh-100">
      <div class="row gx-4">
        <!-- LEFT: FORM -->
        <div class="col-12 col-lg-8">
          <div class="card rounded-12 p-4 shadow-sm">
            <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
              <div>
                <h1 class="title mb-1">{{ isEdit ? "Edit Order" : "Create Order" }}</h1>
                <div class="muted small">Fast, safe & pretty — assign stocks per item</div>
              </div>
              <div class="d-flex gap-2">
                <router-link class="btn btn-ghost" :to="{ name: 'orders' }" title="Back">
                  ← Back
                </router-link>
                <button class="btn btn-ghost" type="button" @click="addItem" title="Add item">
                  + Item
                </button>
              </div>
            </div>

            <form @submit.prevent="submit" novalidate>
              <!-- Order meta -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Invoice Number</label>
                  <input
                    v-model="form.invoice_number"
                    :readonly="isEdit"
                    class="form-control form-control-lg input-soft"
                    required
                    aria-label="Invoice Number"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Customer</label>
                  <input
                    v-model="form.customer_name"
                    class="form-control form-control-lg input-soft"
                    placeholder="Customer name or company"
                    required
                    aria-label="Customer Name"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    v-model="form.date_time_local"
                    class="form-control input-soft"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select v-model="form.status" class="form-select input-soft">
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              </div>

              <hr class="my-3" />

              <h5 class="mb-3">Items</h5>

              <!-- Items list -->
              <transition-group name="list" tag="div" class="items-list">
                <div
                  v-for="(item, idx) in form.items"
                  :key="item._uid || idx"
                  class="item-card p-3 mb-3 d-flex flex-column flex-md-row gap-3 align-items-start"
                >
                  <div class="flex-grow-1 w-100">
                    <div class="row gx-2 gy-2 align-items-end">
                      <div class="col-12 col-md">
                        <label class="form-label small">Product</label>
                        <select
                          v-model.number="item.product_id"
                          class="form-select input-soft"
                          @change="filterStocks(idx)"
                          required
                        >
                          <option value="">— choose product —</option>
                          <option v-for="p in products" :key="p.id" :value="p.id">
                            {{ p.name }} (stock: {{ getProductStock(p.id) }})
                          </option>
                        </select>
                      </div>

                      <div class="col-6 col-md-2">
                        <label class="form-label small">Qty</label>
                        <input
                          type="number"
                          v-model.number="item.quantity"
                          min="1"
                          class="form-control input-soft"
                          required
                        />
                      </div>

                      <div class="col-6 col-md-2">
                        <label class="form-label small">Unit Price</label>
                        <input
                          type="number"
                          v-model.number="item.unit_price"
                          step="0.01"
                          class="form-control input-soft"
                          required
                        />
                      </div>

                      <div class="col-12 col-md-3">
                        <label class="form-label small">Stock</label>
                        <select v-model.number="item.stock_id" class="form-select input-soft">
                          <option value="">— auto / select stock —</option>
                          <option v-for="s in (item.available_stocks || [])" :key="s.id" :value="s.id">
                            {{ s.name ?? ('#' + s.id) }} · {{ s.quantity }} available
                          </option>
                        </select>
                        <div v-if="item.available_stocks?.length === 0" class="muted tiny mt-1">
                          No stock rows yet — selecting product will fetch stocks.
                        </div>
                      </div>
                    </div>

                    <!-- item meta row -->
                    <div class="d-flex justify-content-between align-items-center mt-2 gap-2 flex-column flex-md-row">
                      <div class="small text-muted">
                        <span v-if="item.product_id">Product ID: {{ item.product_id }}</span>
                        <span v-else>—</span>
                        <span class="mx-2">•</span>
                        <span>Subtotal: <strong>{{ formatCurrency(item.quantity * item.unit_price) }}</strong></span>
                      </div>

                      <div class="d-flex align-items-center gap-2">
                        <div v-if="stockShortage(idx)" class="chip danger">
                          ⚠️ shortage ({{ selectedStockQty(idx) }})
                        </div>

                        <button type="button" class="btn btn-sm btn-secondary btn-pill" @click="duplicateItem(idx)" title="Duplicate item">
                          ⧉
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-pill" @click="removeItem(idx)" title="Remove item">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </transition-group>

              <!-- info & add controls -->
              <div class="d-flex justify-content-between align-items-center mt-3 gap-3 flex-column flex-md-row">
                <div class="muted small">You can choose stocks per item. FIFO will be used server-side if no stock selected.</div>
                <div>
                  <button type="button" class="fab-add btn btn-gradient" @click="addItem" title="Add item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>
                    <span class="ms-2 d-none d-md-inline">Add Item</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- RIGHT: Summary & Actions -->
        <div class="col-12 col-lg-4">
          <div class="sticky-summary card rounded-12 p-3 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div>
                <div class="muted small">Order summary</div>
                <div class="h5 mb-0">{{ form.items.length }} items</div>
              </div>
              <div class="text-end">
                <div class="muted small">Invoice</div>
                <div class="fw-semibold">{{ form.invoice_number }}</div>
              </div>
            </div>

            <hr />

            <div class="summary-list mb-3">
              <div v-for="(it, i) in form.items" :key="i" class="d-flex justify-content-between align-items-center mb-2 small">
                <div class="truncate">{{ productName(it.product_id) || '— product' }}</div>
                <div class="text-muted">{{ it.quantity }} × {{ formatCurrency(it.unit_price) }}</div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="muted">Subtotal</div>
              <div class="fw-semibold">{{ formatCurrency(subtotal) }}</div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="muted">Tax (0%)</div>
              <div class="fw-semibold">৳ 0.00</div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="muted">Total</div>
              <div class="display-total">{{ formatCurrency(subtotal) }}</div>
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-primary btn-lg btn-hero" @click="submit" :disabled="saving">
                <svg width="16" height="16" viewBox="0 0 16 16" class="me-2"><path d="M2 10h12M6 6h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ saving ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order') }}
              </button>

              <router-link class="btn btn-outline-secondary btn-lg" :to="{ name: 'orders' }">Cancel</router-link>

              <button v-if="canPreview" class="btn btn-sm btn-outline-info" @click="previewInvoice">Preview Invoice</button>
            </div>
          </div>
        </div>
      </div>

      <!-- FAB mobile -->
      <button class="floating-add d-md-none" @click="addItem" title="Add item">
        ＋
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrdersStore } from "@/stores/orders";
import api from "@/api/api";

const route = useRoute();
const router = useRouter();
const orders = useOrdersStore();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);

const products = ref([]);
const allStocks = ref([]);

function emptyItem() {
  return {
    order_product_id: null,
    product_id: null,
    quantity: 1,
    unit_price: 0,
    stock_id: null,
    available_stocks: [],
    // internal UID for transition-group stability
    _uid: Math.random().toString(36).slice(2, 9),
  };
}

const form = ref({
  invoice_number: "",
  customer_name: "",
  date_time_local: "",
  status: "Pending",
  items: [emptyItem()],
});

const canPreview = ref(false);

const subtotal = computed(() => {
  return form.value.items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
});

// small helper to show product name in summary
function productName(productId) {
  const p = products.value.find(x => Number(x.id) === Number(productId));
  return p ? p.name : null;
}

const submitLabel = computed(() => (isEdit.value ? "Update Order" : "Create Order"));

// load initial data
onMounted(async () => {
  await loadProducts();
  await loadStocks();
  if (isEdit.value) {
    await loadOrder(route.params.id);
  } else {
    form.value.invoice_number = `INV-${Date.now()}`;
    form.value.date_time_local = toLocalDateTime(new Date());
  }
});

async function loadProducts() {
  try {
    const res = await api.get("/products");
    products.value = Array.isArray(res.data) ? res.data : res.data.data ?? res.data;
  } catch (e) {
    console.error("Failed to load products", e);
  }
}

async function loadStocks() {
  try {
    const res = await api.get("/stocks");
    allStocks.value = Array.isArray(res.data) ? res.data : res.data.data ?? res.data;
  } catch (e) {
    allStocks.value = [];
    console.warn("Failed to preload stocks:", e);
  }
}

function filterStocks(idx) {
  const item = form.value.items[idx];
  if (!item || !item.product_id) {
    if (item) {
      item.available_stocks = [];
      item.stock_id = null;
    }
    return;
  }

  const pid = Number(item.product_id);
  const matches = allStocks.value.filter((s) => Number(s.product_id) === pid);

  if (!matches.length) {
    api.get("/stocks", { params: { product_id: pid } })
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : res.data.data ?? res.data;
        item.available_stocks = arr;
        item.stock_id = arr[0]?.id ?? null;
        allStocks.value = [...allStocks.value, ...arr.filter(a => !allStocks.value.find(s => s.id === a.id))];
      })
      .catch(() => {
        item.available_stocks = [];
        item.stock_id = null;
      });
  } else {
    item.available_stocks = matches;
    item.stock_id = matches[0]?.id ?? null;
  }
}

function getStocks(productId) {
  if (!productId) return [];
  return allStocks.value.filter((s) => Number(s.product_id) === Number(productId));
}

function getProductStock(productId) {
  const stocks = getStocks(productId);
  if (!stocks.length) return 0;
  return stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
}

function toLocalDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function fromLocalDateTimeToBackend(val) {
  if (!val) return null;
  return val.replace("T", " ") + ":00";
}

async function loadOrder(id) {
  try {
    const res = await api.get(`/orders/${id}`);
    const o = res.data;

    form.value.invoice_number = o.invoice_number;
    form.value.customer_name = o.customer_name;
    form.value.status = o.status;
    form.value.date_time_local = o.date_time ? toLocalDateTime(new Date(o.date_time)) : toLocalDateTime(new Date());

    form.value.items = (o.products ?? []).map((p) => ({
      order_product_id: p.id ?? null,
      product_id: p.product_id != null ? Number(p.product_id) : null,
      quantity: p.quantity != null ? Number(p.quantity) : 1,
      unit_price: p.unit_price != null ? Number(p.unit_price) : 0,
      stock_id: p.stock_id != null ? Number(p.stock_id) : null,
      available_stocks: [],
      _uid: Math.random().toString(36).slice(2,9),
    }));

    for (let i = 0; i < form.value.items.length; i++) {
      const it = form.value.items[i];
      const cached = getStocks(it.product_id);
      if (cached.length) {
        it.available_stocks = cached;
        const still = it.available_stocks.find(s => s.id === it.stock_id);
        if (!still) it.stock_id = it.available_stocks[0]?.id ?? null;
      } else if (it.product_id) {
        try {
          const r = await api.get("/stocks", { params: { product_id: it.product_id } });
          const arr = Array.isArray(r.data) ? r.data : r.data.data ?? r.data;
          it.available_stocks = arr;
          it.stock_id = arr.find(s => s.id === it.stock_id)?.id ?? arr[0]?.id ?? null;
          allStocks.value = [...allStocks.value, ...arr.filter(a => !allStocks.value.find(s => s.id === a.id))];
        } catch (e) {
          it.available_stocks = [];
        }
      }
    }
  } catch (e) {
    alert("Failed to load order: " + (e.response?.data?.message || e.message));
    router.push({ name: "orders" });
  }
}

function addItem() {
  form.value.items.push(emptyItem());
  // allow preview/save immediately
  canPreview.value = true;
}

function removeItem(i) {
  form.value.items.splice(i, 1);
  if (!form.value.items.length) form.value.items.push(emptyItem());
}

function duplicateItem(i) {
  const it = form.value.items[i];
  form.value.items.splice(i + 1, 0, {
    ...JSON.parse(JSON.stringify(it)),
    _uid: Math.random().toString(36).slice(2,9),
  });
}

function selectedStockQty(idx) {
  const it = form.value.items[idx];
  if (!it) return 0;
  const s = (it.available_stocks || []).find(x => x.id === it.stock_id);
  return s ? Number(s.quantity || 0) : 0;
}
function stockShortage(idx) {
  const it = form.value.items[idx];
  if (!it) return false;
  if (!it.stock_id) return false;
  return Number(it.quantity || 0) > selectedStockQty(idx);
}

function validateItems() {
  for (let i = 0; i < form.value.items.length; i++) {
    const it = form.value.items[i];
    if (!it.product_id) {
      alert(`Item ${i + 1}: Product not selected`);
      return false;
    }
    if (!it.quantity || Number(it.quantity) <= 0) {
      alert(`Item ${i + 1}: Quantity must be at least 1`);
      return false;
    }
    if (it.unit_price == null || Number(it.unit_price) < 0) {
      alert(`Item ${i + 1}: Unit Price invalid`);
      return false;
    }
    if (it.stock_id && Number(it.quantity || 0) > selectedStockQty(i)) {
      if (!confirm(`Item ${i + 1} quantity exceeds selected stock. Continue?`)) return false;
    }
  }
  return true;
}

async function submit() {
  if (!validateItems()) return;

  saving.value = true;
  try {
    const payload = {
      invoice_number: form.value.invoice_number,
      customer_name: form.value.customer_name,
      date_time: fromLocalDateTimeToBackend(form.value.date_time_local),
      status: form.value.status,
      items: form.value.items.map((i) => ({
        order_product_id: i.order_product_id ?? undefined,
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        stock_id: i.stock_id != null ? Number(i.stock_id) : undefined,
      })),
    };

    if (isEdit.value) {
      await orders.update(route.params.id, payload);
    } else {
      await orders.create(payload);
    }
    router.push({ name: "orders" });
  } catch (e) {
    alert("Save failed: " + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
}

function formatCurrency(val) {
  const n = Number(val || 0);
  return '$ ' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function previewInvoice() {
  alert("Preview not implemented. You can implement invoice preview routing/modal.");
}
</script>
<style scoped>
/* ---------- Layout ---------- */
.order-wrapper {
  max-width: 850px;
  margin: 30px auto;
  padding: 25px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
  border: 1px solid #eef0f4;
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ---------- Headings ---------- */
.order-wrapper h2 {
  font-weight: 700;
  color: #222;
  margin-bottom: 18px;
}

.order-wrapper h4 {
  font-weight: 600;
  color: #374151;
  margin-top: 25px !important;
}

/* ---------- Form Controls ---------- */
.form-control,
.form-select {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #d6d9e0;
  transition: all .2s;
}

.form-control:focus,
.form-select:focus {
  border-color: #9b57ff;
  box-shadow: 0 0 0 .15rem rgba(155, 87, 255, 0.25);
}

label.form-label {
  font-weight: 600;
  color: #444;
}

/* ---------- Item rows ---------- */
.item-row {
  background: #fafbff;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #ededf5;
  margin-bottom: 12px;
  transition: .2s;
}

.item-row:hover {
  background: #f3f1ff;
  border-color: #d4c8ff;
}

/* ---------- Buttons ---------- */
/* MAIN submit button */
.btn-primary {
  background: linear-gradient(135deg, #7d4eff 0%, #9d72ff 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 10px;
  transition: all .2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(125, 78, 255, 0.35);
}

/* Secondary button */
.btn-secondary {
  background: #f1f3f7;
  color: #333;
  border-radius: 10px;
  padding: 8px 20px;
  font-weight: 500;
  border: 1px solid #d7dbe6;
}

.btn-secondary:hover {
  background: #e4e7ee;
  border-color: #c5c9d4;
}

/* Add Item button */
.btn-add {
  background: #e3e0ff;
  color: #5c3aff;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid #c8c2ff;
  padding: 6px 14px;
}

.btn-add:hover {
  background: #d2ccff;
  border-color: #b3abff;
}

/* Remove button */
.btn-outline-danger {
  border-radius: 10px !important;
  font-weight: 600;
  padding: 6px 14px;
  transition: .2s;
}

.btn-outline-danger:hover {
  background: #ffdee1;
  border-color: #ff9aa2;
}

/* ---------- Total text ---------- */
.total-box {
  font-size: 18px;
  font-weight: 700;
  color: #2d2c38;
  background: #f6f6ff;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e0e0ff;
  width: fit-content;
  margin-bottom: 18px;
}

/* ---------- Back button style ---------- */
.router-back {
  margin-left: 8px;
}
</style>
