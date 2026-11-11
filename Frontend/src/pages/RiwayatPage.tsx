import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Download,
  Printer,
  QrCode,
  Wallet,
  X,
} from "lucide-react";
import { type PaymentMethod, type ResepRecord, type Transaction, type TrxStatus } from "../data/mock";
import { useSharedStore, BRANCH_ID } from "../store/sharedStore";
import { useAuth } from "../store/auth";
import { exportCsv, inPeriod, periodRange, stamp } from "../store/reports";
import { kasirApi, type ApiTransaction, type ApiTransactionItem } from "../lib/api";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill, formatIDR } from "../components/ui";
import MRLogo from "../components/MRLogo";
import "../styles/pages.css";
import "../styles/admin.css";

type RiwayatPeriod = "semua" | "hari" | "mingguan" | "bulanan" | "okt-2026" | "sep-2026" | "agu-2026" | "custom";

const PERIOD_OPTIONS: Array<{ value: RiwayatPeriod; label: string }> = [
  { value: "semua", label: "Semua Periode" },
  { value: "hari", label: "Hari Ini" },
  { value: "mingguan", label: "Minggu Ini" },
  { value: "bulanan", label: "Bulan Ini" },
  { value: "okt-2026", label: "Oktober 2026" },
  { value: "sep-2026", label: "September 2026" },
  { value: "agu-2026", label: "Agustus 2026" },
  { value: "custom", label: "Pilih Rentang Tanggal..." },
];

function resolveRiwayatRange(period: RiwayatPeriod, customFrom: string, customTo: string) {
  if (period === "okt-2026") {
    return {
      from: new Date(2026, 9, 1).getTime(),
      to: new Date(2026, 9, 31, 23, 59, 59, 999).getTime(),
      label: "01 Okt – 31 Okt 2026",
    };
  }
  if (period === "sep-2026") {
    return {
      from: new Date(2026, 8, 1).getTime(),
      to: new Date(2026, 8, 30, 23, 59, 59, 999).getTime(),
      label: "01 Sep – 30 Sep 2026",
    };
  }
  if (period === "agu-2026") {
    return {
      from: new Date(2026, 7, 1).getTime(),
      to: new Date(2026, 7, 31, 23, 59, 59, 999).getTime(),
      label: "01 Agu – 31 Agu 2026",
    };
  }
  return periodRange(period, customFrom, customTo);
}

const FILTERS: Array<"Semua" | TrxStatus> = ["Semua", "Selesai", "Dibatalkan"];
const METHOD_FILTERS: Array<"Semua" | PaymentMethod> = [
  "Semua",
  "Tunai",
  "Transfer Bank",
  "Kartu Debit/Kredit",
  "QRIS",
  "E-Wallet",
];

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  Tunai: Banknote,
  "Transfer Bank": Wallet,
  "Kartu Debit/Kredit": CreditCard,
  QRIS: QrCode,
  "E-Wallet": Wallet,
};

const methodShort = (method: PaymentMethod) =>
  method === "Kartu Debit/Kredit" ? "Kartu" : method;

type StrukBodyProps = {
  trx: Transaction;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  branch: string;
  cashier: string;
};

function StrukBody({ trx, storeName, storePhone, storeAddress, branch, cashier }: StrukBodyProps) {
  const method = (trx.method as PaymentMethod | undefined) ?? "Tunai";
  const discount = trx.discount ?? 0;
  const subtotal = trx.total + discount;
  const paid = trx.paid ?? trx.total;
  const change = trx.change ?? Math.max(0, paid - trx.total);
  const items =
    trx.products && trx.products.length
      ? trx.products
      : [{ name: trx.type, brand: "-", qty: 1, price: trx.total }];

  return (
    <>
      <div className="struk-brand">
        <div className="struk-logo">
          <MRLogo size={44} />
        </div>
        <b>{storeName}</b>
        <span>
          {branch} · {storePhone}
        </span>
        <span>{storeAddress}</span>
      </div>
      <div className="struk-meta">
        <div>
          <span>No. Nota</span>
          <b>{trx.no}</b>
        </div>
        <div>
          <span>Tanggal</span>
          <b>
            {trx.date}, {trx.time}
          </b>
        </div>
        <div>
          <span>Kasir</span>
          <b>{cashier}</b>
        </div>
        <div>
          <span>Pelanggan</span>
          <b>{trx.customer}</b>
        </div>
        {trx.poId ? (
          <div>
            <span>Pengambilan PO</span>
            <b>{trx.poId}</b>
          </div>
        ) : null}
      </div>
      <div className="struk-items">
        {items.map((p) => (
          <div className="struk-line" key={p.name}>
            <span>
              {p.name}
              <small>
                {p.qty} × {formatIDR(p.price)}
              </small>
            </span>
            <b>{formatIDR(p.qty * p.price)}</b>
          </div>
        ))}
      </div>
      <div className="struk-totals">
        <div>
          <span>Subtotal</span>
          <b>{formatIDR(subtotal)}</b>
        </div>
        <div>
          <span>Diskon</span>
          <b>{formatIDR(discount)}</b>
        </div>
        <div className="struk-grand">
          <span>Total</span>
          <b>{formatIDR(trx.total)}</b>
        </div>
        {method === "Tunai" ? (
          <>
            <div>
              <span>Tunai (Dibayar)</span>
              <b>{formatIDR(paid)}</b>
            </div>
            <div>
              <span>Kembalian</span>
              <b>{formatIDR(change)}</b>
            </div>
          </>
        ) : null}
      </div>
      <div className="struk-foot">
        <span>Metode: {method}</span>
        <span>Status: {trx.status === "Selesai" ? "Lunas" : trx.status}</span>
        <span>Terima kasih · Barang yang sudah dibeli tidak dapat ditukar</span>
      </div>
    </>
  );
}

