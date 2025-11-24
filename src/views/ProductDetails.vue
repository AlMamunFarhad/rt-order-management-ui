<!-- src/pages/ProductDetails.vue -->
<template>
  <section class="product-details container my-4">
    <div v-if="loading" class="d-flex justify-content-center py-6">
      <div class="spinner-border" role="status" aria-hidden="true"></div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="row g-0">
        <!-- Left: Image + thumbnails -->
        <div class="col-md-5 bg-gradient">
          <div class="p-4 d-flex flex-column align-items-center justify-content-center h-100">
            <div class="product-image mb-3">
              <img :src="mainImage" alt="product" class="img-fluid rounded" />
            </div>

            <div class="d-flex gap-2 thumbnails">
              <button
                v-for="(img, i) in previewImages"
                :key="i"
                class="btn p-0 thumbnail-btn"
                @click="mainImage = img"
                :aria-label="`Set image ${i+1}`"
              >
                <img :src="img" class="rounded" />
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Details -->
        <div class="col-md-7">
          <div class="p-4">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h2 class="h4 mb-1">{{ productComputed.name || "—" }}</h2>
                <div class="text-muted small">
                  <span class="me-3"><i class="fa fa-barcode me-1"></i> {{ productComputed.barcode || "—" }}</span>
                  <span v-if="sku" class="me-3"><i class="fa fa-hashtag me-1"></i> {{ sku }}</span>
                </div>
              </div>

              <div class="text-end">
                <div class="rating" v-if="productComputed.rating">
                  <span class="fw-semibold">{{ Number(productComputed.rating).toFixed(1) }}</span>
                  <small class="text-muted">/5</small>
                </div>
                <div class="stock-badge mt-2">
                  <span
                    class="badge"
                    :class="availableQuantity > 0 ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ availableQuantity > 0 ? `${availableQuantity} in stock` : 'Out of stock' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mb-3 d-flex align-items-baseline gap-3">
              <div class="price-display">
                <div class="h3 mb-0">{{ formatCurrency(currentSalePrice) }}</div>
                <small v-if="currentPurchasePrice" class="text-muted">cost: {{ formatCurrency(currentPurchasePrice) }}</small>
              </div>

              <div v-if="discountPercent" class="ms-2">
                <span class="badge bg-danger">-{{ discountPercent }}%</span>
              </div>
            </div>

            <p class="text-secondary mb-3" v-if="productComputed.description">{{ productComputed.description }}</p>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <div class="small text-muted">Category</div>
                <div class="fw-medium">{{ productComputed.category || "General" }}</div>
              </div>
              <div class="col-6">
                <div class="small text-muted">SKU</div>
                <div class="fw-medium">{{ sku || "—" }}</div>
              </div>
            </div>

            <!-- Stock breakdown -->
            <div class="mb-3" v-if="productComputed.stocks && productComputed.stocks.length">
              <h6 class="small text-muted">Stock Batches</h6>
              <ul class="list-unstyled mb-0 stock-list">
                <li v-for="s in productComputed.stocks" :key="s.id" class="d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div class="fw-semibold">{{ s.sku || "—" }} <small class="text-muted">({{ niceDate(s.received_at) }})</small></div>
                    <div class="small text-muted">Qty: {{ s.quantity }} • Price: {{ formatCurrency(s.sale_price) }}</div>
                  </div>
                  <div class="text-end">
                    <small class="text-muted">ID: {{ s.id }}</small>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Actions -->
            <div class="d-flex align-items-center gap-2">
              <div class="input-group me-2" style="max-width:140px;">
                <button class="btn btn-outline-secondary" type="button" @click="decrementQty" :disabled="qty<=1">
                  <i class="bi bi-dash"></i>
                </button>
                <input v-model.number="qty" type="number" class="form-control text-center" min="1" />
                <button class="btn btn-outline-secondary" type="button" @click="incrementQty">
                  <i class="bi bi-plus"></i>
                </button>
              </div>

              <button
                class="btn btn-primary btn-lg d-flex align-items-center gap-2"
                :disabled="availableQuantity <= 0 || adding"
                @click="addToCartClicked"
              >
                <i class="fa fa-cart-plus"></i>
                <span v-if="!adding">Add to Cart</span>
                <span v-else>Adding…</span>
              </button>

              <button v-if="canEdit" class="btn btn-outline-secondary ms-2" @click="$emit('edit', productComputed)">
                <i class="fa fa-pen"></i> Edit
              </button>

              <div class="ms-auto text-muted small">
                <div>SKU: <span class="fw-medium">{{ sku || "—" }}</span></div>
              </div>
            </div>

            <!-- Footer meta -->
            <div class="mt-3 small text-muted d-flex gap-4">
              <div>Created: {{ niceDate(productComputed.created_at) }}</div>
              <div v-if="productComputed.updated_at">Last update: {{ niceDate(productComputed.updated_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import api from "@/api/api"; 

// props
const props = defineProps({
  product: { type: Object, default: null },
  productId: { type: [String, Number], default: null },
  canEdit: { type: Boolean, default: false },
});

const emit = defineEmits(["add-to-cart", "edit"]);

const route = useRoute();
const routeId = route?.params?.id ?? null;
const effectiveId = computed(() => (props.productId ?? routeId));

// state
const loading = ref(false);
const error = ref(null);
const internalProduct = ref(null);

const qty = ref(1);
const adding = ref(false);
const mainImage = ref("");
const previewImages = ref([]);

// computed product (either prop or fetched)
const productComputed = computed(() => {
  return props.product ?? internalProduct.value ?? {};
});

// fetcher
const fetchProduct = async (id) => {
  if (!id) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get(`/products/${id}`);
    // adapt to your API shape: prefer res.data.data if exists
    internalProduct.value = res.data?.data ?? res.data ?? null;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Failed to load product";
  } finally {
    loading.value = false;
  }
};

// images init
const initImages = () => {
  const p = productComputed.value || {};
  const defaultImg = "/images/product-placeholder.png";
  previewImages.value = (p.images && p.images.length) ? p.images : [defaultImg];
  mainImage.value = previewImages.value[0];
};

// watch for product changes to init images
watch(productComputed, (newVal) => {
  if (newVal && Object.keys(newVal).length > 0) initImages();
}, { immediate: true });

// lifecycle: fetch if no prop product and route id exists
onMounted(async () => {
  if (!props.product && effectiveId.value) {
    await fetchProduct(effectiveId.value);
  } else {
    initImages();
  }
});

// derived data
const sku = computed(() => {
  const s = (productComputed.value.stocks && productComputed.value.stocks.length) ? productComputed.value.stocks[0] : null;
  return s ? s.sku : (productComputed.value.sku ?? null);
});

const availableQuantity = computed(() => {
  const stocks = productComputed.value.stocks ?? [];
  return stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
});

const currentSalePrice = computed(() => {
  const s = (productComputed.value.stocks && productComputed.value.stocks.length) ? productComputed.value.stocks[0] : null;
  return s ? Number(s.sale_price || 0) : Number(productComputed.value.sale_price ?? productComputed.value.price ?? 0);
});

const currentPurchasePrice = computed(() => {
  const s = (productComputed.value.stocks && productComputed.value.stocks.length) ? productComputed.value.stocks[0] : null;
  return s ? Number(s.purchase_price || 0) : Number(productComputed.value.purchase_price ?? null);
});

const discountPercent = computed(() => {
  if (!currentPurchasePrice.value) return 0;
  const p = currentPurchasePrice.value;
  const s = currentSalePrice.value;
  if (!p || p <= s) return 0;
  return Math.round(((p - s) / p) * 100);
});

// helpers
const formatCurrency = (val) => {
  if (val == null || val === "") return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);
};

const niceDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return d.toLocaleString();
  } catch {
    return val;
  }
};

