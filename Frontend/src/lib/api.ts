/* ==========================================================================
   API CLIENT — satu pintu ke REST API CI4.
   - credentials: "include" agar cookie session HttpOnly ikut terkirim.
   - Token CSRF diambil dari body JSON setiap respons (CI4 merotasinya).
   - Semua endpoint memakai base URL yang sama, dapat dioverride lewat
     VITE_API_BASE_URL.
   ========================================================================== */

export type Role = "kasir" | "admin" | "pemilik";

export type AdminNotification = {
  id: string;
  title: string;
  sub: string;
  to: string;
  tone: "info" | "warn" | "danger" | "ok";
  icon: "po" | "stock" | "request";
};

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  branchId: number | null;
};

type ApiPayload = {
  success?: boolean;
  message?: string;
  user?: AuthUser;
  data?: unknown;
  csrfToken?: string;
};

export type AuthResponse = ApiPayload & { user?: AuthUser };

export type ApiProduct = {
  id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  merek: string | null;
  harga_jual: number;
  nama_kategori: string | null;
  stok: number;
  stok_minimum: number;
};

export type ApiCustomer = {
  id_pelanggan: number;
  nama_pelanggan: string;
  no_hp: string | null;
  alamat: string | null;
  jml_resep?: number;
  po_aktif?: number;
};

export type ApiRecipe = {
  id_resep: number;
  fk_id_pelanggan: number;
  nama_pelanggan: string;
  no_hp: string | null;
  tanggal_resep: string;
  catatan: string | null;
  od_sph: string | null;
  od_cyl: string | null;
  od_axis: string | null;
  os_sph: string | null;
  os_cyl: string | null;
  os_axis: string | null;
  pd: string | null;
  add_power: string | null;
  status: string;
};

export type ApiRecipeInput = {
  customerId: number;
  date: string;
  odSph: string;
  odCyl: string;
  odAxis: string;
  osSph: string;
  osCyl: string;
  osAxis: string;
  pd: string;
  addPower: string;
  notes: string;
};

export type ApiTransaction = {
  id_transaksi: number;
  kode_transaksi: string;
  pelanggan_id: number;
  cabang_id: number;
  pengguna_id: number;
  jenis: string;
  tanggal_transaksi: string;
  total: number;
  diskon: number;
  pajak: number;
  status: string;
  nama_pelanggan: string | null;
  no_hp: string | null;
  metode_pembayaran: string | null;
  jumlah_bayar: number | null;
  status_bayar: string | null;
};

export type ApiTransactionItem = {
  barang_id: number;
  nama_barang: string;
  merek: string | null;
  jenis: string;
  jumlah: number;
  harga: number;
  subtotal: number;
};

export type ApiOrder = {
  id_po: number;
  kode_po: string;
  status: string;
  tanggal_po: string;
  nama_pelanggan: string | null;
  no_hp?: string | null;
  pelanggan_id?: number;
  total?: number;
  transaksi_id?: number | null;
  catatan?: string | null;
  produk_label?: string | null;
  jml_item?: number;
  tanggal_estimasi_selesai?: string | null;
  alamat?: string | null;
  id_resep?: number | null;
  od_sph?: string | null;
  od_cyl?: string | null;
  od_axis?: string | null;
  os_sph?: string | null;
  os_cyl?: string | null;
  os_axis?: string | null;
  pd?: string | null;
  add_power?: string | null;
  id_transaksi?: number | null;
  kode_transaksi?: string | null;
  tanggal_transaksi?: string | null;
  total_transaksi?: number | null;
};

export type ApiOrderItem = {
  id_detail_po: number;
  po_id: number;
  barang_id: number;
  jumlah: number;
  harga: number;
  subtotal: number;
  catatan: string | null;
  nama_barang: string;
  merek: string | null;
  jenis: string;
  stok?: number;
};

export type ApiOrderTimeline = {
  id_timeline: number;
  dari_status: string | null;
  ke_status: string;
  catatan: string | null;
  actor_nama: string | null;
  created_at: string | null;
};

export type ApiOrderDetail = {
  order: ApiOrder;
  items: ApiOrderItem[];
  timeline: ApiOrderTimeline[];
};

