import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, FilePlus2, FileText, X } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import { requestState, requestStateLabel, type RequestState } from "../../store/requestStatus";
import { Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type FilterKey = "Semua" | RequestState;

const FILTERS: Array<{ id: FilterKey; label: string }> = [
  { id: "Semua", label: "Semua" },
  { id: "Diajukan", label: "Menunggu" },
  { id: "Sebagian", label: "Sebagian" },
  { id: "Dialokasikan", label: "Menunggu Diterima" },
  { id: "Selesai", label: "Selesai" },
  { id: "Ditolak", label: "Ditolak" },
];

export default function AdminPengajuanPage() {
  const store = useSharedStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("Semua");
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");

  // Deep link: ?product=FR-003 (dari Stok Cabang) atau ?new=1 (dari Dashboard) → form langsung terbuka.
  useEffect(() => {
    const pid = params.get("product");
    const isNew = params.get("new") === "1";
    if (!pid && !isNew) return;
    const valid = !!pid && store.products.some((p) => p.id === pid && p.status === "Aktif" && p.type !== "Aksesoris");
    const fallback = store.products.find((p) => p.status === "Aktif" && p.type !== "Aksesoris")?.id ?? "";
    const chosenId = valid ? pid! : isNew ? fallback : "";
    if (chosenId) {
      setProductId(chosenId);
      setQty("");
      setNote("");
      setError("");
      setOpen(true);
    }
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(
    () =>
      store.products
        .filter((p) => p.status === "Aktif" && p.type !== "Aksesoris")
        .map((p) => ({ p, s: store.stockOf(p.id) })),
    [store],
  );

  const lowStockCount = useMemo(
    () => options.filter(({ s }) => s && s.saldo <= s.minimum).length,
    [options],
  );

  const enrichedRequests = useMemo(
    () =>
      store.requests.map((r) => {
        const alloc = store.allocatedForRequest(r.id, r.productId);
        const received = store.receivedForRequest(r.id, r.productId);
        return {
          r,
          state: requestState(r, r.qty, alloc, received),
        };
      }),
    [store],
  );

  const waitingCount = enrichedRequests.filter((x) => x.state === "Diajukan").length;

  const rows = useMemo(
    () =>
      enrichedRequests
        .filter(({ state }) => (filter === "Semua" ? true : state === filter))
        .filter(({ r }) => {
          const p = store.productOf(r.productId);
          return `${r.id} ${p?.name ?? ""} ${p?.code ?? ""} ${r.note}`.toLowerCase().includes(q.toLowerCase());
        }),
    [enrichedRequests, filter, q, store],
  );

  const start = () => {
    setProductId(options[0]?.p.id ?? "");
    setQty("");
    setNote("");
    setError("");
    setSavedNotice("");
    setOpen(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError("Pilih produk terlebih dahulu.");
      return;
    }
    const qtyRaw = qty.trim();
    const qtyNum = /^[0-9]+$/.test(qtyRaw) ? Number(qtyRaw) : NaN;
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setError("Jumlah harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).");
      return;
    }
    const chosen = options.find((o) => o.p.id === productId);
    store.createRequest(productId, qtyNum, note.trim());
    setOpen(false);
    setSavedNotice(
      `Pengajuan stok ${chosen?.p.name ?? productId} sebanyak ${qtyNum} unit berhasil dikirim ke Pemilik.`,
    );
  };

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — PENGAJUAN"
        title="Pengajuan Stok"
        desc={`Ajukan kebutuhan penambahan stok ${DEMO_ADMIN.branch} ke Pemilik dan pantau status persetujuannya.`}
        actions={
          <button className="btn btn-primary" onClick={start}>
            <FilePlus2 size={16} />
            Ajukan Stok
          </button>
        }
      />

      <div className="stat-row">
        <StatCard
          label="Total Pengajuan"
          value={String(store.requests.length)}
          caption={`Riwayat pengajuan ${DEMO_ADMIN.branch}`}
          icon={<FileText size={22} />}
          tone="violet"
        />
        <StatCard
          label="Menunggu Tinjauan"
          value={String(waitingCount)}
          caption="Menunggu keputusan Pemilik"
          icon={<Clock size={22} />}
          tone="amber"
        />
        <StatCard
          label="Produk Stok Menipis"
          value={String(lowStockCount)}
          caption="Di bawah atau sama dengan batas minimum"
          icon={<AlertTriangle size={22} />}
          tone="blue"
        />
      </div>

      {savedNotice ? (
        <div className="notice notice-ok" role="status">
          <CheckCircle2 size={16} />
          {savedNotice}
        </div>
      ) : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari ID pengajuan, kode, atau nama produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <select
            className="chip-select"
            aria-label="Filter Status Pengajuan"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.id === "Semua" ? "Semua Status" : f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>NO. PENGAJUAN</th>
              <th>PRODUK</th>
              <th className="tt-center">SISA STOK CABANG</th>
              <th className="tt-center">JUMLAH DIMINTA</th>
              <th className="tt-center">STATUS</th>
              <th>CATATAN ALASAN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, state }) => {
              const p = store.productOf(r.productId);
              const s = store.stockOf(r.productId);
              const isLow = s && s.saldo <= s.minimum;
              const statusLabel = state === "Diajukan" ? "Diajukan" : requestStateLabel(state);
              return (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="tt-num">{r.id}</div>
                    <div className="tt-sub">{r.at}</div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name}
                    </div>
                    <div className="tt-sub">{p?.code} · {p?.type}</div>
                  </td>
                  <td className="tt-center tt-money" style={{ whiteSpace: "nowrap" }}>
                    <span style={isLow ? { color: "var(--warn-ink)" } : undefined}>{s?.saldo ?? 0} unit</span>
                    {isLow ? (
                      <div className="tt-sub" style={{ color: "var(--warn-ink)", fontWeight: 700 }}>
                        Batas min. {s.minimum} unit
                      </div>
                    ) : null}
                  </td>
                  <td className="tt-center tt-money" style={{ whiteSpace: "nowrap", color: "var(--accent-ink)" }}>
                    +{r.qty} unit
                  </td>
                  <td className="tt-center" style={{ whiteSpace: "nowrap" }}>
                    <StatusPill label={statusLabel} />
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <span className="tt-sub" style={{ marginTop: 0, display: "block", lineHeight: 1.45 }}>
                      {r.note || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-note">Tidak ada pengajuan stok yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {rows.length} dari {store.requests.length} pengajuan stok
          </span>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Ajukan Stok</h2>
                <div className="section-desc">Permintaan penambahan stok dari {DEMO_ADMIN.branch} ke Pemilik</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="drawer-form" noValidate>
              {error ? (
                <div className="form-error" role="alert">
                  {error}
                </div>
              ) : null}
              <label className="afield">
                <span>Produk (Frame / Lensa) *</span>
                <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {options.map(({ p, s }) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} (stok: {s?.saldo ?? 0}
                      {s && s.saldo <= s.minimum ? `, menipis · min ${s.minimum}` : ""})
                    </option>
                  ))}
                </select>
              </label>
              <label className="afield">
                <span>Jumlah Dibutuhkan (unit) *</span>
                <input
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="cth. 5"
                />
              </label>
              <label className="afield">
                <span>Keterangan / Alasan Pengajuan (opsional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="cth. Stok menipis menjelang akhir pekan"
                />
              </label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={!productId}>
                  <FilePlus2 size={16} />
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
