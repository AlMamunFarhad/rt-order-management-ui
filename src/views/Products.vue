<template>
  <div class="container my-5 bg-light p-4 rounded shadow-sm">
    <div>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <!-- Search bar -->
        <div class="input-group mb-3" style="max-width: 520px">
          <span
            class="input-group-text bg-white border-end-0"
            id="search-addon"
            style="
              border-top-left-radius: 999px;
              border-bottom-left-radius: 999px;
            "
          >
            <i class="bi bi-search"></i>
          </span>
          <input
            v-model="searchTerm"
            @input="onSearchInput"
            type="search"
            class="form-control shadow-sm border-start-0"
            placeholder="Search products by name, barcode or SKU..."
            aria-label="Search"
            aria-describedby="search-addon"
            style="
              border-top-right-radius: 999px;
              border-bottom-right-radius: 999px;
            "
          />
          <button
            v-if="searchTerm"
            class="btn btn-outline-secondary ms-2"
            @click="clearSearch"
            title="Clear"
          >
            ✖
          </button>

          <div v-if="searching" class="ms-2 d-flex align-items-center">
            <div
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></div>
          </div>
        </div>
        <button class="btn btn-light border-secondary" @click="openAddProduct">
          ➕ Add Product
        </button>
      </div>
      <h2 class="fw-bold mb-4">Products</h2>
      <div class="table-responsive shadow-sm rounded">
        <table class="table table-hover table-striped align-middle mb-0">
          <thead class="table-secondary">
            <tr>
              <th scope="col">Product Name</th>
              <th scope="col">Barcode</th>
              <th scope="col">SKU</th>
              <th scope="col">Purchase Price</th>
              <th scope="col">Sale Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Received Date</th>
              <th scope="col" class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="products.length === 0">
              <td colspan="8" class="text-center text-secondary py-3">
                No products found.
              </td>
            </tr>

            <template v-for="p in products" :key="p.id">
              <tr
                v-for="(s, idx) in p.stocks"
                :key="s.id"
                :class="{ 'border-top': idx === 0 }"
              >
                <td class="fw-medium text-dark">{{ p.name }}</td>
                <td class="text-muted">{{ p.barcode }}</td>
                <td class="text-muted">{{ s.sku }}</td>
                <td class="text-muted">{{ s.purchase_price }}</td>
                <td class="text-muted">{{ s.sale_price }}</td>
                <td class="text-muted">{{ s.quantity }}</td>
                <td class="text-muted">
                  {{
                    new Date(s.received_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  }}
                </td>
                <td class="text-center">
                  <!-- pass the whole product object p (not p.id) -->
                   <div class="d-flex mb-2 me-3 justify-content-end">
                  <button
                    class="btn btn-sm btn-warning me-2"
                    @click="openEdit(p)"
                    title="Edit Product"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="deleteProduct(p.id)"
                    title="Delete Product"
                  >
                    🗑 Delete
                  </button>
                  </div>
                  <button
                    class="view-details-btn"
                    @click="goToDetails(p.id)"
                  >
                    <i class="fa fa-eye me-1"></i>
                    View Details
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p v-if="error" class="text-danger fw-medium mt-3">{{ error }}</p>
      <!-- Pagination -->
      <nav v-if="pagination.last_page > 1" aria-label="Products Pagination">
        <ul class="pagination justify-content-center mt-4">
          <li
            class="page-item"
            :class="{ disabled: pagination.current_page === 1 }"
          >
            <button
              class="page-link"
              @click="goToPage(pagination.current_page - 1)"
            >
              Previous
            </button>
          </li>

          <li
            class="page-item"
            v-for="page in pagination.last_page"
            :key="page"
            :class="{ active: page === pagination.current_page }"
          >
            <button class="page-link" @click="goToPage(page)">
              {{ page }}
            </button>
          </li>

          <li
            class="page-item"
            :class="{
              disabled: pagination.current_page === pagination.last_page,
            }"
          >
            <button
              class="page-link"
              @click="goToPage(pagination.current_page + 1)"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
      <!-- End Pagination -->
    </div>

    <!-- modal -->
    <div
      class="modal fade"
      tabindex="-1"
      role="dialog"
      ref="modalEl"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header p-0 border-0">
            <div
              class="w-100 d-flex align-items-center"
              style="
                background: linear-gradient(90deg, #ff4500, #ffa62b);
                padding: 18px 20px;
              "
            >
              <div class="me-3">
                <div
                  class="avatar rounded-circle bg-white d-flex align-items-center justify-content-center"
                  style="width: 48px; height: 48px"
                >
                  <span style="font-size: 20px">➕</span>
                </div>
              </div>
              <div class="text-white">
                <h5 class="mb-0">
                  {{ isEdit ? "Edit Product" : "Add New Product" }}
                </h5>
                <small class="opacity-75">{{
                  isEdit
                    ? "Update product + stock"
                    : "Create product + initial stock"
                }}</small>
              </div>
              <button
                type="button"
                class="btn-close btn-close-white ms-auto"
                aria-label="Close"
                @click="closeModal"
              ></button>
            </div>
          </div>

          <div class="modal-body">
            <form @submit.prevent="submitProduct">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="form-floating">
                    <input
                      v-model="form.name"
                      type="text"
                      class="form-control"
                      id="name"
                      placeholder="Product name"
                    />
                    <label for="name">Product Name</label>
                  </div>
                  <small v-if="errors.name" class="text-danger">{{
                    errors.name
                  }}</small>
                </div>

                <div class="col-md-6">
                  <div class="form-floating">
                    <input
                      v-model="form.barcode"
                      type="text"
                      class="form-control"
                      id="barcode"
                      placeholder="Barcode"
                    />
                    <label for="barcode">Barcode</label>
                  </div>
                  <small v-if="errors.barcode" class="text-danger">{{
                    errors.barcode
                  }}</small>
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input
                      v-model="form.sku"
                      type="text"
                      class="form-control"
                      id="sku"
                      placeholder="SKU"
                    />
                    <label for="sku">SKU</label>
                  </div>
                  <small
                    v-if="errors['stocks.0.sku'] || errors.sku"
                    class="text-danger"
                    >{{ errors["stocks.0.sku"] || errors.sku }}</small
                  >
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input
                      v-model="form.purchase_price"
                      type="number"
                      step="0.01"
                      class="form-control"
                      id="purchase_price"
                      placeholder="Purchase price"
                    />
                    <label for="purchase_price">Purchase Price</label>
                  </div>
                  <small
                    v-if="errors['stocks.0.purchase_price']"
                    class="text-danger"
                    >{{ errors["stocks.0.purchase_price"] }}</small
                  >
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input
                      v-model="form.sale_price"
                      type="number"
                      step="0.01"
                      class="form-control"
                      id="sale_price"
                      placeholder="Sale price"
                    />
                    <label for="sale_price">Sale Price</label>
                  </div>
                  <small
                    v-if="errors['stocks.0.sale_price']"
                    class="text-danger"
                    >{{ errors["stocks.0.sale_price"] }}</small
                  >
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input
                      v-model="form.quantity"
                      type="number"
                      step="1"
                      class="form-control"
                      id="quantity"
                      placeholder="Quantity"
                    />
                    <label for="quantity">Quantity</label>
                  </div>
                  <small
                    v-if="errors['stocks.0.quantity']"
                    class="text-danger"
                    >{{ errors["stocks.0.quantity"] }}</small
                  >
                </div>

                <div class="col-md-8">
                  <label class="form-label">Received At</label>
                  <input
                    v-model="form.received_at"
                    type="datetime-local"
                    class="form-control"
                  />
                  <small
                    v-if="errors['stocks.0.received_at']"
                    class="text-danger"
                    >{{ errors["stocks.0.received_at"] }}</small
                  >
                </div>

                <div class="col-12">
                  <div class="form-floating">
                    <textarea
                      v-model="form.description"
                      class="form-control"
                      placeholder="Description"
                      id="description"
                      style="height: 80px"
                    ></textarea>
                    <label for="description">Description (optional)</label>
                  </div>
                </div>
              </div>

              <div class="mt-4 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  class="btn btn-light"
                  @click="closeModal"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn"
                  :disabled="submitting"
                  style="
                    background: linear-gradient(90deg, #ff4500, #ffa62b);
                    color: #fff;
                  "
                >
                  <span
                    v-if="submitting"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ isEdit ? "Update product" : "Save product" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from "vue";
import Modal from "bootstrap/js/dist/modal";
import api from "@/api/api";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
const router = useRouter();


// Products list
const products = ref([]);
const error = ref(null);

// pagination
const pagination = reactive({
  current_page: 1,
  last_page: 1,
});
const perPage = 10;
const goToPage = (page) => {
  if (page >= 1 && page <= pagination.last_page) {
    fetchProducts(page);
  }
};

const goToDetails = (id) => {
  if (!id) {
    console.error("Product ID missing");
    return;
  }
  router.push(`/products/${id}`);
};

// Search state
const searchTerm = ref("");
const searching = ref(false);

// Fetch all products (initial load)
const fetchProducts = async (page = 1) => {
  error.value = null;
  searching.value = true;
  try {
    const res = await api.get("/products", {
      params: { page, q: searchTerm.value },
    });
    products.value = res.data.data || [];
    pagination.current_page = res.data.current_page;
    pagination.last_page = res.data.last_page;
  } catch (e) {
    error.value =
      e.response?.data?.message || e.message || "Failed to fetch products";
    products.value = [];
  } finally {
    searching.value = false;
  }
};

// On mounted, load products
onMounted(fetchProducts);

// --- Search methods ---
const onSearchInput = async () => {
  searching.value = true;
  try {
    const res = await api.get("/products/search", {
      params: { q: searchTerm.value },
    });
    products.value = res.data.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || e.message || "Search failed";
  } finally {
    searching.value = false;
  }
};

const clearSearch = async () => {
  searchTerm.value = "";
  await fetchProducts();
};

// -------------------
// Modal & Form State (existing code)
const modalEl = ref(null);
let bsModal = null;

onMounted(() => {
  if (modalEl.value) bsModal = new Modal(modalEl.value);
});

// form reactive
const form = reactive({
  name: "",
  barcode: "",
  sku: "",
  purchase_price: "",
  sale_price: "",
  quantity: "",
  received_at: "",
  description: "",
});

// validation errors
const errors = reactive({});
const submitting = ref(false);

// edit state
const isEdit = ref(false);
const editId = ref(null);
const editingStockId = ref(null);

const resetForm = () => {
  form.name = "";
  form.barcode = "";
  form.sku = "";
  form.purchase_price = "";
  form.sale_price = "";
  form.quantity = "";
  form.received_at = "";
  form.description = "";
  for (const k in errors) delete errors[k];
  submitting.value = false;
  isEdit.value = false;
  editId.value = null;
  editingStockId.value = null;
};

// convert backend datetime to datetime-local
function toDatetimeLocal(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

// convert datetime-local to DB datetime
function toDbDatetime(datetimeLocal) {
  if (!datetimeLocal) return null;
  return datetimeLocal.replace("T", " ") + ":00";
}

// --- Open modal for create/edit ---
const openAddProduct = async () => {
  resetForm();
  await nextTick();
  if (bsModal) bsModal.show();
};
// --- Create / Update methods ---
const submitProduct = async () => {
  submitting.value = true;
  for (const k in errors) delete errors[k];

  try {
    const payload = {
      name: form.name,
      barcode: form.barcode,
      description: form.description,
      sku: form.sku,
      purchase_price: form.purchase_price,
      sale_price: form.sale_price,
      quantity: form.quantity,
      received_at: toDbDatetime(form.received_at),
    };

    let res;

    if (isEdit.value && editId.value) {
      // UPDATE Product
      res = await api.put(`/products/${editId.value}`, payload);
      toast.info("✏️ Product updated successfully!");
    } else {
      // CREATE Product
      res = await api.post("/products/store", payload);
      toast.success("🎉 Product added successfully!");
    }

    closeModal();
    await fetchProducts();
  } catch (e) {
    if (e.response?.status === 422) {
      Object.assign(errors, e.response.data.errors);
    }
  } finally {
    submitting.value = false;
  }
};

const openEdit = async (item) => {
  for (const k in errors) delete errors[k];
  isEdit.value = true;
  editId.value = item.id ?? null;

  form.name = item.name ?? "";
  form.barcode = item.barcode ?? "";
  form.description = item.description ?? "";

  const s = item.stocks && item.stocks.length ? item.stocks[0] : null;

  if (s) {
    editingStockId.value = s.id ?? null;
    form.sku = s.sku ?? "";
    form.purchase_price = s.purchase_price ?? "";
    form.sale_price = s.sale_price ?? "";
    form.quantity = s.quantity ?? "";
    form.received_at = s.received_at ? toDatetimeLocal(s.received_at) : "";
  } else {
    editingStockId.value = null;
    form.sku = "";
    form.purchase_price = "";
    form.sale_price = "";
    form.quantity = "";
    form.received_at = "";
  }

  await nextTick();
  if (bsModal) bsModal.show();
};

const closeModal = () => {
  if (bsModal) bsModal.hide();
};

// --- Submit / Delete methods (copy your existing code) ---

const deleteProduct = async (id) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    await api.delete(`/products/${id}`);
    await fetchProducts();
    toast.error("🗑️ Product deleted successfully!");
  } catch (e) {
    alert(e.response?.data?.message || "Delete failed");
  }
};
</script>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #f0f8ff !important;
  transition: background-color 0.2s ease-in-out;
}

.btn-sm {
  padding: 0.25rem 0.6rem;
  font-size: 0.875rem;
}

.shadow-sm {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
}

h2 {
  letter-spacing: 0.5px;
}

/* small polish for the avatar in header */
.avatar {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
.modal-content {
  border-radius: 0.75rem;
}
.view-details-btn {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  display: inline-flex;
  align-items: end;
  gap: 6px;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.25);
  transition: all 0.2s ease;
}

.view-details-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(99, 102, 241, 0.35);
}

.view-details-btn:active {
  transform: scale(0.96);
}

</style>
