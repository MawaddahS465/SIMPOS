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
  csrfToken?: string;
};

export type AuthResponse = ApiPayload & { user?: AuthUser };

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
