import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, FilePlus2, FileText, Search, X } from "lucide-react";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((o) => o.p.id === productId);
  const filteredOptions = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(({ p }) =>
      `${p.code} ${p.name} ${p.type}`.toLowerCase().includes(needle),
    );
  }, [options, productQuery]);

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      setProductQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [pickerOpen]);

  const chooseProduct = (id: string) => {
    setProductId(id);
    setPickerOpen(false);
    setProductQuery("");
    setError("");
  };


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
    setPickerOpen(false);
    setProductQuery("");
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
              <div className="afield" ref={pickerRef}>
                <span>Produk (Frame / Lensa) *</span>
                <div className="product-picker">
                  <button
                    type="button"
                    className={`product-picker-trigger ${pickerOpen ? "is-open" : ""}`}
                    onClick={() => setPickerOpen((value) => !value)}
                    aria-haspopup="listbox"
                    aria-expanded={pickerOpen}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setPickerOpen(false);
                        setProductQuery("");
                      }
                    }}
                  >
                    <span className="ppt-body">
                      {selectedOption ? (
                        <>
                          <b>
                            {selectedOption.p.code} — {selectedOption.p.name}
                          </b>
                          <span
                            className={
                              selectedOption.s && selectedOption.s.saldo <= selectedOption.s.minimum
                                ? "is-low"
                                : ""
                            }
                          >
                            Stok cabang: {selectedOption.s?.saldo ?? 0} unit
                            {selectedOption.s && selectedOption.s.saldo <= selectedOption.s.minimum
                              ? ` · menipis · min ${selectedOption.s.minimum}`
                              : ""}
                          </span>
                        </>
                      ) : (
                        <b>Pilih produk...</b>
                      )}
                    </span>
                    <ChevronDown size={18} className="ppt-chevron" />
                  </button>

                  {pickerOpen ? (
                    <div className="product-picker-panel">
                      <label className="product-picker-search">
                        <Search size={15} />
                        <input
                          autoFocus
                          type="search"
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Cari kode atau nama produk..."
                          aria-label="Cari produk"
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setPickerOpen(false);
                              setProductQuery("");
                            }
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const first = filteredOptions[0];
                              if (first) chooseProduct(first.p.id);
                            }
                          }}
                        />
                      </label>

                      <div className="product-picker-list" role="listbox" aria-label="Daftar produk">
                        {filteredOptions.map(({ p, s }) => {
                          const low = Boolean(s && s.saldo <= s.minimum);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              role="option"
                              aria-selected={p.id === productId}
                              className={`product-picker-option ${p.id === productId ? "is-selected" : ""}`}
                              onClick={() => chooseProduct(p.id)}
                            >
                              <span className="ppo-main">
                                <b>
                                  {p.code} — {p.name}
                                </b>
                                <span>
                                  Stok: {s?.saldo ?? 0} unit
                                  {low ? ` · menipis · min ${s?.minimum ?? 0}` : ""}
                                </span>
                              </span>
                              {p.id === productId ? <CheckCircle2 size={16} /> : null}
                            </button>
                          );
                        })}
                        {filteredOptions.length === 0 ? (
                          <div className="product-picker-empty">Produk tidak ditemukan.</div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
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
