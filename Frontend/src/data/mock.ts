export type PoStatus = "Dipesan" | "Diproses" | "Sudah Datang" | "Selesai" | "Dibatalkan";

export type PoOrder = {
  id: string;
  number: string;
  date: string;
  customer: string;
  initials: string;
  phone: string;
  products: string[];
  productLabel: string;
  status: PoStatus;
  createdAt: string;
  note: string;
  items: Array<{ name: string; sub: string; qty: number; price?: number; productId?: string }>;
  /** Estimasi nilai pesanan (harga satuan × jumlah). */
  total?: number;
  resep?: boolean;
};

/** Data PO DEMO untuk simulasi frontend. */
export const ORDERS: PoOrder[] = [
  {
    id: "PO-2026-0108",
    number: "PO-2026-0108",
    date: "10 Okt 2026",
    customer: "Siti Rahma",
    initials: "SR",
    phone: "0812 3456 7890",
    products: ["Lensa Single Vision", "Lensa - Essilor"],
    productLabel: "Lensa Single Vision",
    status: "Sudah Datang",
    createdAt: "10 Oktober 2026 · 14.24 WIB",
    note: "Hubungi pelanggan saat pesanan tersedia.",
    resep: true,
    items: [
      { name: "Lensa Single Vision", sub: "Lensa · Essilor", qty: 1 },
      { name: "Frame Titanium Classic", sub: "Frame · Ray-Ban", qty: 1 },
    ],
  },
  {
    id: "PO-2026-0107",
    number: "PO-2026-0107",
    date: "10 Okt 2026",
    customer: "Andi Saputra",
    initials: "AS",
    phone: "0813 7788 3401",
    products: ["Frame Titanium Classic", "Frame · Ray-Ban"],
    productLabel: "Frame Titanium Classic",
    status: "Diproses",
    createdAt: "10 Oktober 2026 · 11.02 WIB",
    note: "Pembuatan lensa mengikuti resep terlampir.",
    resep: true,
    items: [
      { name: "Frame Titanium Classic", sub: "Frame · Ray-Ban", qty: 1 },
      { name: "Lensa Blue Control", sub: "Lensa · Hoya", qty: 1 },
    ],
  },
  {
    id: "PO-2026-0106",
    number: "PO-2026-0106",
    date: "09 Okt 2026",
    customer: "Maya Putri",
    initials: "MP",
    phone: "0822 9900 1112",
    products: ["Lensa Blue Control", "Lensa · Hoya"],
    productLabel: "Lensa Blue Control",
    status: "Dipesan",
    createdAt: "09 Oktober 2026 · 16.40 WIB",
    note: "Menunggu pemrosesan admin cabang.",
    resep: false,
    items: [{ name: "Lensa Blue Control", sub: "Lensa · Hoya", qty: 1 }],
  },
  {
    id: "PO-2026-0103",
    number: "PO-2026-0103",
    date: "08 Okt 2026",
    customer: "Dimas Pratama",
    initials: "DP",
    phone: "0831 1188 5500",
    products: ["Frame Urban Square", "Frame · Oakley"],
    productLabel: "Frame Urban Square",
    status: "Selesai",
    createdAt: "08 Oktober 2026 · 09.15 WIB",
    note: "Pesanan selesai dan sudah diambil pelanggan.",
    resep: false,
    items: [{ name: "Frame Urban Square", sub: "Frame · Oakley", qty: 1 }],
  },
];

export type TrxStatus = "Selesai" | "Pending" | "Dibatalkan";

export type Transaction = {
  id: string;
  date: string;
  time: string;
  no: string;
  customer: string;
  phone: string;
  type: "Pembelian" | "Pemesanan";
  total: number;
  discount?: number; // potongan rupiah pada transaksi kasir (0/kosong = tanpa diskon)
  paid?: number; // jumlah uang dibayar pada pembayaran tunai
  change?: number; // kembalian pada pembayaran tunai
  status: TrxStatus;
  branchId?: string; // backfill 'cabang-padang' di shared store; tanpa efek render
  method?: string; // metode pembayaran tercatat (transaksi baru); seed lama "-"
  poId?: string; // PO yang diambil melalui transaksi ini
  detail?: "resep" | "struk" | "produk";
  products?: Array<{ id?: string; name: string; brand: string; qty: number; price: number }>;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
};

