import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS } from "../data/catalog";
import { ORDERS, RESEP_RECORDS, TRANSACTIONS, type PoOrder, type PoStatus, type ResepRecord, type Transaction } from "../data/mock";
import { CUSTOMERS, RESEP_MAP, type Customer } from "../data/customers";
import { ADMIN_STORE_KEY, DEMO_ADMIN } from "../data/admin";

/* ==========================================================================
   SHARED STORE — satu sumber data lintas role (Kasir + Admin Cabang).
   - Stok: satu saldo per product+branch; berubah hanya lewat event valid.
   - Persistensi localStorage DEMO (bukan keamanan/RBAC production).
   - Idempotency: confirmReceipt & recordSale memakai kunci unik; retry/
     refresh/double-click tidak menggandakan stok (uji UAT-05, UAT-10).
   ========================================================================== */

export const SHARED_STORE_KEY = "simpos.shared.v2";
export const BRANCH_ID = "cabang-padang";

export type BranchStatus = "Aktif" | "Nonaktif";

export type Branch = {
  id: string;
  name: string;
  type: "Pusat" | "Cabang";
  code: string;
  city: string;
  address: string;
  phone: string;
  pic: string;
  status: BranchStatus;
};

/** Seed lokasi. `branches` di store tetap sumber utama setelah diedit Pemilik. */
export const BRANCHES: Branch[] = [
  {
    id: "pusat",
    name: "Pusat",
    type: "Pusat",
    code: "PST",
    city: "Padang",
    address: "Jl. Khatib Sulaiman No. 45, Padang",
    phone: "(0751) 7051234",
    pic: "Agus Wijaya",
    status: "Aktif",
  },
  {
    id: "cabang-padang",
    name: "Cabang Padang",
    type: "Cabang",
    code: "PDG",
    city: "Padang",
    address: "Jl. Permindo No. 12, Padang",
    phone: "(0751) 321456",
    pic: "Rina Amelia",
    status: "Aktif",
  },
];

export type ProductType = "Frame" | "Lensa" | "Aksesoris";

export type AdminProduct = {
  id: string;
  code: string;
  name: string;
  brand: string;
  type: ProductType;
  category: string;
  price: number;
  tag?: string;
  status: "Aktif" | "Nonaktif";
  branchId: string;
  updatedAt: string;
};

export type StockRow = { productId: string; branchId: string; saldo: number; minimum: number };

export type DistLine = { productId: string; qtyAlokasi: number; qtyDiterima: number };

export type Distribution = {
  id: string;
  date: string;
  from: string;
  branchId: string;
  status: "Menunggu Diterima" | "Diterima Sebagian" | "Diterima";
  lines: DistLine[];
  requestId?: string; // pengajuan terkait (bila berbasis pengajuan)
  actor?: string; // pembuat alokasi (Owner) — seed lama kosong = "Alokasi awal (seed demo)"
  note?: string;
  idemKey?: string; // idempotency alokasi Owner (internal, tidak ditampilkan)
};

export type ReceiptRecord = {
  id: string;
  distributionId: string;
  productId: string;
  qty: number;
  at: string;
  actor: string;
  branchId: string;
  idempotencyKey: string;
  note: string;
  selisih: number; // qty - qtyAlokasi sisa; >0 over, <0 kurang
};

export type StockRequest = {
  id: string;
  at: string;
  actor: string;
  branchId: string;
  productId: string;
  qty: number;
  note: string;
  status: "Diajukan" | "Ditolak";
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
};

export type OwnerNotice = {
  id: string;
  at: string;
  kind: "Pengajuan Stok";
  refId: string;
  summary: string;
};

export type PoTimeline = { at: string; actor: string; from: string; to: PoStatus; note: string };

export type SharedPO = PoOrder & {
  branchId: string;
  timeline: PoTimeline[];
  /** Produk katalog yang dipesan (untuk transaksi pengambilan di Kasir). */
  productId?: string;
  /** Nomor transaksi Kasir yang menyelesaikan PO ini (anti pemakaian ganda). */
  linkedTrx?: string;
  resepSnapshot: {
    od: { sph: string; cyl: string; axis: string };
    os: { sph: string; cyl: string; axis: string };
    pd: string;
    add: string;
    at: string;
  } | null;
};

export type Mutation = {
  id: string;
  at: string;
  productId: string;
  branchId: string;
  arah: "IN" | "OUT";
  sumber: "Penerimaan" | "Penjualan" | "Pembatalan" | "Saldo Awal";
  qty: number; // bertanda: + masuk, - keluar
  sebelum: number;
  sesudah: number;
  ref: string;
  actor: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  branch: string;
  action: string;
  ref: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string; // demo frontend — bukan hash produksi
  role: "kasir" | "admin" | "pemilik";
  branchId: string; // 'all' untuk pemilik
  status: "Aktif" | "Nonaktif";
};

export type AppSettings = {
  defaultMinimum: number; // batas minimum produk baru
  storeName: string;
  storePhone: string;
  storeAddress: string;
};

type StoreShape = {
  branches: Branch[];
  products: AdminProduct[];
  stock: StockRow[];
  centralStock: StockRow[]; // saldo gudang pusat (read-only; pengurangan = keputusan terbuka)
  branchStocks: Record<string, StockRow[]>; // saldo cabang selain Padang; Padang tetap di `stock`
  distributions: Distribution[];
  receipts: ReceiptRecord[];
  requests: StockRequest[];
  notices: OwnerNotice[];
  pos: SharedPO[];
  mutations: Mutation[];
  transactions: Transaction[];
  saleRefs: string[]; // idempotency penjualan Kasir
  allocKeys: string[]; // idempotency alokasi Owner
  appUsers: AppUser[];
  customers: Customer[];
  reseps: ResepRecord[];
  settings: AppSettings;
  audit: AuditEntry[];
};

export const FRAME_CATS = ["Full-rim", "Half-rim", "Rimless", "Round", "Square"];
export const LENSA_CATS = ["Single Vision", "Blue Control", "Progressive", "Photochromic"];

const SEED_CATEGORY: Record<string, string> = {
  "P-001": "Full-rim",
  "P-002": "Square",
  "P-003": "Round",
  "P-004": "Half-rim",
  "P-005": "Rimless",
  "P-006": "Full-rim",
  "P-007": "Single Vision",
  "P-008": "Blue Control",
  "P-009": "Progressive",
  "P-010": "Aksesoris",
  "P-011": "Aksesoris",
};

const now = () =>
  `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date()
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":")}`;

const normSnap = (base: { od: { sph: string; cyl: string; axis: string }; os: { sph: string; cyl: string; axis: string }; pd: string; add?: string }, at: string) => ({
  od: base.od,
  os: base.os,
  pd: base.pd,
  add: base.add ?? "-",
  at,
});

const POWER_RE = /^[+-]?\d{1,2}([.,]\d{1,2})?$/;
const ID_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5,
  jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
};

function parseIdDate(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = ID_MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const d = new Date(Number(m[3]), month, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Validasi nilai resep: daya (SPH/CYL/ADD), axis 0–180, PD, dan rentang tanggal. */
function validateResep(input: {
  date: string;
  od: { sph: string; cyl: string; axis: string };
  os: { sph: string; cyl: string; axis: string };
  pd: string;
  add: string;
}): string | null {
  for (const [label, eye] of [["OD", input.od], ["OS", input.os]] as const) {
    if (!POWER_RE.test(eye.sph.trim())) return `SPH ${label} harus angka, contoh -1.50.`;
    if (eye.cyl.trim() && !POWER_RE.test(eye.cyl.trim())) return `CYL ${label} harus angka, contoh -0.75.`;
    if (eye.axis.trim() && eye.axis.trim() !== "-") {
      if (!/^\d{1,3}$/.test(eye.axis.trim()) || Number(eye.axis.trim()) > 180)
        return `AXIS ${label} harus bilangan bulat 0–180.`;
    }
  }
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(input.pd.trim())) return "PD harus angka, contoh 62 atau 31.5.";
  const pd = Number(input.pd.replace(",", "."));
  if (!Number.isFinite(pd) || pd < 20 || pd > 100) return "PD harus berada pada rentang 20–100 mm.";
  if (input.add.trim() && input.add.trim() !== "-" && !POWER_RE.test(input.add.trim()))
    return "ADD harus angka, contoh +1.00.";
  if (input.date.trim()) {
    const d = parseIdDate(input.date);
    if (!d) return "Format tanggal resep tidak valid (contoh 26 Okt 2026).";
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d.getTime() > today.getTime()) return "Tanggal resep tidak boleh melewati hari ini.";
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - 5);
    if (d.getTime() < limit.getTime()) return "Tanggal resep terlalu lama (maksimal 5 tahun terakhir).";
  }
  return null;
}