// quantity controls
const incrementQty = () => qty.value++;
const decrementQty = () => { if (qty.value > 1) qty.value--; }

// actions
const addToCartClicked = async () => {
  if (availableQuantity.value <= 0) return;
  adding.value = true;
  try {
    emit("add-to-cart", { product: productComputed.value, qty: qty.value });
  } finally {
    setTimeout(() => adding.value = false, 400);
  }
};
</script>

<style scoped>
.product-details .bg-gradient {
  background: linear-gradient(180deg, rgba(99,102,241,0.07), rgba(59,130,246,0.02));
  min-height: 320px;
}
.product-image img {
  width: 280px;
  height: 280px;
  object-fit: cover;
  box-shadow: 0 10px 30px rgba(2,6,23,0.08);
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #fff, #f8fafc);
}
.thumbnail-btn img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border: 2px solid transparent;
}
.thumbnail-btn img:hover {
  transform: translateY(-3px);
  border-color: rgba(59,130,246,0.18);
}
.card { border-radius: 12px; overflow: hidden; }
.price-display .h3 { color: #0f172a; }
.stock-list li + li { border-top: 1px dashed rgba(15,23,42,0.05); }
.badge.bg-danger { background: linear-gradient(90deg,#ef4444,#f97316); color: #fff; }
.btn-primary { background: linear-gradient(90deg,#6366f1,#3b82f6); border: none; box-shadow: 0 8px 20px rgba(59,130,246,0.15); border-radius: 10px; }
.btn-primary:disabled { opacity: 0.6; transform: none; }
.rating { background: linear-gradient(90deg,#f59e0b,#f97316); color: white; padding: 6px 10px; border-radius: 999px; font-weight: 600; }
.small.text-muted { color: #6b7280 !important; }
@media (max-width: 767px) {
  .product-image img { width: 200px; height: 200px; }
  .thumbnails { gap: 8px; }
}
</style>