/** Riwayat transaksi DEMO. */
export const TRANSACTIONS: Transaction[] = [
  {
    id: "T1", no: "TRX-20260812-001", date: "12 Agu 2026", time: "14:23", customer: "Rian Pratama", phone: "085277129011",
    type: "Pembelian", method: "Tunai", paid: 800_000, change: 0, total: 800_000, status: "Selesai",
    products: [{ name: "Paket Case & Lap", brand: "Optik Mekar Jaya", qty: 1, price: 150_000 }, { name: "Lensa Single Vision", brand: "Essilor", qty: 1, price: 650_000 }],
  },
  {
    id: "T2", no: "TRX-20260812-002", date: "12 Agu 2026", time: "11:10", customer: "Siti Nurhaliza", phone: "081234567890",
    type: "Pembelian", method: "QRIS", total: 1_200_000, status: "Selesai",
    products: [{ name: "Frame Bella Round", brand: "Vogue", qty: 1, price: 1_200_000 }],
  },
  {
    id: "T3", no: "TRX-20260811-003", date: "11 Agu 2026", time: "16:45", customer: "Andi Saputra", phone: "089612345678",
    type: "Pemesanan", method: "Transfer Bank", total: 950_000, status: "Selesai",
    products: [{ name: "Lensa Progressive", brand: "Zeiss", qty: 1, price: 950_000 }],
  },
  {
    id: "T4", no: "TRX-20260811-002", date: "11 Agu 2026", time: "13:20", customer: "Maya Lestari", phone: "082199887766",
    type: "Pembelian", method: "Tunai", paid: 500_000, change: 50_000, total: 450_000, status: "Selesai", detail: "resep",
    products: [{ name: "Lensa Single Vision", brand: "Essilor", qty: 1, price: 450_000 }],
  },
  {
    id: "T5", no: "TRX-20260810-001", date: "10 Agu 2026", time: "10:05", customer: "Dedi Rahman", phone: "081366778899",
    type: "Pembelian", method: "Kartu Debit/Kredit", total: 1_350_000, status: "Selesai", detail: "produk",
    products: [{ name: "3Clear Black Round", brand: "Makar Eyewear", qty: 1, price: 450_000 }, { name: "Lensa Blue Control", brand: "Hoya", qty: 1, price: 900_000 }],
  },
  {
    id: "T6", no: "TRX-20260809-004", date: "09 Agu 2026", time: "17:30", customer: "Fitri Ananda", phone: "085122334455",
    type: "Pembelian", method: "Tunai", total: 600_000, status: "Dibatalkan",
    products: [{ name: "3Clear Black Round", brand: "Makar Eyewear", qty: 1, price: 450_000 }],
  },
  {
    id: "T7", no: "TRX-20260809-003", date: "09 Agu 2026", time: "12:15", customer: "Zulfa Ramadhani", phone: "082311223344",
    type: "Pemesanan", method: "Transfer Bank", total: 750_000, status: "Selesai",
    products: [{ name: "Lensa Single Vision", brand: "Zeiss", qty: 1, price: 350_000 }],
  },
  {
    id: "T8", no: "TRX-20260808-002", date: "08 Agu 2026", time: "15:40", customer: "Hendra Wijaya", phone: "081299876665",
    type: "Pembelian", method: "QRIS", total: 950_000, status: "Selesai",
    products: [{ name: "Frame AirFlex", brand: "Excellence", qty: 1, price: 800_000 }],
  },
  {
    id: "T9", no: "TRX-20260808-001", date: "08 Agu 2026", time: "09:20", customer: "Nadia Putri", phone: "082273459988",
    type: "Pembelian", method: "Tunai", paid: 500_000, change: 0, total: 500_000, status: "Selesai",
    products: [{ name: "Cleaning Kit", brand: "Makar Eyewear", qty: 1, price: 90_000 }, { name: "Paket Case & Lap", brand: "Optik Mekar Jaya", qty: 1, price: 150_000 }],
  },
  /* Riwayat lebih lama — dipakai grafik "periode sebelumnya" di Dashboard Pemilik.
     Additif: di-backfill ke localStorage lama lewat id H*, tidak menimpa data pengguna. */
  {
    id: "H1", no: "TRX-20260620-001", date: "20 Jun 2026", time: "10:15", customer: "Rian Pratama", phone: "085277129011",
    type: "Pembelian", total: 1_200_000, status: "Selesai", detail: "produk",
    products: [{ name: "Frame Bella Round", brand: "Vogue", qty: 1, price: 1_200_000 }],
  },
  {
    id: "H2", no: "TRX-20260623-001", date: "23 Jun 2026", time: "14:40", customer: "Siti Maulida", phone: "081234567890",
    type: "Pembelian", total: 800_000, status: "Selesai", detail: "produk",
    products: [{ name: "Lensa Single Vision", brand: "Essilor", qty: 1, price: 650_000 }, { name: "Paket Case & Lap", brand: "Optik Mekar Jaya", qty: 1, price: 150_000 }],
  },
  {
    id: "H3", no: "TRX-20260627-001", date: "27 Jun 2026", time: "11:05", customer: "Andi Saputra", phone: "089612345678",
    type: "Pembelian", total: 1_750_000, status: "Selesai", detail: "resep",
    products: [{ name: "Lensa Progressive", brand: "Zeiss", qty: 1, price: 950_000 }, { name: "Frame AirFlex", brand: "Excellence", qty: 1, price: 800_000 }],
  },
  {
    id: "H4", no: "TRX-20260630-001", date: "30 Jun 2026", time: "16:20", customer: "Nadia Amelia", phone: "082166778899",
    type: "Pembelian", total: 1_350_000, status: "Selesai", detail: "produk",
    products: [{ name: "3Clear Black Round", brand: "Makar Eyewear", qty: 1, price: 450_000 }, { name: "Lensa Blue Control", brand: "Hoya", qty: 1, price: 900_000 }],
  },
  {
    id: "H5", no: "TRX-20260703-001", date: "03 Jul 2026", time: "09:35", customer: "Dimas Hidayat", phone: "085311223344",
    type: "Pembelian", total: 890_000, status: "Selesai", detail: "produk",
    products: [{ name: "Frame AirFlex", brand: "Excellence", qty: 1, price: 800_000 }, { name: "Cleaning Kit", brand: "Makar Eyewear", qty: 1, price: 90_000 }],
  },
  {
    id: "H6", no: "TRX-20260706-001", date: "06 Jul 2026", time: "13:50", customer: "Maya Lestari", phone: "082199887766",
    type: "Pembelian", total: 450_000, status: "Selesai", detail: "resep",
    products: [{ name: "Lensa Single Vision", brand: "Essilor", qty: 1, price: 450_000 }],
  },
  {
    id: "H7", no: "TRX-20260709-001", date: "09 Jul 2026", time: "15:10", customer: "Dedi Rahman", phone: "081366778899",
    type: "Pembelian", total: 1_100_000, status: "Selesai", detail: "resep",
    products: [{ name: "Lensa Progressive", brand: "Zeiss", qty: 1, price: 950_000 }, { name: "Paket Case & Lap", brand: "Optik Mekar Jaya", qty: 1, price: 150_000 }],
  },
  {
    id: "H8", no: "TRX-20260712-001", date: "12 Jul 2026", time: "10:45", customer: "Fitri Ananda", phone: "085122334455",
    type: "Pembelian", total: 1_200_000, status: "Selesai", detail: "produk",
    products: [{ name: "Frame Bella Round", brand: "Vogue", qty: 1, price: 1_200_000 }],
  },
  {
    id: "H9", no: "TRX-20260715-001", date: "15 Jul 2026", time: "12:30", customer: "Zulfa Ramadhani", phone: "082311223344",
    type: "Pembelian", total: 900_000, status: "Selesai", detail: "produk",
    products: [{ name: "Lensa Blue Control", brand: "Hoya", qty: 1, price: 900_000 }],
  },
  {
    id: "H10", no: "TRX-20260718-001", date: "18 Jul 2026", time: "16:05", customer: "Hendra Wijaya", phone: "081299876665",
    type: "Pembelian", total: 1_450_000, status: "Selesai", detail: "resep",
    products: [{ name: "Frame AirFlex", brand: "Excellence", qty: 1, price: 800_000 }, { name: "Lensa Single Vision", brand: "Essilor", qty: 1, price: 650_000 }],
  },
  {
    id: "H11", no: "TRX-20260722-001", date: "22 Jul 2026", time: "09:10", customer: "Nadia Putri", phone: "082273459988",
    type: "Pembelian", total: 240_000, status: "Selesai", detail: "produk",
    products: [{ name: "Cleaning Kit", brand: "Makar Eyewear", qty: 1, price: 90_000 }, { name: "Paket Case & Lap", brand: "Optik Mekar Jaya", qty: 1, price: 150_000 }],
  },
  {
    id: "H12", no: "TRX-20260725-001", date: "25 Jul 2026", time: "14:25", customer: "Rian Pratama", phone: "085277129011",
    type: "Pembelian", total: 1_200_000, status: "Selesai", detail: "produk",
    products: [{ name: "Frame Bella Round", brand: "Vogue", qty: 1, price: 1_200_000 }],
  },
];