const SNAPSHOTS: Record<string, { od: { sph: string; cyl: string; axis: string }; os: { sph: string; cyl: string; axis: string }; pd: string; add: string; at: string }> = {
  "PO-2026-0108": normSnap(RESEP_MAP["C-02"], "10 Okt 2026"),
  "PO-2026-0107": {
    od: { sph: "-1.50", cyl: "-0.75", axis: "180" },
    os: { sph: "-1.25", cyl: "-0.50", axis: "170" },
    pd: "32.0",
    add: "+1.00",
    at: "10 Okt 2026",
  },
};

function seed(): StoreShape {
  const products: AdminProduct[] = PRODUCTS.map((p, i) => ({
    id: p.id,
    code: `${p.category === "Frame" ? "FR" : p.category === "Lensa" ? "LS" : "AK"}-${String(i + 1).padStart(3, "0")}`,
    name: p.name,
    brand: p.brand,
    type: p.category as ProductType,
    category: SEED_CATEGORY[p.id] ?? p.category,
    price: p.price,
    tag: p.tag,
    status: "Aktif",
    branchId: BRANCH_ID,
    updatedAt: "10 Okt 2026",
  }));
  const saldos: Array<[string, number, number]> = [
    ["P-001", 8, 4],
    ["P-002", 6, 4],
    ["P-003", 2, 3],
    ["P-004", 9, 4],
    ["P-005", 4, 4],
    ["P-006", 5, 3],
    ["P-007", 12, 6],
    ["P-008", 3, 3],
    ["P-009", 7, 4],
  ];
  const stock: StockRow[] = saldos.map(([productId, saldo, minimum]) => ({
    productId,
    branchId: BRANCH_ID,
    saldo,
    minimum,
  }));
  const mutations: Mutation[] = stock.map((s, i) => ({
    id: `MU-${String(i + 1).padStart(4, "0")}`,
    at: "01 Okt 2026, 09:00",
    productId: s.productId,
    branchId: BRANCH_ID,
    arah: "IN",
    sumber: "Saldo Awal",
    qty: s.saldo,
    sebelum: 0,
    sesudah: s.saldo,
    ref: "OPENING/Okt-2026",
    actor: "Sistem",
  }));
  const snapOf = (o: PoOrder) => {
    if (!o.resep) return null;
    const base = SNAPSHOTS[o.id] ?? normSnap(RESEP_MAP["C-02"], o.date);
    return base;
  };
  /* Riwayat seed yang konsisten dengan status tiap PO (ilustrasi bentuk timeline). */
  const seedTimeline = (o: PoOrder): PoTimeline[] => {
    const t: PoTimeline[] = [{ at: o.createdAt, actor: "Kasir", from: "Baru", to: "Dipesan", note: "PO dibuat Kasir" }];
    if (o.status === "Dipesan") return t;
    t.push({ at: "10 Oktober 2026, 13:05", actor: "Rina Amelia", from: "Dipesan", to: "Diproses", note: "Produk disiapkan" });
    if (o.status === "Diproses") return t;
    t.push({ at: "10 Oktober 2026, 15:40", actor: "Rina Amelia", from: "Diproses", to: "Sudah Datang", note: "Barang tersedia" });
    if (o.status === "Sudah Datang") return t;
    // Seed Selesai: aktor Kasir mengikuti catatan mock; kebijakan resmi tetap terbuka (PRD).
    t.push({ at: "09 Oktober 2026, 10:02", actor: "Kasir", from: "Sudah Datang", to: "Selesai", note: "Diambil pelanggan" });
    return t;
  };
  const pos: SharedPO[] = ORDERS.map((o) => ({
    ...o,
    branchId: BRANCH_ID,
    timeline: seedTimeline(o),
    resepSnapshot: snapOf(o),
  }));
  return {
    branches: BRANCHES.map((b) => ({ ...b })),
    products,
    stock,
    branchStocks: {},
    centralStock: [
      ["P-001", 24, 5],
      ["P-002", 18, 5],
      ["P-003", 15, 5],
      ["P-004", 20, 5],
      ["P-005", 12, 5],
      ["P-006", 10, 5],
      ["P-007", 30, 8],
      ["P-008", 22, 8],
      ["P-009", 16, 8],
    ].map(([productId, saldo, minimum]) => ({
      productId: productId as string,
      branchId: "pusat",
      saldo: saldo as number,
      minimum: minimum as number,
    })),
    distributions: [
      {
        id: "DIST-2026-021",
        date: "10 Okt 2026",
        from: "Pusat",
        branchId: BRANCH_ID,
        status: "Menunggu Diterima",
        lines: [
          { productId: "P-003", qtyAlokasi: 4, qtyDiterima: 0 },
          { productId: "P-008", qtyAlokasi: 6, qtyDiterima: 0 },
        ],
      },
      {
        id: "DIST-2026-020",
        date: "08 Okt 2026",
        from: "Pusat",
        branchId: BRANCH_ID,
        status: "Menunggu Diterima",
        lines: [{ productId: "P-005", qtyAlokasi: 3, qtyDiterima: 0 }],
      },
    ],
    receipts: [],
    // Data demo pengajuan: Admin Cabang mengajukan produk yang stoknya menipis
    // (FR-003 2/3, LS-008 3/3, FR-005 4/4) supaya alur Keputusan Pemilik terlihat.
    requests: [
      { id: "REQ-2026-001", at: "10 Okt 2026, 08:40", actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId: "P-003", qty: 6, note: "Stok frame menipis, banyak dicari pelanggan", status: "Diajukan" },
      { id: "REQ-2026-002", at: "10 Okt 2026, 08:45", actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId: "P-008", qty: 4, note: "Persediaan lensa habis setelah akhir pekan", status: "Diajukan" },
      { id: "REQ-2026-003", at: "10 Okt 2026, 09:02", actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId: "P-005", qty: 3, note: "Penambahan stok rutin cabang", status: "Diajukan" },
    ],
    notices: [
      { id: "NT-001", at: "10 Okt 2026, 08:40", kind: "Pengajuan Stok" as const, refId: "REQ-2026-001", summary: "FR-003 × 6 dari Cabang Padang" },
      { id: "NT-002", at: "10 Okt 2026, 08:45", kind: "Pengajuan Stok" as const, refId: "REQ-2026-002", summary: "LS-008 × 4 dari Cabang Padang" },
      { id: "NT-003", at: "10 Okt 2026, 09:02", kind: "Pengajuan Stok" as const, refId: "REQ-2026-003", summary: "FR-005 × 3 dari Cabang Padang" },
    ],
    pos,
    mutations,
    transactions: TRANSACTIONS,
    saleRefs: [],
    allocKeys: [],
    appUsers: [
      { id: "U-001", name: "Korena Saif", email: "kasir@mekarjaya.demo", password: "demo123", role: "kasir", branchId: BRANCH_ID, status: "Aktif" },
      { id: "U-002", name: "Rina Amelia", email: "admin@mekarjaya.demo", password: "demo123", role: "admin", branchId: BRANCH_ID, status: "Aktif" },
      { id: "U-003", name: "Agus Wijaya", email: "owner@mekarjaya.demo", password: "demo123", role: "pemilik", branchId: "all", status: "Aktif" },
    ],
    customers: CUSTOMERS,
    reseps: RESEP_RECORDS,
    settings: {
      defaultMinimum: 2,
      storeName: "Optik Mekar Jaya — Cabang Padang",
      storePhone: "(0751) 123456",
      storeAddress: "Jl. Contoh No. 1, Padang",
    },
    audit: [
      {
        id: "AU-001",
        at: "10 Okt 2026, 09:12",
        actor: DEMO_ADMIN.name,
        branch: DEMO_ADMIN.branch,
        action: "Inisialisasi shared store Tahap 02",
        ref: "SYSTEM/SEED",
      },
    ],
  };
}

