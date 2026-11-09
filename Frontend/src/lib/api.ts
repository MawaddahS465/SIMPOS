/* ==========================================================================
   API CLIENT — satu pintu ke REST API CI4.
   - credentials: "include" agar cookie session HttpOnly ikut terkirim.
   - Token CSRF diambil dari body JSON setiap respons (CI4 merotasinya).
   - Semua endpoint memakai base URL yang sama, dapat dioverride lewat
     VITE_API_BASE_URL.
   ========================================================================== */

export type Role = "kasir" | "admin" | "pemilik";

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
  orders: (status = "") =>
    requestData<ApiOrder[]>(`/api/kasir/pemesanan${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  transaction: (id: number) =>
    requestData<{
      transaction: ApiTransaction;
      items: ApiTransactionItem[];
      payment: Array<Record<string, unknown>>;
    }>(`/api/kasir/transaksi/${id}`),
};
