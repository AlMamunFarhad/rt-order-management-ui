<template>
  <div class="pt-5">
    <div
      class="container py-5 px-4 rounded-4 page-wrap"
      style="background: #fcfcfc"
    >
      <div class="d-flex justify-content-between align-items-center my-3">
        <div>
          <h2 class="mb-0">Orders</h2>
          <small class="text-muted">Manage orders</small>
        </div>

        <div class="d-flex align-items-center gap-2">
          <div class="input-group me-2" style="min-width: 240px">
            <span class="input-group-text">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M11 6a5 5 0 1 1-2-4 5 5 0 0 1 2 4z" />
                <path
                  d="M15.7 14.3 11 9.6a6 6 0 1 0-1.4 1.4l4.7 4.7a1 1 0 0 0 1.4-1.4z"
                />
              </svg>
            </span>
            <input
              v-model="q"
              @input="onSearch"
              type="text"
              class="form-control form-control-sm"
              placeholder="Search invoice, customer, product..."
            />
          </div>

          <select
            v-model="statusFilter"
            class="form-select form-select-sm me-2"
            style="width: 160px"
          >
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>

          <button
            class="btn btn-sm btn-outline-secondary me-1"
            @click="exportCSV"
            title="Export CSV"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M.5 9.9V15h15V9.9H.5zM1 10.4h14v4.2H1v-4.2zM8 0v9l2-2v5h2V0H8z"
              />
            </svg>
            <span class="ms-1 d-none d-sm-inline">Export</span>
          </button>

          <router-link
            class="btn btn-primary btn-sm shadow-sm"
            :to="{ name: 'orders.create' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M8 4a.5.5 0 0 1 .5.5V7.5H11a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V8.5H5a.5.5 0 0 1 0-1h2.5V4.5A.5.5 0 0 1 8 4z"
              />
            </svg>
            <span class="ms-1">Create Order</span>
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="p-3 text-center text-muted">Loading…</div>
      <div v-if="error" class="alert alert-danger">{{ errorMessage }}</div>

      <div v-if="!loading && list.length" class="table-responsive">
        <table class="table align-middle table-hover my-table">
          <thead>
            <tr>
              <th class="fw-semibold">Invoice</th>
              <th class="fw-semibold">Date</th>
              <th class="fw-semibold">Customer</th>
              <th class="fw-semibold text-center">Items</th>
              <th class="fw-semibold text-end">Total</th>
              <th class="fw-semibold">Status</th>
              <th class="text-end fw-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="o in paginatedList" :key="o.id" class="align-middle">
              <td>
                <div class="d-flex align-items-start gap-2">
                  <div class="invoice-bubble">{{ o.invoice_number }}</div>
                  <div class="d-none d-md-block text-muted small">
                    #{{ o.id }}
                  </div>
                </div>
              </td>

              <td class="text-nowrap small text-muted">
                {{ formatDate(o.date_time) }}
              </td>

              <td>
                <div class="fw-medium">{{ o.customer_name }}</div>
                <div class="small text-muted d-none d-md-block">
                  {{ o.customer_contact || "" }}
                </div>
              </td>

              <td class="text-center">
                <span class="badge bg-info text-dark rounded-pill px-3 py-2">
                  {{ o.products_count }} items
                </span>
              </td>

              <td class="text-end fw-semibold">
                {{ formatCurrency(o.total_amount) }}
              </td>

              <td>
                <span :class="['status-badge', statusClass(o.status)]">{{
                  o.status
                }}</span>
              </td>

              <td class="text-end">
                <div
                  class="btn-group btn-group-sm"
                  role="group"
                  aria-label="actions"
                >
                  <router-link
                    :to="{ name: 'orders.edit', params: { id: o.id } }"
                    class="btn btn-outline-primary"
                    title="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.439 1.439-2.122-2.122L13.38.523a.5.5 0 0 1 .706 0l1.416 1.417zM12.854 3.646l-2.122-2.122L3 8.256V10h1.744l8.11-6.354z"
                      />
                    </svg>
                  </router-link>

                  <button
                    class="btn btn-outline-secondary"
                    @click="viewOrder(o.id)"
                    title="View"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8z"
                      />
                      <path
                        d="M8 5.5A2.5 2.5 0 1 1 5.5 8 2.5 2.5 0 0 1 8 5.5z"
                      />
                    </svg>
                  </button>

                  <button
                    class="btn btn-outline-danger"
                    @click="confirmDelete(o.id)"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M5.5 5.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V6h1v8a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V6h1v-.5zM14.5 3a1 1 0 0 1-1 1H12v-1h-1V2a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1H4v1H2.5a1 1 0 0 1-1-1V2h13v1z"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination controls -->
        <div
          class="d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 mt-3"
        >
          <div class="d-flex align-items-center gap-2">
            <div class="small text-muted">Show</div>
            <select
              v-model.number="perPage"
              @change="onPerPageChange"
              class="form-select form-select-sm ms-1"
              style="width: 80px"
            >
              <option v-for="opt in perPageOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <div class="small text-muted ms-2">entries</div>
          </div>

          <div class="pagination-wrap d-flex align-items-center gap-2">
            <div class="small text-muted me-2 d-none d-md-block">
              {{ pageRangeText }}
            </div>

            <nav aria-label="Orders pagination">
              <ul class="pagination pagination-modern mb-0">
                <li
                  :class="['page-item', { disabled: currentPage === 1 }]"
                  @click.prevent="goToFirst"
                >
                  <button
                    class="page-link"
                    :disabled="currentPage === 1"
                    aria-label="First"
                  >
                    «
                  </button>
                </li>

                <li
                  :class="['page-item', { disabled: currentPage === 1 }]"
                  @click.prevent="prevPage"
                >
                  <button
                    class="page-link"
                    :disabled="currentPage === 1"
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                </li>

                <li
                  v-for="p in pageNumbers"
                  :key="p.key"
                  :class="[
                    'page-item',
                    { active: p.page === currentPage, disabled: p.ellipsis },
                  ]"
                  @click.prevent="!p.ellipsis && goToPage(p.page)"
                >
                  <button
                    class="page-link"
                    :aria-current="p.page === currentPage ? 'page' : null"
                    :disabled="p.ellipsis"
                  >
                    <span v-if="p.ellipsis">…</span>
                    <span v-else>{{ p.page }}</span>
                  </button>
                </li>

                <li
                  :class="[
                    'page-item',
                    {
                      disabled: currentPage === totalPages || totalPages === 0,
                    },
                  ]"
                  @click.prevent="nextPage"
                >
                  <button
                    class="page-link"
                    :disabled="currentPage === totalPages || totalPages === 0"
                    aria-label="Next"
                  >
                    ›
                  </button>
                </li>

                <li
                  :class="[
                    'page-item',
                    {
                      disabled: currentPage === totalPages || totalPages === 0,
                    },
                  ]"
                  @click.prevent="goToLast"
                >
                  <button
                    class="page-link"
                    :disabled="currentPage === totalPages || totalPages === 0"
                    aria-label="Last"
                  >
                    »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div v-if="!loading && !list.length" class="p-3 text-center text-muted">
        No orders yet.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useOrdersStore } from "@/stores/orders";