export default function RiwayatPage() {
  const shared = useSharedStore();
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [detailProducts, setDetailProducts] = useState<Record<string, NonNullable<Transaction["products"]>>>({});
  const [selectedRx, setSelectedRx] = useState<ResepRecord | undefined>();
  const [loadError, setLoadError] = useState("");
  const [period, setPeriod] = useState<RiwayatPeriod>("semua");
  const [customFrom, setCustomFrom] = useState("2026-08-01");
  const [customTo, setCustomTo] = useState("2026-10-31");
  const [filter, setFilter] = useState<"Semua" | TrxStatus>("Semua");
  const [methodFilter, setMethodFilter] = useState<"Semua" | PaymentMethod>("Semua");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strukId, setStrukId] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);

  const range = resolveRiwayatRange(period, customFrom, customTo);

  const loadTransactions = async () => {
    try {
      const rows = await kasirApi.transactions();
      setTransactions(rows.map((row: ApiTransaction): Transaction => {
        const dateTime = new Date(row.tanggal_transaksi.replace(" ", "T"));
        return {
          id: String(row.id_transaksi),
          date: dateTime.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          time: dateTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"),
          no: row.kode_transaksi,
          customer: row.nama_pelanggan ?? "-",
          phone: row.no_hp ?? "-",
          type: row.jenis === "pembelian" ? "Pembelian" : "Pemesanan",
          total: Number(row.total),
          discount: Number(row.diskon),
          tax: Number(row.pajak),
          paid: Number(row.jumlah_bayar ?? row.total),
          change: Math.max(0, Number(row.jumlah_bayar ?? row.total) - Number(row.total)),
          status: row.status === "dibatalkan" ? "Dibatalkan" : row.status === "pending" ? "Pending" : "Selesai",
          branchId: BRANCH_ID,
          method: (row.metode_pembayaran ?? "Tunai") as PaymentMethod,
        };
      }));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Riwayat transaksi gagal dimuat dari database.");
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setSelectedRx(undefined);
    kasirApi.transaction(Number(selectedId))
      .then(async ({ transaction, items }) => {
        if (!active) return;
        setDetailProducts((previous) => ({
          ...previous,
          [selectedId]: items.map((item: ApiTransactionItem) => ({
            id: String(item.barang_id),
            name: item.nama_barang,
            brand: item.merek ?? "-",
            qty: Number(item.jumlah),
            price: Number(item.harga),
          })),
        }));
        const recipes = await kasirApi.recipes(transaction.pelanggan_id, "aktif");
        if (!active) return;
        const recipe = recipes[0];
        setSelectedRx(recipe ? {
          id: String(recipe.id_resep),
          customer: recipe.nama_pelanggan,
          initials: recipe.nama_pelanggan.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(),
          date: recipe.tanggal_resep,
          od: { sph: recipe.od_sph ?? "", cyl: recipe.od_cyl ?? "", axis: recipe.od_axis ?? "" },
          os: { sph: recipe.os_sph ?? "", cyl: recipe.os_cyl ?? "", axis: recipe.os_axis ?? "" },
          pd: recipe.pd ?? "",
          add: recipe.add_power ?? "-",
          note: recipe.catatan ?? "-",
          status: "Aktif",
        } : undefined);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Rincian transaksi gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const byPeriod = transactions.filter(
    (t) =>
      (t.branchId ?? BRANCH_ID) === BRANCH_ID &&
      inPeriod(`${t.date}${t.time ? `, ${t.time}` : ""}`, range.from, range.to),
  );

  const byMethod = byPeriod.filter((t) =>
    methodFilter === "Semua" ? true : (t.method ?? "Tunai") === methodFilter,
  );

  const rows = byMethod
    .filter((t) => (filter === "Semua" ? true : t.status === filter))
    .filter((t) =>
      `${t.no} ${t.customer} ${t.phone} ${t.method ?? "Tunai"} ${t.type}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  const selesaiRows = byMethod.filter((t) => t.status === "Selesai");
  const received = selesaiRows.reduce((sum, t) => sum + t.total, 0);
  const cashTotal = selesaiRows
    .filter((t) => (t.method ?? "Tunai") === "Tunai")
    .reduce((sum, t) => sum + t.total, 0);
  const nonCashTotal = selesaiRows
    .filter((t) => (t.method ?? "Tunai") !== "Tunai")
    .reduce((sum, t) => sum + t.total, 0);

  const visibleRows = rows.slice(0, pageSize);
  const selectedRow = selectedId ? transactions.find((t) => t.id === selectedId) : undefined;
  const selected = selectedRow ? { ...selectedRow, products: detailProducts[selectedRow.id] ?? selectedRow.products } : undefined;
  const active = strukId ? transactions.find((t) => t.id === strukId) : undefined;
  const selectedMethod = (selected?.method as PaymentMethod | undefined) ?? "Tunai";
  const SelectedMethodIcon = METHOD_ICON[selectedMethod] ?? Banknote;
  const selectedDiscount = selected?.discount ?? 0;
  const selectedSubtotal = (selected?.total ?? 0) + selectedDiscount;
  const selectedPaid =
    selectedMethod === "Tunai" ? (selected?.paid ?? selected?.total ?? 0) : (selected?.total ?? 0);
  const selectedChange =
    selectedMethod === "Tunai"
      ? (selected?.change ?? Math.max(0, selectedPaid - (selected?.total ?? 0)))
      : 0;
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  // Cetak struk langsung (tanpa pratinjau): render struk tersembunyi lalu buka dialog print.
  const openStrukFor = (id: string) => {
    setStrukId(id);
  };

  useEffect(() => {
    if (!strukId) return;
    const done = () => setStrukId(null);
    window.addEventListener("afterprint", done);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [strukId]);

  const doExport = () => {
    if (rows.length === 0) {
      setNotice(true);
      return;
    }
    const branchName = session?.branch ?? "Cabang";
    exportCsv(
      `Laporan Riwayat Transaksi & Pembayaran - ${branchName}`,
      [
        ["Periode", range.label],
        ["Status", filter],
        ["Metode Pembayaran", methodFilter],
        ["Jumlah baris", String(rows.length)],
      ],
      [
        "No. Transaksi",
        "Tanggal",
        "Jam",
        "Pelanggan",
        "Jenis",
        "Metode Pembayaran",
        "Total (Rp)",
        "Dibayar (Rp)",
        "Kembalian (Rp)",
        "Status",
      ],
      rows.map((t) => {
        const method = t.method ?? "Tunai";
        const paid = method === "Tunai" ? (t.paid ?? t.total) : t.total;
        const change = method === "Tunai" ? (t.change ?? Math.max(0, paid - t.total)) : 0;
        return [t.no, t.date, t.time, t.customer, t.type, method, t.total, paid, change, t.status];
      }),
      ["TOTAL", "", "", "", "", "", rows.reduce((s, t) => s + t.total, 0), "", "", ""],
      `Riwayat-Pembayaran-${branchName.replace(/[^A-Za-z0-9]+/g, "-")}-${stamp()}.csv`,
    );
    setNotice(true);
  };

  return (
    <div className="page">
      <PageHeader
        title="Riwayat Transaksi"
        actions={
          <>
            <label className="period-pill-select" title="Pilih periode tanggal transaksi">
              <CalendarDays size={15} />
              <select
                aria-label="Periode Tanggal Transaksi"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as RiwayatPeriod);
                  setNotice(false);
                }}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" onClick={doExport}>
              <Download size={16} />
              Ekspor CSV
            </button>
          </>
        }
      />

      {loadError ? <div className="notice" role="alert">{loadError}</div> : null}

      {period === "custom" ? (
        <div className="custom-date-bar">
          <div className="cdb-title">
            <CalendarDays size={16} />
            <span>Filter Rentang Tanggal Kustom:</span>
          </div>
          <div className="cdb-inputs">
            <label className="cdb-field">
              <span>Dari</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setNotice(false);
                }}
              />
            </label>
            <span className="cdb-sep">—</span>
            <label className="cdb-field">
              <span>Sampai</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setNotice(false);
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setPeriod("semua");
                setNotice(false);
              }}
            >
              Reset Periode
            </button>
          </div>
        </div>
      ) : null}

      <div className="stat-row">
        <StatCard
          label="Total diterima (Lunas)"
          value={formatIDR(received)}
          caption={
            methodFilter === "Semua"
              ? `Tunai ${formatIDR(cashTotal)} · Non-tunai ${formatIDR(nonCashTotal)}`
              : `Pembayaran lunas via ${methodFilter}`
          }
          icon={<Banknote size={22} />}
          tone="green"
        />
        <StatCard
          label="Transaksi selesai"
          value={String(selesaiRows.length)}
          caption="Transaksi telah dibayar lunas"
          icon={<Wallet size={22} />}
          tone="blue"
        />
        <StatCard
          label="Jumlah ditampilkan"
          value={String(rows.length)}
          caption={`Dari ${transactions.length} total riwayat transaksi`}
          icon={<CreditCard size={22} />}
          tone="violet"
        />
      </div>

      {notice ? (
        <div className={rows.length === 0 ? "notice" : "notice notice-ok"} role="status">
          <Download size={16} />
          {rows.length === 0
            ? "Tidak ada baris untuk diekspor pada filter ini."
            : `Ekspor CSV berhasil diunduh (${rows.length} transaksi & pembayaran sesuai filter).`}
        </div>
      ) : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Transaksi</h2>
            <div className="section-desc">Pilih transaksi untuk melihat detail pembayaran dan struk</div>
          </div>
          <div className="section-action">
            <span className="foot-note" style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 700 }}>
              {rows.length} transaksi
            </span>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox
            placeholder="Cari nomor transaksi, nama pelanggan, telepon, atau metode..."
            value={query}
            onChange={(v) => {
              setQuery(v);
              setNotice(false);
            }}
          />
          <div className="toolbar-chips" style={{ alignItems: "center" }}>
            <select
              className="chip-select"
              aria-label="Filter Metode Pembayaran"
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as "Semua" | PaymentMethod);
                setNotice(false);
              }}
            >
              {METHOD_FILTERS.map((m) => (
                <option key={m} value={m}>
                  {m === "Semua" ? "Semua Metode" : m}
                </option>
              ))}
            </select>
            <select
              className="chip-select"
              aria-label="Filter Status Transaksi"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as "Semua" | TrxStatus);
                setNotice(false);
              }}
            >
              {FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f === "Semua" ? "Semua Status" : f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>NO. TRANSAKSI</th>
                <th>PELANGGAN</th>
                <th>METODE</th>
                <th className="tt-right">TOTAL</th>
                <th className="tt-center">STATUS</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((t) => {
                const method = (t.method as PaymentMethod | undefined) ?? "Tunai";
                const MethodIcon = METHOD_ICON[method] ?? Banknote;
                return (
                  <tr
                    key={t.id}
                    className={selected?.id === t.id ? "is-active" : ""}
                    onClick={() => setSelectedId(t.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="tt-num">{t.no}</div>
                      <div className="tt-sub">
                        {t.date} · {t.time}
                      </div>
                    </td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        {t.customer}
                      </div>
                      <div className="tt-sub">{t.phone}</div>
                    </td>
                    <td>
                      <span className="type-chip">
                        <MethodIcon size={14} />
                        {methodShort(method)}
                      </span>
                    </td>
                    <td className="tt-right tt-money">{formatIDR(t.total)}</td>
                    <td className="tt-center">
                      <StatusPill label={t.status} />
                    </td>
                    <td className="tt-right">
                      <button
                        type="button"
                        className="link-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(t.id);
                        }}
                      >
                        Lihat Detail
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-note">Tidak ada transaksi atau pembayaran yang cocok dengan filter.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="table-foot">
            <span className="foot-note">
              Menampilkan {visibleRows.length} dari {rows.length} transaksi sesuai filter ({transactions.length} total)
            </span>
            <div className="foot-actions">
              <select
                className="select-pill"
                aria-label="Baris per halaman"
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value="10">10 per halaman</option>
                <option value="25">25 per halaman</option>
                <option value="50">50 per halaman</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="overlay" onClick={() => setSelectedId(null)}>
          <div
            className="drawer riwayat-detail"
            key={selected.id}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="drawer-head">
              <div className="detail-head">
                <Avatar
                  initials={selected.customer.slice(0, 1) + (selected.customer.split(" ")[1]?.[0] ?? "")}
                  size={48}
                />
                <div>
                  <b>{selected.customer}</b>
                  <span>
                    {selected.no} · {selected.time}
                  </span>
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setSelectedId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-badges">
              <StatusPill label={selected.status} />
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <span>Tanggal</span>
                <b>{selected.date}</b>
              </div>
              <div className="detail-row">
                <span>Nomor HP</span>
                <b>{selected.phone}</b>
              </div>
              <div className="detail-row">
                <span>Metode</span>
                <b style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <SelectedMethodIcon size={14} />
                  {selectedMethod}
                </b>
              </div>
              {selected.poId ? (
                <div className="detail-row">
                  <span>Pengambilan PO</span>
                  <b>{selected.poId}</b>
                </div>
              ) : null}
            </div>

            <div>
              <div className="mini-label" style={{ color: "var(--accent-ink)" }}>
                PRODUK ({selected.products?.length ?? 0} ITEM)
              </div>
              <div className="sub-list" style={{ marginTop: 8 }}>
                {(selected.products ?? []).map((p) => (
                  <div className="sub-row" key={p.name}>
                    <span>
                      <b style={{ color: "var(--ink)" }}>{p.name}</b>
                      <br />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        {p.brand} · {p.qty} × {formatIDR(p.price)}
                      </span>
                    </span>
                    <b>{formatIDR(p.price * p.qty)}</b>
                  </div>
                ))}
                {(selected.products?.length ?? 0) === 0 ? (
                  <div className="empty-note" style={{ padding: "12px 0" }}>
                    Tidak ada rincian produk.
                  </div>
                ) : null}
              </div>
            </div>

            {selected.detail === "resep" ? (
              <div>
                <div className="mini-label" style={{ color: "var(--accent-ink)" }}>
                  RESEP MATA
                </div>
                {selectedRx ? (
                  <div className="rx-mini" style={{ marginTop: 10 }}>
                    <div className="rx-eye">
                      <div className="ey-label">OD / KANAN</div>
                      <b>{selectedRx.od.sph}</b>
                      <span>
                        CYL {selectedRx.od.cyl || "0.00"} · AXIS {selectedRx.od.axis || "-"}
                      </span>
                    </div>
                    <div className="rx-eye">
                      <div className="ey-label">OS / KIRI</div>
                      <b>{selectedRx.os.sph}</b>
                      <span>
                        CYL {selectedRx.os.cyl || "0.00"} · AXIS {selectedRx.os.axis || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-note" style={{ padding: "12px 0" }}>
                    Arsip resep pelanggan ini tidak ditemukan.
                  </div>
                )}
              </div>
            ) : null}

            <div>
              <div className="mini-label">RINGKASAN PEMBAYARAN</div>
              <div className="sub-list" style={{ marginTop: 8 }}>
                <div className="sub-row">
                  <span>Subtotal</span>
                  <b>{formatIDR(selectedSubtotal)}</b>
                </div>
                <div className="sub-row">
                  <span>Diskon</span>
                  <b>{formatIDR(selectedDiscount)}</b>
                </div>
                <div className="sub-row total">
                  <span>Total Tagihan</span>
                  <b>{formatIDR(selected.total)}</b>
                </div>
                {selectedMethod === "Tunai" ? (
                  <>
                    <div className="sub-row">
                      <span>Jumlah Dibayar</span>
                      <b>{formatIDR(selectedPaid)}</b>
                    </div>
                    <div className="sub-row">
                      <span>Kembalian</span>
                      <b style={{ color: "var(--ok-ink)" }}>{formatIDR(selectedChange)}</b>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="drawer-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(null)}>
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openStrukFor(selected.id)}
              >
                <Printer size={16} />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {strukId && active ? (
        <div className="struk-print struk-print-hidden" id="struk-print" aria-hidden="true">
          <StrukBody
            trx={active}
            storeName={shared.settings.storeName.split("—")[0].trim()}
            storePhone={shared.settings.storePhone}
            storeAddress={shared.settings.storeAddress}
            branch={session?.branch ?? "Cabang Padang"}
            cashier={session?.name ?? "Kasir"}
          />
        </div>
      ) : null}

    </div>
  );
}