/** Migrasi satu-kali dari store Tahap-01 (produk & minimum & draf) agar tak hilang. */
function migrateOld(base: StoreShape): StoreShape {
  try {
    const raw = localStorage.getItem(ADMIN_STORE_KEY);
    if (!raw) return base;
    const old = JSON.parse(raw) as {
      products?: Array<{ id: string; name: string; brand: string; category: string; price: number; status: "Aktif" | "Nonaktif" }>;
      stock?: Array<{ productId: string; minimum: number }>;
      drafts?: Array<{ id: string; at: string; productId: string; qty: number; note: string }>;
    };
    if (!old.products) return base;
    const products = base.products.map((p) => {
      const o = old.products!.find((x) => x.id === p.id);
      return o ? { ...p, name: o.name, brand: o.brand, category: o.category, price: o.price, status: o.status } : p;
    });
    // produk baru Tahap-01 (id P-F*/P-L*) ikut terbawa
    for (const o of old.products) {
      if (!products.some((p) => p.id === o.id)) {
        products.push({
          id: o.id, code: o.id.startsWith("P-L") ? `LS-X${o.id.slice(-2)}` : `FR-X${o.id.slice(-2)}`,
          name: o.name, brand: o.brand, type: o.id.startsWith("P-L") ? "Lensa" : "Frame",
          category: o.category, price: o.price, status: o.status, branchId: BRANCH_ID, updatedAt: "Tahap 01",
        });
      }
    }
    const stock = base.stock.map((s) => {
      const o = old.stock?.find((x) => x.productId === s.productId);
      return o ? { ...s, minimum: o.minimum } : s;
    });
    const requests: StockRequest[] = (old.drafts ?? []).map((d, i) => ({
      id: `REQ-2026-${String(i + 1).padStart(3, "0")}`,
      at: d.at,
      actor: DEMO_ADMIN.name,
      branchId: BRANCH_ID,
      productId: d.productId,
      qty: d.qty,
      note: d.note,
      status: "Diajukan",
    }));
    return { ...base, products, stock, requests };
  } catch {
    return base;
  }
}

function load(): StoreShape {
  try {
    const raw = localStorage.getItem(SHARED_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreShape;
      if (Array.isArray(parsed.products) && Array.isArray(parsed.pos)) {
        // Backfill aditif Tahap 04 (tanpa bump key / tanpa hapus data pengguna).
        if (!Array.isArray(parsed.branches)) parsed.branches = seed().branches;
        else {
          const seedBranches = new Map(seed().branches.map((b) => [b.id, b]));
          parsed.branches = parsed.branches.map((b) => {
            const s = seedBranches.get(b.id);
            const rawAddress = b.address && b.address !== "Jl. Contoh No. 1, Padang" ? b.address : s?.address;
            const rawPhone = b.phone && b.phone !== "(0751) 123456" ? b.phone : s?.phone;
            return {
              ...b,
              code: b.code ?? s?.code ?? b.id.slice(-3).toUpperCase(),
              city: b.city ?? s?.city ?? "Padang",
              address: rawAddress ?? "-",
              phone: rawPhone ?? "-",
              pic: b.pic ?? s?.pic ?? "-",
              status: b.status ?? "Aktif",
            };
          });
        }
        if (!parsed.branchStocks || typeof parsed.branchStocks !== "object") parsed.branchStocks = {};
        if (!Array.isArray(parsed.centralStock)) parsed.centralStock = seed().centralStock;
        if (!Array.isArray(parsed.allocKeys)) parsed.allocKeys = [];
        if (!Array.isArray(parsed.appUsers)) parsed.appUsers = seed().appUsers;
        if (!Array.isArray(parsed.customers)) parsed.customers = seed().customers;
        if (!Array.isArray(parsed.reseps)) {
          parsed.reseps = seed().reseps;
        } else {
          const rxSeed = new Map(RESEP_RECORDS.map((x) => [x.id, x]));
          for (const r of parsed.reseps) {
            const s = rxSeed.get(r.id);
            if (!r.note && s?.note) r.note = s.note;
          }
        }
        if (!parsed.settings) parsed.settings = seed().settings;
        if (Array.isArray(parsed.requests)) {
          for (const req of parsed.requests) {
            if (req.note === "Egalisasi Bella Round — saldo 2 / minimum 3") {
              req.note = "Stok frame menipis, banyak dicari pelanggan";
            } else if (req.note === "Blue Control habis setelah akhir pekan") {
              req.note = "Persediaan lensa habis setelah akhir pekan";
            } else if (req.note === "AirFlex menipis (saldo = minimum)") {
              req.note = "Penambahan stok rutin cabang";
            }
          }
        }
        if (Array.isArray(parsed.transactions)) {
          const seedMap = new Map(TRANSACTIONS.map((x) => [x.id, x]));
          for (const t of parsed.transactions) {
            if (!(t as { branchId?: string }).branchId) (t as { branchId?: string }).branchId = BRANCH_ID;
            if (t.status === "Pending") t.status = "Selesai";
            const s = seedMap.get(t.id);
            if (s) {
              if (!t.method && s.method) t.method = s.method;
              if (t.paid === undefined && s.paid !== undefined) t.paid = s.paid;
              if (t.change === undefined && s.change !== undefined) t.change = s.change;
            }
          }
          /* Riwayat demo tambahan (id H*) untuk grafik periode sebelumnya — hanya menambah. */
          const known = new Set(parsed.transactions.map((t) => t.id));
          const history = TRANSACTIONS.filter((t) => t.id.startsWith("H") && !known.has(t.id));
          if (history.length) parsed.transactions = [...parsed.transactions, ...history];
        }
        /* Backfill produk untuk PO lama agar bisa diproses sebagai transaksi pengambilan. */
        for (const po of parsed.pos) {
          if (po.productId) continue;
          const item = po.items?.[0]?.name ?? "";
          const clean = item.trim().toLowerCase().replace(/^(frame|lensa|aksesoris)\s+/i, "");
          const hit = parsed.products.find(
            (p) => p.name.toLowerCase() === item.trim().toLowerCase() || p.name.toLowerCase() === clean,
          );
          if (hit) po.productId = hit.id;
        }
        return parsed;
      }
    }
  } catch {
    /* pakai seed */
  }
  return migrateOld(seed());
}

type SharedStore = StoreShape & {
  lowStock: Array<{ product: AdminProduct; saldo: number; minimum: number }>;
  productOf: (id: string) => AdminProduct | undefined;
  stockOf: (id: string) => StockRow | undefined;
  stockForBranch: (branchId: string) => StockRow[];
  upsertBranch: (input: {
    id?: string;
    name: string;
    code: string;
    city: string;
    address: string;
    phone: string;
    pic: string;
    status: BranchStatus;
  }) => { ok: boolean; msg: string; id?: string };
  upsertProduct: (input: Omit<AdminProduct, "id" | "code" | "updatedAt" | "branchId"> & { id?: string }) => string | null;
  deactivateProduct: (id: string) => void;
  setMinimum: (productId: string, minimum: number) => void;
  createRequest: (productId: string, qty: number, note: string) => void;
  addDraft: (productId: string, qty: number, note: string) => void;
  createPO: (input: {
    customerId: string;
    items: Array<{ productId: string; qty: number }>;
    note: string;
    actor: string;
    resepId?: string;
  }) => { ok: boolean; msg: string; id?: string };
  /** Alokasi Owner: reservation tanpa debit fisik pusat (keputusan terbuka). */
  availableToAllocate: (productId: string) => { onHand: number; reserved: number; available: number };
  allocatedForRequest: (requestId: string, productId: string) => number;
  receivedForRequest: (requestId: string, productId: string) => number;
  outstandingForRequest: (requestId: string, productId: string) => number;
  rejectRequest: (requestId: string, reason: string, actor: string) => { ok: boolean; msg: string };
  createAllocation: (input: {
    requestId?: string;
    branchId: string;
    productId: string;
    qty: number;
    note: string;
    actor: string;
    key: string; // idempotency per-buka-form
  }) => { ok: boolean; msg: string; id?: string };
  upsertUser: (input: { id?: string; name: string; email: string; password: string; role: "kasir" | "admin" | "pemilik"; branchId: string }) => string | null;
  setUserStatus: (id: string, status: "Aktif" | "Nonaktif") => string | null;
  upsertCustomer: (input: {
    id?: string;
    name: string;
    phone: string;
    email: string;
  }) => { ok: boolean; msg: string; customer?: Customer };
  createResep: (input: {
    customerId: string;
    date: string;
    od: { sph: string; cyl: string; axis: string };
    os: { sph: string; cyl: string; axis: string };
    pd: string;
    add: string;
    note: string;
  }) => string | null;
  updateResep: (input: { id: string; date: string; od: { sph: string; cyl: string; axis: string }; os: { sph: string; cyl: string; axis: string }; pd: string; add: string; note?: string }) => string | null;
  completePendingSale: (no: string, actor: string) => { ok: boolean; msg: string };
  setResepStatus: (id: string, status: ResepRecord["status"]) => void;
  saveSettings: (input: AppSettings) => string | null;
  authenticate: (email: string, password: string) => { role: "kasir" | "admin" | "pemilik"; name: string; initials: string; branch: string; branchId: string; email: string } | null;
  confirmReceipt: (
    distributionId: string,
    productId: string,
    qty: number,
    note: string,
  ) => { ok: boolean; msg: string };
  transitionPO: (id: string, to: PoStatus, note: string, actor: string) => { ok: boolean; msg: string };
  /** Produk katalog untuk item PO (fallback pencocokan nama untuk PO lama). */
  productForPOItem: (name: string) => AdminProduct | undefined;
  recordSale: (
    items: Array<{ id: string; name: string; brand: string; qty: number; price: number }>,
    refNo: string,
    actor: string,
    method?: string,
    discount?: number,
    paid?: number,
    change?: number,
    customer?: { name: string; phone: string } | null,
    poId?: string | null,
  ) => { ok: boolean; msg: string };
  cancelSale: (no: string, reason: string, actor: string) => { ok: boolean; msg: string };
  cancelPO: (id: string, reason: string, actor: string) => { ok: boolean; msg: string };
};