import { useRouter } from "vue-router";

const router = useRouter();
const store = useOrdersStore();

const list = computed(() => store.list || []);
const loading = computed(() => store.loading);
const error = computed(() => store.error);
const errorMessage = computed(
  () => error.value?.response?.data?.message ?? (error.value?.message || "")
);

// UI state
const q = ref("");
const statusFilter = ref(""); // "", "Pending", etc.
const debounceTimer = ref(null);

// pagination state
const currentPage = ref(1);
const perPage = ref(10);
const perPageOptions = [10, 25, 50, 100];

onMounted(() => {
  store.fetchAll().catch(() => {});
});

// when filters change, reset to first page
watch(
  [() => q.value, () => statusFilter.value, () => list.value.length],
  () => {
    currentPage.value = 1;
  }
);

// search debounce
function onSearch() {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    currentPage.value = 1;
  }, 200);
}

const filteredList = computed(() => {
  let arr = Array.from(list.value);
  if (statusFilter.value) {
    arr = arr.filter(
      (o) => (o.status || "").toLowerCase() === statusFilter.value.toLowerCase()
    );
  }
  if (q.value && q.value.trim()) {
    const s = q.value.trim().toLowerCase();
    arr = arr.filter(
      (o) =>
        (o.invoice_number || "").toLowerCase().includes(s) ||
        (o.customer_name || "").toLowerCase().includes(s) ||
        String(o.id || "")
          .toLowerCase()
          .includes(s) ||
        (o.products &&
          o.products.some((p) =>
            (p.product?.name || "").toLowerCase().includes(s)
          ))
    );
  }
  return arr;
});

// computed pagination values
const totalItems = computed(() => filteredList.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / perPage.value))
);
// ensure currentPage in bounds
watch(totalPages, (tp) => {
  if (currentPage.value > tp) currentPage.value = tp;
});

// paginated list to display
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredList.value.slice(start, start + perPage.value);
});

// page numbers with ellipsis logic
const pageNumbers = computed(() => {
  const pages = [];
  const TP = totalPages.value;
  const current = currentPage.value;
  const delta = 1; // show neighbors
  const left = Math.max(1, current - delta);
  const right = Math.min(TP, current + delta);

  // always include first
  pages.push({ page: 1, key: "p1", ellipsis: false });

  if (left > 2) {
    pages.push({ page: null, key: "e1", ellipsis: true });
  }

  for (let p = left; p <= right; p++) {
    if (p !== 1 && p !== TP)
      pages.push({ page: p, key: "p" + p, ellipsis: false });
  }

  if (right < TP - 1) {
    pages.push({ page: null, key: "e2", ellipsis: true });
  }

  if (TP > 1) pages.push({ page: TP, key: "p" + TP, ellipsis: false });

  // filter unique keys and ensure ascending order
  const unique = [];
  const seen = new Set();
  for (const it of pages) {
    if (!seen.has(it.key)) {
      unique.push(it);
      seen.add(it.key);
    }
  }
  return unique;
});