export type AdminDashboardSummary = {
  branch: string;
  stats: {
    lowStock: number;
    newOrders: number;
    processingOrders: number;
  };
  lowStock: Array<{
    id: number;
    kode_barang: string;
    nama_barang: string;
    stok: number;
    stok_minimum: number;
  }>;
  newOrders: Array<{
    id_po: number;
    kode_po: string;
    status: string;
    tanggal_po: string;
    nama_pelanggan: string | null;
    produk_label: string | null;
  }>;
};

export type AdminCatalogProduct = {
  id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  merek: string | null;
  harga_jual: number;
  status: string;
  nama_kategori: string | null;
};

export type AdminStockRow = {
  id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  merek: string | null;
  status: string;
  stok: number;
  stok_minimum: number;
};

export type StockRequestRow = {
  id_pengajuan: number;
  kode_pengajuan: string;
  cabang_id: number;
  nama_cabang: string;
  barang_id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  merek: string | null;
  stok?: number;
  stok_cabang?: number;
  stok_minimum: number;
  jumlah_diminta: number;
  jumlah_dialokasikan: number;
  jumlah_diterima: number;
  sisa?: number;
  status: string;
  state: string;
  catatan: string | null;
  nama_pengaju: string;
  created_at: string;
  alasan_penolakan?: string | null;
};

export type StockDistributionLine = {
  id_detail_alokasi: number;
  barang_id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  merek: string | null;
  jumlah_dialokasikan: number;
  jumlah_diterima: number;
  stok?: number;
};

export type StockDistribution = {
  id_alokasi: number;
  kode_alokasi: string;
  tanggal: string;
  cabang_id: number;
  nama_cabang: string;
  kode_pengajuan: string | null;
  nama_pemilik: string;
  catatan: string | null;
  status: "Menunggu Diterima" | "Diterima Sebagian" | "Diterima";
  jumlah_dialokasikan: number;
  jumlah_diterima: number;
  items: StockDistributionLine[];
};

export type StockReceipt = {
  id_penerimaan: number;
  jumlah: number;
  created_at: string;
  catatan: string | null;
  kode_alokasi: string;
  kode_barang: string;
  nama_barang: string;
  admin_nama: string;
};

export type StockMutation = {
  id_mutasi: number;
  barang_id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  pengguna_id: number | null;
  arah: "IN" | "OUT";
  sumber: string;
  jumlah: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  referensi: string;
  petugas: string | null;
  created_at: string;
};

export type OwnerAllocationOptions = {
  branches: Array<{ id: number; nama_cabang: string; kode_cabang: string }>;
  products: Array<{
    id: number;
    kode_barang: string;
    nama_barang: string;
    jenis: string;
    merek: string | null;
    stok_pusat: number;
    reserved: number;
    available: number;
  }>;
  requests: StockRequestRow[];
};

export type OwnerBranchRow = {
  id: number | "pusat";
  kode_cabang: string;
  nama_cabang: string;
  kota: string;
  alamat: string;
  telepon: string;
  penanggung_jawab: string;
  status: "aktif" | "nonaktif";
  type: "Pusat" | "Cabang";
  stok_unit: number;
  transaksi: number;
  po_aktif: number;
  pengajuan: number;
};

export type OwnerStockRow = {
  branch_id: number | "pusat";
  nama_cabang: string;
  barang_id: number;
  kode_barang: string;
  nama_barang: string;
  jenis: string;
  merek: string | null;
  status_produk: string;
  harga_jual: number;
  nama_kategori: string | null;
  jumlah_stok: number;
  stok_minimum: number;
};

export type OwnerMutationRow = StockMutation & {
  cabang_id: number;
  nama_cabang: string;
  receipt_id: number | null;
};

export type OwnerReceiptRow = StockReceipt & {
  detail_alokasi_id: number;
  id_alokasi: number;
  cabang_id: number;
  nama_cabang: string;
  barang_id: number;
};