const Ctx = createContext<SharedStore | null>(null);

const PO_NEXT: Record<string, PoStatus> = { Dipesan: "Diproses", Diproses: "Sudah Datang", "Sudah Datang": "Selesai" };

export function SharedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreShape>(load);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_STORE_KEY && e.newValue) {
        setState(load());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SHARED_STORE_KEY, JSON.stringify(state));
    } catch {
      /* demo tetap jalan in-memory */
    }
  }, [state]);

  const value = useMemo<SharedStore>(() => {
    const productOf = (id: string) => state.products.find((p) => p.id === id);
    const stockOf = (id: string) => state.stock.find((s) => s.productId === id);
    const stockForBranch = (branchId: string) => {
      if (branchId === "pusat") return state.centralStock;
      if (branchId === BRANCH_ID) return state.stock;
      return state.branchStocks[branchId] ?? [];
    };
    const productForPOItem = (name: string) => {
      const raw = name.trim().toLowerCase();
      const clean = raw.replace(/^(frame|lensa|aksesoris)\s+/i, "").trim();
      return state.products.find(
        (p) => p.status === "Aktif" && (p.name.toLowerCase() === raw || p.name.toLowerCase() === clean),
      );
    };
    const lowStock = state.stock
      .filter((s) => {
        const p = productOf(s.productId);
        return p && p.status === "Aktif" && p.type !== "Aksesoris" && s.saldo <= s.minimum;
      })
      .map((s) => ({ product: productOf(s.productId)!, saldo: s.saldo, minimum: s.minimum }));

    const audit = (prev: StoreShape, action: string, ref: string): AuditEntry[] => [
      {
        id: `AU-${String(prev.audit.length + 1).padStart(3, "0")}`,
        at: now(),
        actor: DEMO_ADMIN.name,
        branch: DEMO_ADMIN.branch,
        action,
        ref,
      },
      ...prev.audit,
    ];

    return {
      ...state,
      lowStock,
      productOf,
      stockOf,
      stockForBranch,
      productForPOItem,

      upsertBranch: (input) => {
        const cleanName = input.name.trim();
        const cleanCode = input.code.trim().toUpperCase();
        const cleanCity = input.city.trim();
        const cleanAddress = input.address.trim();
        const cleanPhone = input.phone.trim();
        const cleanPic = input.pic.trim();
        if (!cleanName) return { ok: false, msg: "Nama cabang wajib diisi." };
        if (!/^[A-Z0-9]{2,8}$/.test(cleanCode))
          return { ok: false, msg: "Kode cabang 2–8 karakter, hanya huruf dan angka." };
        if (!cleanCity) return { ok: false, msg: "Kota wajib diisi." };
        if (!cleanAddress) return { ok: false, msg: "Alamat wajib diisi." };
        if (!cleanPic) return { ok: false, msg: "Penanggung jawab wajib diisi." };
        const digits = cleanPhone.replace(/[^0-9]/g, "");
        if (cleanPhone && (digits.length < 6 || digits.length > 15))
          return { ok: false, msg: "Nomor telepon harus 6–15 digit angka." };
        const target = input.id ? state.branches.find((b) => b.id === input.id) : undefined;
        if (input.id && !target) return { ok: false, msg: "Cabang tidak ditemukan." };
        if (state.branches.some((b) => b.id !== input.id && b.name.toLowerCase() === cleanName.toLowerCase()))
          return { ok: false, msg: "Nama cabang sudah dipakai." };
        if (state.branches.some((b) => b.id !== input.id && b.code.toUpperCase() === cleanCode))
          return { ok: false, msg: "Kode cabang sudah dipakai." };
        if (target?.type === "Pusat" && input.status === "Nonaktif")
          return { ok: false, msg: "Pusat harus tetap aktif." };
        if (target) {
          setState((prev) => ({
            ...prev,
            branches: prev.branches.map((b) =>
              b.id === target.id
                ? {
                    ...b,
                    name: cleanName,
                    code: cleanCode,
                    city: cleanCity,
                    address: cleanAddress,
                    phone: cleanPhone || "-",
                    pic: cleanPic,
                    status: input.status,
                  }
                : b,
            ),
            audit: audit(prev, `Ubah cabang ${cleanName}`, `CABANG/${target.id}`),
          }));
          return { ok: true, msg: `Data ${cleanName} diperbarui.`, id: target.id };
        }
        const slug =
          cleanName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || cleanCode.toLowerCase();
        let id = `cabang-${slug}`;
        let n = 2;
        while (state.branches.some((b) => b.id === id)) {
          id = `cabang-${slug}-${n++}`;
        }
        const branch: Branch = {
          id,
          name: cleanName,
          type: "Cabang",
          code: cleanCode,
          city: cleanCity,
          address: cleanAddress,
          phone: cleanPhone || "-",
          pic: cleanPic,
          status: input.status,
        };
        setState((prev) => ({
          ...prev,
          branches: [...prev.branches, branch],
          audit: audit(prev, `Tambah cabang ${cleanName} (${cleanCode})`, `CABANG/${id}`),
        }));
        return { ok: true, msg: `${cleanName} ditambahkan.`, id };
      },

      upsertProduct: (input) => {
        if (!input.name.trim() || !input.brand.trim()) return "Nama dan merek wajib diisi.";
        if (!Number.isFinite(input.price) || input.price <= 0) return "Harga jual harus lebih dari Rp 0.";
        setState((prev) => {
          if (input.id) {
            const code = prev.products.find((p) => p.id === input.id)?.code ?? "";
            return {
              ...prev,
              products: prev.products.map((p) =>
                p.id === input.id ? { ...p, ...input, id: p.id, code: p.code, branchId: BRANCH_ID, updatedAt: now().split(",")[0] } : p,
              ),
              audit: audit(prev, `Ubah produk ${code}`, `PRODUK/${code}`),
            };
          }
          const n = prev.products.filter((p) => p.type === input.type).length + 1;
          const pre = input.type === "Frame" ? "FR" : input.type === "Lensa" ? "LS" : "AK";
          const code = `${pre}-${String(n).padStart(3, "0")}`;
          const id = `P-${input.type === "Frame" ? "F" : input.type === "Lensa" ? "L" : "A"}${Date.now().toString().slice(-4)}`;
          const np: AdminProduct = { ...input, id, code, branchId: BRANCH_ID, updatedAt: now().split(",")[0] };
          return {
            ...prev,
            products: [...prev.products, np],
            stock: input.type === "Aksesoris" ? prev.stock : [...prev.stock, { productId: id, branchId: BRANCH_ID, saldo: 0, minimum: state.settings.defaultMinimum }],
            audit: audit(prev, `Tambah produk ${code}`, `PRODUK/${code}`),
          };
        });
        return null;
      },

      deactivateProduct: (id) => {
        setState((prev) => {
          const code = prev.products.find((p) => p.id === id)?.code ?? id;
          return {
            ...prev,
            products: prev.products.map((p) => (p.id === id ? { ...p, status: "Nonaktif", updatedAt: now().split(",")[0] } : p)),
            audit: audit(prev, `Nonaktifkan produk ${code} (soft delete)`, `PRODUK/${code}`),
          };
        });
      },

      setMinimum: (productId, minimum) => {
        setState((prev) => ({
          ...prev,
          stock: prev.stock.map((s) => (s.productId === productId ? { ...s, minimum } : s)),
          audit: audit(prev, `Tetapkan minimum ${prev.products.find((p) => p.id === productId)?.code} = ${minimum}`, `STOK/${productId}`),
        }));
      },

      createRequest: (productId, qty, note) => {
        setState((prev) => {
          const p = prev.products.find((x) => x.id === productId);
          const id = `REQ-2026-${String(prev.requests.length + 1).padStart(3, "0")}`;
          const at = now();
          return {
            ...prev,
            requests: [{ id, at, actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId, qty, note, status: "Diajukan" }, ...prev.requests],
            notices: [
              { id: `NT-${String(prev.notices.length + 1).padStart(3, "0")}`, at, kind: "Pengajuan Stok" as const, refId: id, summary: `${p?.code ?? productId} × ${qty} dari ${DEMO_ADMIN.branch}` },
              ...prev.notices,
            ],
            audit: audit(prev, `Buat pengajuan ${id} (${p?.code} × ${qty})`, `PENGAJUAN/${id}`),
          };
        });
      },

      addDraft: (productId, qty, note) => {
        setState((prev) => {
          const p = prev.products.find((x) => x.id === productId);
          const id = `REQ-2026-${String(prev.requests.length + 1).padStart(3, "0")}`;
          return {
            ...prev,
            requests: [{ id, at: now(), actor: DEMO_ADMIN.name, branchId: BRANCH_ID, productId, qty, note, status: "Diajukan" }, ...prev.requests],
            audit: audit(prev, `Buat pengajuan ${id} (${p?.code} × ${qty})`, `PENGAJUAN/${id}`),
          };
        });
      },

      createPO: ({ customerId, items, note, actor, resepId }) => {
        if (!items.length) return { ok: false, msg: "Tambahkan minimal satu produk." };
        for (const it of items) {
          if (!Number.isInteger(it.qty) || it.qty <= 0) {
            return { ok: false, msg: "Jumlah setiap produk harus bilangan bulat lebih dari 0." };
          }
        }
        const cust = state.customers.find((c) => c.id === customerId) ?? CUSTOMERS.find((c) => c.id === customerId);
        if (!cust) return { ok: false, msg: "Pelanggan tidak valid." };

        const lines = items.map((it) => ({
          qty: it.qty,
          prod: state.products.find((p) => p.id === it.productId && p.status === "Aktif"),
        }));
        if (lines.some((l) => !l.prod)) return { ok: false, msg: "Produk tidak valid / nonaktif." };

        const first = lines[0].prod!;
        const totalQty = lines.reduce((a, l) => a + l.qty, 0);
        const total = lines.reduce((a, l) => a + (l.prod?.price ?? 0) * l.qty, 0);
        const hasLensa = lines.some((l) => l.prod?.type === "Lensa");
        const at = now();
        const seq = state.pos.length + 109;
        const id = `PO-2026-0${seq}`;
        const base =
          hasLensa
            ? ((resepId ? state.reseps.find((r) => r.id === resepId) : undefined) ??
              state.reseps.find((r) => r.customer === cust.name) ??
              RESEP_MAP[customerId])
            : undefined;
        const snap = base ? normSnap(base, at.split(",")[0]) : null;
        const po: SharedPO = {
          id,
          number: id,
          date: at.split(",")[0],
          customer: cust.name,
          initials: cust.initials,
          phone: cust.phone,
          products: [
            lines.length === 1 ? first.name : `${first.name} +${lines.length - 1} produk`,
            lines.length === 1 ? `${first.type} · ${first.brand}` : `${lines.length} produk · ${totalQty} unit`,
          ],
          productLabel: lines.length === 1 ? first.name : `${first.name} +${lines.length - 1} produk`,
          status: "Dipesan",
          createdAt: `${at} WIB`,
          note: note.trim() || "Menunggu pemrosesan admin cabang.",
          items: lines.map((l) => ({
            name: l.prod!.name,
            sub: `${l.prod!.type} · ${l.prod!.brand}`,
            qty: l.qty,
            price: l.prod!.price,
            productId: l.prod!.id,
          })),
          total,
          resep: snap !== null,
          branchId: BRANCH_ID,
          productId: lines.length === 1 ? first.id : undefined,
          timeline: [{ at: `${at} WIB`, actor, from: "Baru", to: "Dipesan", note: "PO dibuat Kasir" }],
          resepSnapshot: snap,
        };
        setState((prev) => ({
          ...prev,
          pos: [po, ...prev.pos],
          audit: audit(prev, `Buat PO ${id} (${cust.name} · ${lines.length} produk · ${totalQty} unit)`, `PO/${id}`),
        }));
        return { ok: true, msg: `PO ${id} tercatat dengan status Dipesan.`, id };
      },

      availableToAllocate: (productId) => {
        const onHand = state.centralStock.find((s) => s.productId === productId)?.saldo ?? 0;
        const reserved = state.distributions
          .filter((d) => d.status !== "Diterima")
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + Math.max(0, l.qtyAlokasi - l.qtyDiterima), 0);
        return { onHand, reserved, available: Math.max(0, onHand - reserved) };
      },

      allocatedForRequest: (requestId, productId) =>
        state.distributions
          .filter((d) => d.requestId === requestId)
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + l.qtyAlokasi, 0),

      receivedForRequest: (requestId, productId) =>
        state.distributions
          .filter((d) => d.requestId === requestId)
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + l.qtyDiterima, 0),

      outstandingForRequest: (requestId, productId) => {
        const req = state.requests.find((r) => r.id === requestId && r.productId === productId);
        if (!req || req.status === "Ditolak") return 0;
        const allocated = state.distributions
          .filter((d) => d.requestId === requestId)
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + l.qtyAlokasi, 0);
        return Math.max(0, req.qty - allocated);
      },

      rejectRequest: (requestId, reason, actor) => {
        const req = state.requests.find((r) => r.id === requestId);
        if (!req) return { ok: false, msg: "Pengajuan tidak ditemukan." };
        if (req.status === "Ditolak") return { ok: false, msg: "Pengajuan ini sudah ditolak." };
        const allocated = state.distributions
          .filter((d) => d.requestId === requestId)
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === req.productId)
          .reduce((a, l) => a + l.qtyAlokasi, 0);
        if (allocated > 0)
          return { ok: false, msg: "Pengajuan yang sudah dialokasikan tidak dapat ditolak. Selesaikan alokasinya terlebih dahulu." };
        const clean = reason.trim();
        if (clean.length < 3) return { ok: false, msg: "Alasan penolakan wajib diisi (minimal 3 karakter)." };
        setState((prev) => ({
          ...prev,
          requests: prev.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "Ditolak" as const,
                  rejectedAt: now(),
                  rejectedBy: actor,
                  rejectedReason: clean,
                }
              : r,
          ),
          audit: audit(prev, `Tolak pengajuan ${requestId} oleh ${actor}: ${clean}`, `PENGAJUAN/${requestId}`),
        }));
        return { ok: true, msg: "Pengajuan ditolak. Alasan tercatat." };
      },

      createAllocation: ({ requestId, branchId, productId, qty, note, actor, key }) => {
        if (state.allocKeys.includes(key)) {
          const dup = state.distributions.find((d) => d.idemKey === key);
          return { ok: false, msg: `Alokasi ganda ditolak (sudah tercatat${dup ? ` sebagai ${dup.id}` : ""}).` };
        }
        if (!Number.isInteger(qty) || qty <= 0) return { ok: false, msg: "Jumlah alokasi harus bilangan bulat lebih dari 0." };
        if (branchId === "pusat") return { ok: false, msg: "Cabang tujuan tidak boleh Pusat." };
        const dest = state.branches.find((b) => b.id === branchId && b.type === "Cabang");
        if (!dest) return { ok: false, msg: "Cabang tujuan tidak valid." };
        if (dest.status !== "Aktif") return { ok: false, msg: "Cabang tujuan sedang nonaktif." };
        const prod = state.products.find((p) => p.id === productId && p.status === "Aktif");
        if (!prod || prod.type === "Aksesoris") return { ok: false, msg: "Produk tidak valid / nonaktif." };
        const central = state.centralStock.find((s) => s.productId === productId);
        const onHand = central?.saldo ?? 0;
        const reserved = state.distributions
          .filter((d) => d.status !== "Diterima")
          .flatMap((d) => d.lines)
          .filter((l) => l.productId === productId)
          .reduce((a, l) => a + Math.max(0, l.qtyAlokasi - l.qtyDiterima), 0);
        if (qty > Math.max(0, onHand - reserved))
          return { ok: false, msg: `Melebihi yang bisa dialokasikan (tersedia ${Math.max(0, onHand - reserved)} dari stok pusat ${onHand}, reservasi ${reserved}).` };
        if (requestId) {
          const req = state.requests.find((r) => r.id === requestId && r.productId === productId);
          if (!req) return { ok: false, msg: "Pengajuan terkait tidak ditemukan." };
          if (req.status === "Ditolak") return { ok: false, msg: "Pengajuan ini sudah ditolak." };
          if (req.branchId !== branchId) return { ok: false, msg: "Cabang pengajuan dan tujuan tidak sama." };
          const allocated = state.distributions
            .filter((d) => d.requestId === requestId)
            .flatMap((d) => d.lines)
            .filter((l) => l.productId === productId)
            .reduce((a, l) => a + l.qtyAlokasi, 0);
          if (qty > Math.max(0, req.qty - allocated))
            return { ok: false, msg: `Melebihi sisa pengajuan (diminta ${req.qty}, sudah dialokasikan ${allocated}).` };
        }
        const seq = state.distributions.length + 22;
        const id = `DIST-2026-0${seq}`;
        const at = now();
        setState((prev) => ({
          ...prev,
          distributions: [
            {
              id, date: at.split(",")[0], from: "Pusat", branchId, status: "Menunggu Diterima",
              lines: [{ productId, qtyAlokasi: qty, qtyDiterima: 0 }],
              requestId, actor, note: note.trim(), idemKey: key,
            },
            ...prev.distributions,
          ],
          allocKeys: [...prev.allocKeys, key],
          audit: audit(prev, `Alokasi ${id} (Pusat → ${branchId}, ${prod.code} × ${qty})`, `ALOKASI/${id}`),
        }));
        return { ok: true, msg: `Alokasi ${id} tercatat (reservasi, menunggu penerimaan Admin).`, id };
      },

      confirmReceipt: (distributionId, productId, qty, note) => {
        if (!Number.isInteger(qty) || qty <= 0) return { ok: false, msg: "Jumlah diterima harus bilangan bulat lebih dari 0." };
        const dist = state.distributions.find((d) => d.id === distributionId);
        if (!dist || dist.branchId !== BRANCH_ID) return { ok: false, msg: "Distribusi tidak ditemukan untuk cabang ini." };
        const line = dist.lines.find((l) => l.productId === productId);
        if (!line) return { ok: false, msg: "Produk tidak termasuk dalam distribusi ini." };
        /* Kunci per posisi penerimaan: penerimaan bertahap tetap sah, double-submit tidak. */
        const key = `${distributionId}::${productId}::${line.qtyDiterima}::${qty}`;
        const sisa = line.qtyAlokasi - line.qtyDiterima;
        if (qty > sisa)
          return { ok: false, msg: `Melebihi sisa alokasi (${sisa}). Selisih/over-delivery butuh keputusan bisnis — belum diproses.` };
        setState((prev) => {
          if (prev.receipts.some((r) => r.idempotencyKey === key)) return prev;
          const s = prev.stock.find((x) => x.productId === productId);
          if (!s) return prev;
          const sebelum = s.saldo;
          const sesudah = sebelum + qty;
          const id = `RC-2026-${String(prev.receipts.length + 1).padStart(3, "0")}`;
          const p = prev.products.find((x) => x.id === productId);
          const distributions = prev.distributions.map((d) => {
            if (d.id !== distributionId) return d;
            const lines = d.lines.map((l) => (l.productId === productId ? { ...l, qtyDiterima: l.qtyDiterima + qty } : l));
            const done = lines.every((l) => l.qtyDiterima >= l.qtyAlokasi);
            const part = lines.some((l) => l.qtyDiterima > 0);
            return { ...d, lines, status: done ? ("Diterima" as const) : part ? ("Diterima Sebagian" as const) : d.status };
          });
          const mu: Mutation = {
            id: `MU-${String(prev.mutations.length + 1).padStart(4, "0")}`,
            at: now(), productId, branchId: BRANCH_ID, arah: "IN", sumber: "Penerimaan",
            qty, sebelum, sesudah, ref: id, actor: DEMO_ADMIN.name,
          };
          return {
            ...prev,
            stock: prev.stock.map((x) => (x.productId === productId ? { ...x, saldo: sesudah } : x)),
            distributions,
            receipts: [{ id, distributionId, productId, qty, at: now(), actor: DEMO_ADMIN.name, branchId: BRANCH_ID, idempotencyKey: key, note, selisih: qty - sisa }, ...prev.receipts],
            mutations: [mu, ...prev.mutations],
            audit: audit(prev, `Konfirmasi penerimaan ${id} (${p?.code} +${qty})`, `PENERIMAAN/${id}`),
          };
        });
        return { ok: true, msg: "Penerimaan tercatat. Stok bertambah tepat satu kali." };
      },

      transitionPO: (id, to, note, actor) => {
        const po = state.pos.find((p) => p.id === id);
        if (!po || po.branchId !== BRANCH_ID) return { ok: false, msg: "PO tidak ditemukan di cabang ini." };
        void to;

        if (PO_NEXT[po.status] !== to)
          return { ok: false, msg: `Transisi ${po.status} → ${to} tidak diizinkan. Jalur sah: Dipesan → Diproses → Sudah Datang → Selesai.` };
        if (to === "Selesai")
          return { ok: false, msg: "PO hanya dapat diselesaikan melalui transaksi pengambilan di Kasir." };
        setState((prev) => ({
          ...prev,
          pos: prev.pos.map((p) =>
            p.id === id
              ? { ...p, status: to, timeline: [...p.timeline, { at: now(), actor, from: p.status, to, note }] }
              : p,
          ),
          audit: audit(prev, `PO ${po.number}: ${po.status} → ${to}`, `PO/${id}`),
        }));
        return { ok: true, msg: `Status PO menjadi ${to}.` };
      },

      recordSale: (items, refNo, actor, method = "—", discount = 0, paid, change, customer, poId) => {
        if (state.saleRefs.includes(refNo)) return { ok: true, msg: "Transaksi sudah tercatat sebelumnya." }; // idempotent
        const po = poId ? state.pos.find((p) => p.id === poId) : undefined;
        if (poId && !po) return { ok: false, msg: "PO yang diambil tidak ditemukan." };
        if (po?.linkedTrx) return { ok: false, msg: `PO ${po.number} sudah diselesaikan oleh transaksi ${po.linkedTrx}.` };
        if (po && po.status !== "Sudah Datang")
          return { ok: false, msg: `PO ${po.number} berstatus ${po.status}. Transaksi pengambilan hanya untuk PO berstatus Sudah Datang.` };
        setState((prev) => {
          if (prev.saleRefs.includes(refNo)) return prev;
          let mutations = prev.mutations;
          let stock = prev.stock;
          let seq = prev.mutations.length;
          const at = now();
          for (const it of items) {
            const s = stock.find((x) => x.productId === it.id);
            if (!s) continue; // tanpa baris stok (mis. aksesoris) → lewati, tanpa error
            const deduct = Math.min(s.saldo, it.qty); // stok tidak boleh negatif
            if (deduct <= 0) continue;
            seq += 1;
            mutations = [
              { id: `MU-${String(seq).padStart(4, "0")}`, at, productId: it.id, branchId: BRANCH_ID, arah: "OUT", sumber: "Penjualan", qty: -deduct, sebelum: s.saldo, sesudah: s.saldo - deduct, ref: refNo, actor },
              ...mutations,
            ];
            stock = stock.map((x) => (x.productId === it.id ? { ...x, saldo: x.saldo - deduct } : x));
          }
          const gross = items.reduce((a, i) => a + i.price * i.qty, 0);
          const netTotal = Math.max(0, gross - discount);
          const trx: Transaction = {
            id: `T-${refNo}`, no: refNo, date: at.split(",")[0], time: at.split(",")[1]?.trim() ?? "",
            customer: customer?.name ?? "Pelanggan Kasir", phone: customer?.phone ?? "-", type: "Pembelian", total: netTotal,
            status: "Selesai", branchId: BRANCH_ID, method,
            discount: discount > 0 ? discount : undefined,
            paid: paid !== undefined ? paid : method === "Tunai" ? netTotal : undefined,
            change: change !== undefined ? change : method === "Tunai" ? 0 : undefined,
            poId: poId ?? undefined,
            products: items.map((i) => ({ id: i.id, name: i.name, brand: i.brand, qty: i.qty, price: i.price })),
          };
          return {
            ...prev,
            stock,
            mutations,
            saleRefs: [...prev.saleRefs, refNo],
            transactions: [trx, ...prev.transactions],
            pos: poId
              ? prev.pos.map((p) =>
                  p.id === poId
                    ? {
                        ...p,
                        status: "Selesai" as const,
                        linkedTrx: refNo,
                        timeline: [
                          ...p.timeline,
                          { at: `${at} WIB`, actor, from: "Sudah Datang", to: "Selesai" as const, note: `Diambil pelanggan · transaksi ${refNo}` },
                        ],
                      }
                    : p,
                )
              : prev.pos,
            audit: audit(prev, `Penjualan Kasir ${refNo} (${items.reduce((a, i) => a + i.qty, 0)} item)`, `JUAL/${refNo}`),
          };
        });
        return { ok: true, msg: po ? `Transaksi ${refNo} tercatat dan PO ${po.number} selesai.` : `Transaksi ${refNo} tercatat.` };
      },

      cancelSale: (no, reason, actor) => {
        const trx = state.transactions.find((t) => t.no === no);
        if (!trx) return { ok: false, msg: "Transaksi tidak ditemukan." };
        if (trx.status === "Dibatalkan") return { ok: false, msg: "Transaksi ini sudah dibatalkan." };
        if (trx.status !== "Selesai" && trx.status !== "Pending")
          return { ok: false, msg: "Hanya transaksi Selesai atau Pending yang dapat dibatalkan." };
        const clean = reason.trim();
        if (clean.length < 3) return { ok: false, msg: "Alasan pembatalan wajib diisi (minimal 3 karakter)." };
        const restored = (trx.products ?? []).filter((p) => p.id);
        setState((prev) => {
          const target = prev.transactions.find((t) => t.no === no);
          if (!target || target.status === "Dibatalkan") return prev;
          let stock = prev.stock;
          let mutations = prev.mutations;
          let seq = prev.mutations.length;
          const at = now();
          for (const p of target.products ?? []) {
            if (!p.id) continue;
            const s = stock.find((x) => x.productId === p.id);
            if (!s) continue;
            seq += 1;
            mutations = [
              {
                id: `MU-${String(seq).padStart(4, "0")}`,
                at,
                productId: p.id,
                branchId: target.branchId ?? BRANCH_ID,
                arah: "IN",
                sumber: "Pembatalan",
                qty: p.qty,
                sebelum: s.saldo,
                sesudah: s.saldo + p.qty,
                ref: `BATAL/${no}`,
                actor,
              },
              ...mutations,
            ];
            stock = stock.map((x) => (x.productId === p.id ? { ...x, saldo: x.saldo + p.qty } : x));
          }
          return {
            ...prev,
            stock,
            mutations,
            transactions: prev.transactions.map((t) =>
              t.no === no
                ? { ...t, status: "Dibatalkan", cancelReason: clean, cancelledAt: at, cancelledBy: actor }
                : t,
            ),
            pos: target.poId
              ? prev.pos.map((p) =>
                  p.id === target.poId
                    ? {
                        ...p,
                        status: "Sudah Datang" as const,
                        linkedTrx: undefined,
                        timeline: [
                          ...p.timeline,
                          { at: `${at} WIB`, actor, from: "Selesai" as const, to: "Sudah Datang" as const, note: `Transaksi ${no} dibatalkan — PO dapat diproses ulang` },
                        ],
                      }
                    : p,
                )
              : prev.pos,
            audit: audit(
              prev,
              `Pembatalan ${no} oleh ${actor}: ${clean}${restored.length ? ` · stok kembali (${restored.length} produk)` : ""}`,
              `BATAL/${no}`,
            ),
          };
        });
        return {
          ok: true,
          msg: restored.length
            ? "Transaksi dibatalkan dan stok produk dikembalikan."
            : "Transaksi dibatalkan. Stok tidak diubah (produk tidak tertaut ke data stok).",
        };
      },

      cancelPO: (id, reason, actor) => {
        const po = state.pos.find((p) => p.id === id);
        if (!po) return { ok: false, msg: "PO tidak ditemukan." };
        if (po.status === "Dibatalkan") return { ok: false, msg: "PO ini sudah dibatalkan." };
        if (po.status === "Sudah Datang" || po.status === "Selesai")
          return { ok: false, msg: "PO yang sudah datang/selesai tidak dapat dibatalkan." };
        const clean = reason.trim();
        if (clean.length < 3) return { ok: false, msg: "Alasan pembatalan wajib diisi (minimal 3 karakter)." };
        setState((prev) => ({
          ...prev,
          pos: prev.pos.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "Dibatalkan",
                  timeline: [...p.timeline, { at: now(), actor, from: p.status, to: "Dibatalkan", note: clean }],
                }
              : p,
          ),
          audit: audit(prev, `PO ${po.number} dibatalkan oleh ${actor}: ${clean}`, `PO/${id}`),
        }));
        return { ok: true, msg: "PO dibatalkan. Alasan tercatat di timeline." };
      },

      upsertUser: ({ id, name, email, password, role, branchId }) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanName) return "Nama wajib diisi.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return "Format email tidak valid.";
        if (!id && password.length < 6) return "Password minimal 6 karakter.";
        if (id && password && password.length < 6) return "Password minimal 6 karakter.";
        if (role !== "pemilik" && branchId !== BRANCH_ID) return "Cabang tidak valid (demo satu cabang).";
        const dupe = state.appUsers.some((u) => u.email.toLowerCase() === cleanEmail && u.id !== id);
        if (dupe) return "Email sudah dipakai pengguna lain.";
        if (id) {
          const target = state.appUsers.find((u) => u.id === id);
          if (!target) return "Pengguna tidak ditemukan.";
          if (target.role === "pemilik" && role !== "pemilik") {
            const otherOwners = state.appUsers.filter((u) => u.id !== id && u.role === "pemilik" && u.status === "Aktif");
            if (otherOwners.length === 0) return "Minimal satu Pemilik aktif harus tersisa.";
          }
          setState((prev) => ({
            ...prev,
            appUsers: prev.appUsers.map((u) =>
              u.id === id
                ? { ...u, name: cleanName, email: cleanEmail, ...(password ? { password } : {}), role, branchId: role === "pemilik" ? "all" : BRANCH_ID }
                : u,
            ),
            audit: audit(prev, `Ubah pengguna ${cleanEmail}`, `USER/${id}`),
          }));
        } else {
          const nid = `U-${Date.now().toString().slice(-5)}`;
          setState((prev) => ({
            ...prev,
            appUsers: [
              ...prev.appUsers,
              { id: nid, name: cleanName, email: cleanEmail, password, role, branchId: role === "pemilik" ? "all" : BRANCH_ID, status: "Aktif" },
            ],
            audit: audit(prev, `Tambah pengguna ${cleanEmail} (${role})`, `USER/${nid}`),
          }));
        }
        return null;
      },

      setUserStatus: (uid, status) => {
        const target = state.appUsers.find((u) => u.id === uid);
        if (!target) return "Pengguna tidak ditemukan.";
        if (status === "Nonaktif" && target.role === "pemilik") {
          const otherOwners = state.appUsers.filter((u) => u.id !== uid && u.role === "pemilik" && u.status === "Aktif");
          if (otherOwners.length === 0) return "Minimal satu Pemilik aktif harus tersisa.";
        }
        setState((prev) => ({
          ...prev,
          appUsers: prev.appUsers.map((u) => (u.id === uid ? { ...u, status } : u)),
          audit: audit(prev, `${status === "Aktif" ? "Aktifkan" : "Nonaktifkan"} pengguna ${target.email}`, `USER/${uid}`),
        }));
        return null;
      },

      upsertCustomer: ({ id, name, phone, email }) => {
        const cleanName = name.trim();
        const digits = phone.replace(/[^0-9]/g, "");
        if (!cleanName) return { ok: false, msg: "Nama pelanggan wajib diisi." };
        if (digits.length < 8 || digits.length > 15) return { ok: false, msg: "Nomor HP harus 8–15 digit angka." };
        const dupePhone = state.customers.find((c) => c.id !== id && c.phone.replace(/[^0-9]/g, "") === digits);
        if (dupePhone)
          return { ok: false, msg: `Nomor HP sudah terdaftar untuk ${dupePhone.name} (${dupePhone.code}).` };
        const cleanEmail = email.trim();
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
          return { ok: false, msg: "Format email tidak valid." };
        const initials = cleanName
          .split(/\s+/)
          .map((w) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase() || "PL";
        if (id) {
          const existing = state.customers.find((c) => c.id === id);
          if (!existing) return { ok: false, msg: "Pelanggan tidak ditemukan." };
          setState((prev) => ({
            ...prev,
            customers: prev.customers.map((c) =>
              c.id === id ? { ...c, name: cleanName, phone: phone.trim(), email: cleanEmail, initials } : c,
            ),
            audit: audit(prev, `Ubah pelanggan ${existing.code}`, `PELANGGAN/${existing.code}`),
          }));
          return { ok: true, msg: "", customer: { ...existing, name: cleanName, phone: phone.trim(), email: cleanEmail, initials } };
        }
        const n = state.customers.length + 1;
        const code = `PLG-${String(n).padStart(4, "0")}`;
        const next: Customer = {
          id: `C-${Date.now().toString().slice(-5)}`,
          code,
          name: cleanName,
          initials,
          phone: phone.trim(),
          email: cleanEmail,
          hasResep: false,
          poActive: 0,
          branch: "Padang",
        };
        setState((prev) => ({
          ...prev,
          customers: [...prev.customers, next],
          audit: audit(prev, `Tambah pelanggan ${cleanName}`, `PELANGGAN/${code}`),
        }));
        return { ok: true, msg: "", customer: next };
      },

      createResep: ({ customerId, date, od, os, pd, add, note }) => {
        const customer = state.customers.find((c) => c.id === customerId);
        if (!customer) return "Pelanggan wajib dipilih.";
        if (!od.sph.trim() || !os.sph.trim()) return "SPH OD dan OS wajib diisi.";
        if (!pd.trim()) return "PD wajib diisi.";
        const invalid = validateResep({ date, od, os, pd, add });
        if (invalid) return invalid;
        setState((prev) => {
          const ids = prev.reseps
            .map((r) => Number(r.id.replace(/[^0-9]/g, "")))
            .filter((x) => Number.isFinite(x));
          const nextId = `RX-${String(Math.max(0, ...ids) + 1).padStart(3, "0")}`;
          const record: ResepRecord = {
            id: nextId,
            customer: customer.name,
            initials: customer.initials,
            date: date.trim() || now().split(",")[0],
            od: { sph: od.sph.trim(), cyl: od.cyl.trim() || "0.00", axis: od.axis.trim() || "-" },
            os: { sph: os.sph.trim(), cyl: os.cyl.trim() || "0.00", axis: os.axis.trim() || "-" },
            pd: pd.trim(),
            add: add.trim() || "-",
            note: note.trim() || "-",
            status: "Aktif",
          };
          return {
            ...prev,
            reseps: [record, ...prev.reseps],
            customers: prev.customers.map((c) => (c.id === customerId ? { ...c, hasResep: true } : c)),
            audit: audit(prev, `Tambah resep ${nextId} (${customer.name})`, `RESEP/${nextId}`),
          };
        });
        return null;
      },

      updateResep: ({ id, date, od, os, pd, add, note }) => {
        if (!od.sph.trim() || !os.sph.trim()) return "SPH OD dan OS wajib diisi.";
        if (!pd.trim()) return "PD wajib diisi.";
        const invalid = validateResep({ date, od, os, pd, add });
        if (invalid) return invalid;
        setState((prev) => {
          const target = prev.reseps.find((r) => r.id === id);
          if (!target) return prev;
          return {
            ...prev,
            reseps: prev.reseps.map((r) =>
              r.id === id
                ? {
                    ...r,
                    date: date.trim() || r.date,
                    od: { sph: od.sph.trim(), cyl: od.cyl.trim() || "0.00", axis: od.axis.trim() || "-" },
                    os: { sph: os.sph.trim(), cyl: os.cyl.trim() || "0.00", axis: os.axis.trim() || "-" },
                    pd: pd.trim(),
                    add: add.trim() || "-",
                    note: note !== undefined ? (note.trim() || "-") : r.note,
                  }
                : r,
            ),
            audit: audit(prev, `Perbarui resep ${id} (${target.customer})`, `RESEP/${id}`),
          };
        });
        return null;
      },

      completePendingSale: (no, actor) => {
        const trx = state.transactions.find((t) => t.no === no);
        if (!trx) return { ok: false, msg: "Transaksi tidak ditemukan." };
        if (trx.status !== "Pending") return { ok: false, msg: "Hanya transaksi berstatus Pending yang dapat dikonfirmasi lunas." };
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.no === no ? { ...t, status: "Selesai", paid: t.paid ?? t.total, change: t.change ?? 0 } : t,
          ),
          audit: audit(prev, `Konfirmasi pelunasan transaksi ${no} oleh ${actor}`, `LUNAS/${no}`),
        }));
        return { ok: true, msg: `Transaksi ${no} berhasil dikonfirmasi Lunas (Selesai).` };
      },

      setResepStatus: (id, status) => {
        setState((prev) => {
          const target = prev.reseps.find((r) => r.id === id);
          if (!target) return prev;
          const nextReseps = prev.reseps.map((r) => (r.id === id ? { ...r, status } : r));
          const hasAnyActive = nextReseps.some((r) => r.customer === target.customer && r.status === "Aktif");
          return {
            ...prev,
            reseps: nextReseps,
            customers: prev.customers.map((c) => (c.name === target.customer ? { ...c, hasResep: hasAnyActive } : c)),
            audit: audit(prev, `Ubah status resep ${id} (${target.customer}) → ${status}`, `RESEP/${id}`),
          };
        });
      },

      saveSettings: (input) => {
        if (!Number.isInteger(input.defaultMinimum) || input.defaultMinimum < 0) return "Minimum default harus bilangan bulat ≥ 0.";
        if (!input.storeName.trim()) return "Nama toko wajib diisi.";
        setState((prev) => ({
          ...prev,
          settings: {
            defaultMinimum: input.defaultMinimum,
            storeName: input.storeName.trim(),
            storePhone: input.storePhone.trim(),
            storeAddress: input.storeAddress.trim(),
          },
          audit: audit(prev, "Ubah pengaturan toko", "PENGATURAN/TOKO"),
        }));
        return null;
      },

      authenticate: (email, password) => {
        const u = state.appUsers.find(
          (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password && x.status === "Aktif",
        );
        if (!u) return null;
        const initials = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        return {
          role: u.role,
          name: u.name,
          initials,
          branch:
            u.role === "pemilik"
              ? "Seluruh Cabang"
              : state.branches.find((b) => b.id === u.branchId)?.name ?? "Cabang",
          branchId: u.branchId,
          email: u.email,
        };
      },
    };
  }, [state]);

  // Hook uji DEV (otomasi QA): ekspos aksi tulis agar idempotency/konkurensi
  // dapat diuji langsung. Tidak dipakai kode produksi.
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __simpos?: unknown }).__simpos = {
        recordSale: value.recordSale,
        createAllocation: value.createAllocation,
        availableToAllocate: value.availableToAllocate,
        transitionPO: value.transitionPO,
        confirmReceipt: value.confirmReceipt,
        createPO: value.createPO,
      };
    }
  }, [value]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSharedStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSharedStore must be used within SharedProvider");
  return ctx;
}

/** Alias kompatibilitas Tahap-01. */
export const useAdminStore = useSharedStore;