export type PaymentMethod = "Tunai" | "Transfer Bank" | "Kartu Debit/Kredit" | "QRIS";

/** Pembayaran DEMO. */
export const PAYMENTS: Array<{
  no: string; date: string; method: PaymentMethod; customer: string; amount: number; status: "Lunas" | "Pending" | "Dibatalkan";
}> = [
  { no: "PMT-20261010-001", date: "10 Okt 2026", method: "Tunai", customer: "Andi Saputra", amount: 3_441_000, status: "Lunas" },
  { no: "PMT-20261009-002", date: "09 Okt 2026", method: "QRIS", customer: "Siti Rahma", amount: 1_720_000, status: "Lunas" },
  { no: "PMT-20261009-001", date: "09 Okt 2026", method: "Transfer Bank", customer: "Maya Putri", amount: 1_250_000, status: "Pending" },
  { no: "PMT-20261008-003", date: "08 Okt 2026", method: "Kartu Debit/Kredit", customer: "Dimas Pratama", amount: 2_100_000, status: "Lunas" },
  { no: "PMT-20261007-001", date: "07 Okt 2026", method: "Tunai", customer: "Nadia Amelia", amount: 950_000, status: "Lunas" },
];

/** Daftar resep DEMO. */
export type ResepRecord = {
  id: string; customer: string; initials: string; date: string;
  od: { sph: string; cyl: string; axis: string }; os: { sph: string; cyl: string; axis: string };
  pd: string; add: string; note?: string; status: "Aktif" | "Expired" | "Kedaluwarsa";
};