export type OwnerTransactionRow = ApiTransaction & {
  nama_cabang: string;
  kasir: string | null;
  items: Array<{
    id: number;
    name: string;
    brand: string;
    type: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
};

export type OwnerOrderRow = ApiOrder & {
  cabang_id: number;
  nama_cabang: string;
  items: ApiOrderItem[];
  timeline: ApiOrderTimeline[];
};

export type OwnerManagedUser = {
  id: number;
  nama: string;
  username: string;
  role: Role;
  cabang_id: number | null;
  status: "aktif" | "nonaktif";
};

export type OwnerSettings = {
  defaultMinimum: number;
  storeName: string;
  storePhone: string;
  storeAddress: string;
};

type ApiDataResponse<T> = ApiPayload & { data?: T };

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const API_BASE_URL = (configuredBase || "http://localhost:8080").replace(/\/+$/, "");

let csrfToken: string | null = null;

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readPayload(response: Response): Promise<ApiPayload | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as ApiPayload;
  } catch {
    return null;
  }
}

function rememberCsrf(payload: ApiPayload | null): void {
  if (typeof payload?.csrfToken === "string" && payload.csrfToken !== "") {
    csrfToken = payload.csrfToken;
  }
}

async function primeCsrfToken(): Promise<void> {
  try {
    const response = await fetch(apiUrl("/api/me"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    rememberCsrf(await readPayload(response));
  } catch {
    // Biarkan request utama yang melaporkan kegagalan koneksi.
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

type SentRequest = {
  response: Response;
  payload: ApiPayload | null;
};

async function send(path: string, options: RequestOptions): Promise<SentRequest> {
  const method = options.method ?? "GET";

  if (method !== "GET" && !csrfToken) {
    await primeCsrfToken();
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (csrfToken) headers["X-CSRF-TOKEN"] = csrfToken;

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Pastikan Backend berjalan.", 0, null);
  }

  const payload = await readPayload(response);
  rememberCsrf(payload);
  return { response, payload };
}

function defaultErrorMessage(status: number): string {
  if (status === 401) return "Sesi tidak aktif. Silakan masuk kembali.";
  if (status === 403) return "Akses ditolak.";
  if (status === 404) return "Endpoint API tidak ditemukan.";
  if (status >= 500) return "Server sedang bermasalah. Coba lagi.";
  return "Permintaan ke server gagal.";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let result = await send(path, options);

  // Token CSRF berotasi. Jika ditolak, token terbaru sudah tersimpan dari
  // body respons 403 sehingga request aman diulang sekali.
  if (result.response.status === 403) {
    result = await send(path, options);
  }

  const { response, payload } = result;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message?.trim() || defaultErrorMessage(response.status),
      response.status,
      payload,
    );
  }

  if (!payload) {
    throw new ApiError("Respons server tidak valid.", response.status, null);
  }

  return payload as T;
}

async function requestData<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request<ApiDataResponse<T>>(path, options);
  if (response.data === undefined) {
    throw new ApiError("Respons data dari server tidak lengkap.", 500, response);
  }
  return response.data;
}

export const authApi = {
  me: () => request<AuthResponse>("/api/me"),

  login: (username: string, password: string) =>
    request<AuthResponse>("/api/login", {
      method: "POST",
      body: { username, password },
    }),

  logout: () =>
    request<AuthResponse>("/api/logout", {
      method: "POST",
    }),
};

export const kasirApi = {
  catalog: (query = "") =>
    requestData<ApiProduct[]>(`/api/kasir/katalog${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  customers: (query = "") =>
    requestData<ApiCustomer[]>(`/api/kasir/pelanggan${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  createCustomer: (customer: { name: string; phone: string; address: string }) =>
    requestData<ApiCustomer>("/api/kasir/pelanggan", { method: "POST", body: customer }),
  updateCustomer: (id: number, customer: { name: string; phone: string; address: string }) =>
    requestData<ApiCustomer>(`/api/kasir/pelanggan/${id}`, { method: "POST", body: customer }),
  recipes: (customerId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.set("customerId", String(customerId));
    if (status) params.set("status", status);
    const query = params.toString();
    return requestData<ApiRecipe[]>(`/api/kasir/resep${query ? `?${query}` : ""}`);
  },
  createRecipe: (recipe: ApiRecipeInput) =>
    requestData<ApiRecipe>("/api/kasir/resep", { method: "POST", body: recipe }),
  updateRecipe: (id: number, recipe: Omit<ApiRecipeInput, "customerId">) =>
    requestData<ApiRecipe>(`/api/kasir/resep/${id}`, { method: "POST", body: recipe }),
  setCartItem: (productId: number, quantity: number) =>
    requestData<unknown>("/api/kasir/keranjang/item", {
      method: "POST",
      body: { productId, quantity },
    }),
  clearCart: () => requestData<unknown>("/api/kasir/keranjang/kosongkan", { method: "POST" }),
  checkout: (payload: { customerId: number; paymentMethod: string; amountPaid?: number; discountAmount: number }) =>
    requestData<{ transaction: ApiTransaction; items: ApiTransactionItem[] }>("/api/kasir/checkout", {
      method: "POST",
      body: payload,
    }),
  transactions: () => requestData<ApiTransaction[]>("/api/kasir/transaksi"),
  orders: (status = "", query = "") => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const search = params.toString();
    return requestData<ApiOrder[]>(`/api/kasir/pemesanan${search ? `?${search}` : ""}`);
  },
  order: (id: number) => requestData<ApiOrderDetail>(`/api/kasir/pemesanan/${id}`),
  createOrder: (payload: {
    customerId: number;
    items: Array<{ productId: number; quantity: number }>;
    notes: string;
    recipeId?: number;
  }) => requestData<ApiOrderDetail>("/api/kasir/pemesanan", { method: "POST", body: payload }),
  completeOrder: (id: number, paymentMethod: string, amountPaid?: number) =>
    requestData<{
      order: ApiOrder;
      transaction: ApiTransaction;
      items: ApiOrderItem[];
    }>(`/api/kasir/pemesanan/${id}/pengambilan`, {
      method: "POST",
      body: { paymentMethod, ...(amountPaid === undefined ? {} : { amountPaid }) },
    }),
  transaction: (id: number) =>
    requestData<{
      transaction: ApiTransaction;
      items: ApiTransactionItem[];
      payment: Array<Record<string, unknown>>;
      linkedPo: { id_po: number; kode_po: string } | null;
    }>(`/api/kasir/transaksi/${id}`),
};

export const adminPoApi = {
  dashboard: () => requestData<AdminDashboardSummary>("/api/admin/dashboard"),
  orders: (status = "", query = "") => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const search = params.toString();
    return requestData<ApiOrder[]>(`/api/admin/pemesanan${search ? `?${search}` : ""}`);
  },
  order: (id: number) => requestData<ApiOrderDetail>(`/api/admin/pemesanan/${id}`),
  updateStatus: (id: number, status: "diproses" | "sudah_datang" | "dibatalkan", note: string) =>
    requestData<ApiOrderDetail>(`/api/admin/pemesanan/${id}/status`, {
      method: "POST",
      body: { status, note },
    }),
};

export const adminNotificationApi = {
  notifications: () => requestData<AdminNotification[]>("/api/admin/notifikasi"),
};

export const adminInventoryApi = {
    products: (type: "Frame" | "Lensa", status = "", query = "", category = "") => {
      const params = new URLSearchParams({ type });
      if (status) params.set("status", status);
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      return requestData<AdminCatalogProduct[]>(`/api/admin/produk?${params.toString()}`);
    },
    createProduct: (product: { type: "Frame" | "Lensa"; name: string; brand: string; category: string; price: number }) =>
      requestData<AdminCatalogProduct>("/api/admin/produk", { method: "POST", body: product }),
    updateProduct: (id: number, product: { type: "Frame" | "Lensa"; name: string; brand: string; category: string; price: number }) =>
      requestData<AdminCatalogProduct>(`/api/admin/produk/${id}`, { method: "POST", body: product }),
    deactivateProduct: (id: number) =>
      requestData<AdminCatalogProduct>(`/api/admin/produk/${id}/nonaktifkan`, { method: "POST", body: {} }),
    stocks: (query = "") =>
      requestData<AdminStockRow[]>(`/api/admin/stok${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    updateMinimum: (id: number, minimum: number) =>
      requestData<{ barang_id: number; jumlah_stok: number; stok_minimum: number }>(
        `/api/admin/stok/${id}/minimum`,
        { method: "POST", body: { minimum } },
      ),
};

export const adminStockFlowApi = {
      requests: (status = "", query = "") => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (query) params.set("q", query);
        const search = params.toString();
        return requestData<StockRequestRow[]>(`/api/admin/pengajuan-stok${search ? `?${search}` : ""}`);
      },
      createRequest: (productId: number, quantity: number, note: string) =>
        requestData<{ id_pengajuan: number }>("/api/admin/pengajuan-stok", {
          method: "POST",
          body: { productId, quantity, note },
        }),
      distributions: (status = "", query = "") => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (query) params.set("q", query);
        const search = params.toString();
        return requestData<{ distributions: StockDistribution[]; receipts: StockReceipt[] }>(
          `/api/admin/distribusi-stok${search ? `?${search}` : ""}`,
        );
      },
      receive: (detailId: number, quantity: number, idempotencyKey: string, note = "") =>
        requestData<{ recorded: boolean; duplicate?: boolean }>("/api/admin/penerimaan-stok", {
          method: "POST",
          body: { detailId, quantity, idempotencyKey, note },
        }),
      mutations: (direction = "", source = "", query = "") => {
        const params = new URLSearchParams();
        if (direction) params.set("direction", direction);
        if (source) params.set("source", source);
        if (query) params.set("q", query);
        const search = params.toString();
        return requestData<StockMutation[]>(`/api/admin/mutasi-stok${search ? `?${search}` : ""}`);
      },
};

export const ownerStockFlowApi = {
      requests: (branch = "", status = "", query = "") => {
        const params = new URLSearchParams();
        if (branch) params.set("branch", branch);
        if (status) params.set("status", status);
        if (query) params.set("q", query);
        const search = params.toString();
        return requestData<StockRequestRow[]>(`/api/owner/pengajuan-stok${search ? `?${search}` : ""}`);
      },
      rejectRequest: (id: number, reason: string) =>
        requestData<{ rejected: boolean }>(`/api/owner/pengajuan-stok/${id}/tolak`, {
          method: "POST",
          body: { reason },
        }),
      allocationOptions: () => requestData<OwnerAllocationOptions>("/api/owner/alokasi-stok/opsi"),
      allocations: (query = "", status = "") => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (status) params.set("status", status);
        const search = params.toString();
        return requestData<StockDistribution[]>(`/api/owner/alokasi-stok${search ? `?${search}` : ""}`);
      },
      createAllocation: (payload: {
        branchId: number;
        productId: number;
        quantity: number;
        requestId?: number;
        note: string;
        idempotencyKey: string;
      }) => requestData<{ id_alokasi: number; kode_alokasi: string; duplicate?: boolean }>("/api/owner/alokasi-stok", {
        method: "POST",
        body: payload,
      }),
};

export const ownerManagementApi = {
  branches: () => requestData<OwnerBranchRow[]>("/api/owner/cabang"),
  saveBranch: (branch: {
    name: string;
    code: string;
    city: string;
    address: string;
    phone: string;
    pic: string;
    status: "Aktif" | "Nonaktif";
    id?: number;
  }) => requestData<OwnerBranchRow[]>(branch.id ? `/api/owner/cabang/${branch.id}` : "/api/owner/cabang", {
    method: "POST",
    body: { ...branch, status: branch.status.toLowerCase() },
  }),
  stocks: () => requestData<OwnerStockRow[]>("/api/owner/stok"),
  mutations: () => requestData<OwnerMutationRow[]>("/api/owner/mutasi-stok"),
  receipts: () => requestData<OwnerReceiptRow[]>("/api/owner/penerimaan-stok"),
  transactions: () => requestData<OwnerTransactionRow[]>("/api/owner/transaksi"),
  orders: () => requestData<OwnerOrderRow[]>("/api/owner/pemesanan"),
  users: () => requestData<OwnerManagedUser[]>("/api/owner/pengguna"),
  saveUser: (user: {
    id?: number;
    name: string;
    username: string;
    password: string;
    role: Role;
    branchId: number | null;
  }) => requestData<{ id: number }>(user.id ? `/api/owner/pengguna/${user.id}` : "/api/owner/pengguna", {
    method: "POST",
    body: user,
  }),
  setUserStatus: (id: number, status: "aktif" | "nonaktif") =>
    requestData<{ updated: boolean }>(`/api/owner/pengguna/${id}/status`, { method: "POST", body: { status } }),
  settings: () => requestData<OwnerSettings>("/api/owner/pengaturan"),
  saveSettings: (settings: OwnerSettings) =>
    requestData<OwnerSettings>("/api/owner/pengaturan", { method: "POST", body: settings }),
};