// page range text
const pageRangeText = computed(() => {
  if (!totalItems.value) return "Showing 0 items";
  const start = (currentPage.value - 1) * perPage.value + 1;
  const end = Math.min(currentPage.value * perPage.value, totalItems.value);
  return `Showing ${start}–${end} of ${totalItems.value}`;
});

// pagination controls
function goToPage(p) {
  if (!p) return;
  currentPage.value = Math.max(1, Math.min(totalPages.value, p));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function prevPage() {
  if (currentPage.value > 1) goToPage(currentPage.value - 1);
}
function nextPage() {
  if (currentPage.value < totalPages.value) goToPage(currentPage.value + 1);
}
function goToFirst() {
  goToPage(1);
}
function goToLast() {
  goToPage(totalPages.value);
}
function onPerPageChange() {
  currentPage.value = 1;
}

// formatting functions
function formatDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleString();
}
function formatCurrency(val) {
  if (val == null || val === "") return "$ 0.00";
  const num = Number(val) || 0;
  return (
    "$ " +
    num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// actions
async function confirmDelete(id) {
  if (!confirm("Are you sure you want to delete this order?")) return;
  try {
    await store.remove(id);
  } catch (e) {
    alert("Delete failed: " + (e.response?.data?.message || e.message));
  }
}

function viewOrder(id) {
  router.push({ name: "orders.view", params: { id } }).catch(() => {});
}

function statusClass(s) {
  const st = (s || "").toLowerCase();
  if (st === "pending") return "status-pending";
  if (st === "processing") return "status-processing";
  if (st === "delivered") return "status-delivered";
  if (st === "cancelled") return "status-cancelled";
  return "status-default";
}

function exportCSV() {
  const rows = filteredList.value.map((o) => ({
    id: o.id,
    invoice: o.invoice_number,
    date: formatDate(o.date_time),
    customer: o.customer_name,
    items: o.products_count ?? (o.products ? o.products.length : 0),
    total: o.total_amount,
    status: o.status,
  }));
  const header = Object.keys(rows[0] || {}).join(",");
  const csv = [
    header,
    ...rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", `orders_${Date.now()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
/* Container tweaks */
.container h2 {
  letter-spacing: -0.3px;
}
.container .small {
  opacity: 0.85;
}

/* Table card look */
.my-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* Header */
.my-table thead th {
  background: linear-gradient(
    90deg,
    rgba(250, 250, 252, 1),
    rgba(245, 247, 250, 1)
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 13px;
  color: #374151;
}

/* invoice bubble */
.invoice-bubble {
  background: linear-gradient(90deg, #f8fafc, #ffffff);
  border-left: 3px solid #0d6efd;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
}

/* status badges */
.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: capitalize;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
}

/* status color mapping */
.status-pending {
  background: #fff7e6;
  color: #92400e;
  border: 1px solid rgba(146, 64, 14, 0.08);
}
.status-processing {
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid rgba(55, 48, 163, 0.06);
}
.status-delivered {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid rgba(6, 95, 70, 0.05);
}
.status-cancelled {
  background: #fff1f2;
  color: #9f1239;
  border: 1px solid rgba(159, 18, 57, 0.05);
}
.status-default {
  background: #f8fafc;
  color: #374151;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* actions */
.btn-group .btn {
  min-width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 6px 8px;
}
.btn-outline-primary {
  border-color: rgba(13, 110, 253, 0.12);
  background: rgba(13, 110, 253, 0.03);
  color: #0d6efd;
}
.btn-outline-secondary {
  border-color: rgba(108, 117, 125, 0.06);
  color: #6c757d;
}

/* ---------- PAGINATION (modern) ---------- */
.pagination-modern {
  display: flex;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
}

.pagination-modern .page-item {
  display: inline-block;
}
.pagination-modern .page-link {
  border: none;
  background: #f3f6fb;
  color: #0f172a;
  min-width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 10px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(12, 20, 40, 0.03);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
}

.pagination-modern .page-item:hover .page-link {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(12, 20, 40, 0.06);
}

.pagination-modern .page-item.active .page-link {
  background: linear-gradient(90deg, #7d4eff 0%, #9d72ff 100%);
  color: white;
  box-shadow: 0 10px 26px rgba(125, 78, 255, 0.16);
  transform: translateY(-2px);
}

.pagination-modern .page-item.disabled .page-link {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* compact on mobile */
@media (max-width: 576px) {
  .pagination-modern .page-link {
    min-width: 30px;
    height: 30px;
    border-radius: 6px;
    font-size: 13px;
    padding: 0 8px;
  }
  .invoice-bubble {
    font-size: 13px;
    padding: 6px 10px;
  }
  .btn-group .btn {
    padding: 6px 6px;
  }
  .input-group {
    min-width: 140px !important;
  }
}

/* small helper */
.pagination-wrap {
  gap: 10px;
}

/* small page range text */
.page-range {
  font-size: 13px;
  color: #6b7280;
}

/* small spacing tweak */
.mt-3 {
  margin-top: 1rem !important;
}
</style>