export const RESEP_RECORDS: ResepRecord[] = [
  { id: "RX-001", customer: "Andi Saputra", initials: "AS", date: "12 Mar 2026", od: { sph: "-1.50", cyl: "-0.75", axis: "180" }, os: { sph: "-1.25", cyl: "-0.50", axis: "170" }, pd: "32.0", add: "+1.00", note: "Pemeriksaan komputer & lensa baca", status: "Aktif" },
  { id: "RX-002", customer: "Rian Pratama", initials: "RP", date: "02 Feb 2026", od: { sph: "-2.00", cyl: "-0.50", axis: "175" }, os: { sph: "-1.75", cyl: "-0.25", axis: "5" }, pd: "31.5", add: "+1.25", note: "Lensa progressive harian", status: "Aktif" },
  { id: "RX-003", customer: "Siti Maulida", initials: "SM", date: "20 Jan 2026", od: { sph: "+1.00", cyl: "-0.75", axis: "90" }, os: { sph: "+1.25", cyl: "-0.50", axis: "85" }, pd: "30.5", add: "+2.00", note: "Resep dokter mata (baca & jalan)", status: "Aktif" },
  { id: "RX-004", customer: "Nadia Amelia", initials: "NA", date: "05 Jan 2026", od: { sph: "-0.75", cyl: "-1.00", axis: "160" }, os: { sph: "-0.50", cyl: "-0.75", axis: "15" }, pd: "32.5", add: "-", note: "Lensa blue control komputer", status: "Aktif" },
  { id: "RX-005", customer: "Dedi Rahman", initials: "DR", date: "30 Nov 2025", od: { sph: "-3.25", cyl: "-0.50", axis: "180" }, os: { sph: "-3.00", cyl: "-0.25", axis: "175" }, pd: "33.0", add: "+1.75", note: "Pemeriksaan rutin tahunan", status: "Expired" },
  { id: "RX-006", customer: "Dimas Hidayat", initials: "DH", date: "18 Des 2025", od: { sph: "-0.25", cyl: "-0.25", axis: "10" }, os: { sph: "-0.50", cyl: "-0.25", axis: "170" }, pd: "31.0", add: "-", note: "Lensa single vision anti-radiasi", status: "Expired" },
];