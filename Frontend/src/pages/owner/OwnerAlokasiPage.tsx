import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Plus, Truck, X } from "lucide-react";
import { useSharedStore } from "../../store/sharedStore";
import { useAuth } from "../../store/auth";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerAlokasiPage() {
  const store = useSharedStore();
  const { session } = useAuth();
  const ownerName = session?.name ?? "Pemilik";
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima">("Semua");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Form alokasi — deep link ?requestId= langsung membuka form yang sesuai.
  const initialRequestId = params.get("requestId") ?? "";
  const initialRequest = initialRequestId
    ? store.requests.find((r) => r.id === initialRequestId)
    : undefined;
  const initialCanAllocate = Boolean(
    initialRequest &&
      initialRequest.status !== "Ditolak" &&
      store.outstandingForRequest(initialRequest.id, initialRequest.productId) > 0,
  );
  const defaultBranch = store.branches.find((b) => b.type === "Cabang" && b.status === "Aktif")?.id ?? "cabang-padang";
  const [open, setOpen] = useState(initialCanAllocate);
  const [branchId, setBranchId] = useState(initialRequest?.branchId ?? defaultBranch);
  const [productId, setProductId] = useState(initialRequest?.productId ?? "P-003");
  const [requestId, setRequestId] = useState(initialRequest?.id ?? "");
  const [qty, setQty] = useState(
    initialRequest ? String(store.outstandingForRequest(initialRequest.id, initialRequest.productId)) : "",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const keyRef = useRef("");

  const rows = useMemo(
    () =>
      store.distributions
        .filter((d) => (filter === "Semua" ? true : d.status === filter))
        .filter((d) => {
          const names = d.lines.map((l) => store.productOf(l.productId)?.name ?? "").join(" ");
          return `${d.id} ${names}`.toLowerCase().includes(q.toLowerCase());
        }),
    [store, q, filter],
  );

  const products = useMemo(
    () => store.products.filter((p) => p.status === "Aktif" && p.type !== "Aksesoris"),
    [store.products],
  );
  const avail = store.availableToAllocate(productId);
  const req = requestId ? store.requests.find((r) => r.id === requestId && r.productId === productId) : undefined;
  const outstanding = requestId ? store.outstandingForRequest(requestId, productId) : null;

  const pickRequest = (id: string) => {
    setRequestId(id);
    if (!id) return;
    const r = store.requests.find((x) => x.id === id);
    if (!r) return;
    setBranchId(r.branchId);
    setProductId(r.productId);
    setQty(String(store.outstandingForRequest(r.id, r.productId)));
  };

  const start = (presetRequest?: string) => {
    const rid = presetRequest ?? params.get("requestId") ?? "";
    const found = rid ? store.requests.find((x) => x.id === rid) : undefined;
    const r =
      found && found.status !== "Ditolak" && store.outstandingForRequest(found.id, found.productId) > 0
        ? found
        : undefined;
    setBranchId(r?.branchId ?? defaultBranch);
    setProductId(
      r?.productId ??
        products.find((p) => store.availableToAllocate(p.id).available > 0)?.id ??
        "P-003",
    );
    setRequestId(r?.id ?? "");
    setQty(r ? String(store.outstandingForRequest(r.id, r.productId)) : "");
    setNote("");
    setError("");
    setDone(null);
    setBusy(false);
    keyRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setOpen(true);
  };

  /* Navigasi dari Pengajuan saat halaman Alokasi sudah terbuka. */
  useEffect(() => {
    const rid = params.get("requestId");
    if (!rid) return;
    const r = store.requests.find((x) => x.id === rid);
    if (!r) return;
    if (r.status === "Ditolak" || store.outstandingForRequest(r.id, r.productId) <= 0) {
      setOpen(false);
      return;
    }
    setBranchId(r.branchId);
    setProductId(r.productId);
    setRequestId(r.id);
    setQty(String(store.outstandingForRequest(r.id, r.productId)));
    setError("");
    setDone(null);
    keyRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const jumlah = Number(qty.trim());
    if (!/^[0-9]+$/.test(qty.trim()) || jumlah <= 0) {
      setBusy(false);
      setError("Jumlah alokasi harus bilangan bulat lebih dari 0.");
      return;
    }
    const r = store.createAllocation({
      requestId: requestId || undefined,
      branchId,
      productId,
      qty: jumlah,
      note,
      actor: ownerName,
      key: keyRef.current,
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.msg);
      return;
    }
    setDone(r.id ?? null);
    setParams({});
  };

  const detail = detailId ? store.distributions.find((d) => d.id === detailId) : undefined;
  const detailAlokasiTotal = detail ? detail.lines.reduce((a, l) => a + l.qtyAlokasi, 0) : 0;
  const detailDiterimaTotal = detail ? detail.lines.reduce((a, l) => a + l.qtyDiterima, 0) : 0;
  const detailPct = detailAlokasiTotal > 0 ? Math.min(100, Math.round((detailDiterimaTotal / detailAlokasiTotal) * 100)) : 0;

  return (
    <div className="page">
      <PageHeader
        overline="KEPUTUSAN — ALOKASI"
        title="Alokasi Distribusi"
        desc="Tetapkan jumlah barang yang dikirim dari Pusat ke cabang. Alokasi mereservasi stok hingga penerimaan dicatat Admin cabang."
        actions={
          <button className="btn btn-primary" onClick={() => start()}>
            <Plus size={16} />
            Buat Alokasi
          </button>
        }
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari ID alokasi atau nama produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          {(["Semua", "Menunggu Diterima", "Diterima Sebagian", "Diterima"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <div className="notice">
        <Truck size={16} />
        Alokasi hanya mereservasi barang. Stok pusat dan cabang berubah setelah Admin cabang mencatat
        penerimaan.
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>ID / TANGGAL</th>
              <th>ASAL → TUJUAN</th>
              <th>PRODUK</th>
              <th className="tt-center">ALOKASI</th>
              <th className="tt-center">DITERIMA</th>
              <th className="tt-center">STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="tt-num">{d.id}</div>
                  <div className="tt-sub">
                    {d.date}
                    {d.requestId ? ` · ${d.requestId}` : " · alokasi awal"}
                  </div>
                </td>
                <td>
                  <div className="tt-num" style={{ fontSize: 13 }}>
                    {d.from} → {store.branches.find((b) => b.id === d.branchId)?.name ?? d.branchId}
                  </div>
                </td>
                <td>
                  {d.lines.map((l) => {
                    const p = store.productOf(l.productId);
                    return (
                      <div key={l.productId} className="tt-num" style={{ fontSize: 13 }}>
                        {p?.name} <span className="tt-sub">({p?.code})</span>
                      </div>
                    );
                  })}
                </td>
                <td className="tt-center tt-money">{d.lines.reduce((a, l) => a + l.qtyAlokasi, 0)}</td>
                <td className="tt-center tt-money">{d.lines.reduce((a, l) => a + l.qtyDiterima, 0)}</td>
                <td className="tt-center">
                  <StatusPill label={d.status} />
                </td>
                <td className="tt-right">
                  <button className="link-action" onClick={() => setDetailId(d.id)}>
                    Lihat Detail
                    <ArrowRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-note">Belum ada alokasi pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Alokasi muncul di menu Penerimaan Admin cabang tujuan.</span>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {done ? (
              <>
                <div className="drawer-head">
                  <div>
                    <h2>Alokasi tercatat</h2>
                    <div className="section-desc">{done} · menunggu penerimaan Admin</div>
                  </div>
                  <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="notice notice-ok" role="status">
                  <CheckCircle2 size={16} />
                  Alokasi tercatat. Barang menunggu penerimaan Admin cabang.
                </div>
                <div className="drawer-foot">
                  <button className="btn btn-primary" onClick={() => setOpen(false)}>
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="drawer-head">
                  <div>
                    <h2>Buat Alokasi</h2>
                    <div className="section-desc">Pusat → cabang · oleh {ownerName}</div>
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
                    <span>Cabang tujuan</span>
                    <select
                      value={branchId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setBranchId(next);
                        const r = requestId ? store.requests.find((x) => x.id === requestId) : undefined;
                        if (r && r.branchId !== next) setRequestId("");
                      }}
                    >
                      {store.branches.filter((b) => b.type === "Cabang" && b.status === "Aktif").map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="afield">
                    <span>Produk (frame / lensa)</span>
                    <select
                      value={productId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setProductId(next);
                        const r = requestId ? store.requests.find((x) => x.id === requestId) : undefined;
                        if (r && r.productId !== next) setRequestId("");
                      }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="afield">
                    <span>Pengajuan terkait (opsional)</span>
                    <select value={requestId} onChange={(e) => pickRequest(e.target.value)}>
                      <option value="">— Tanpa pengajuan —</option>
                      {store.requests
                        .filter(
                          (r) =>
                            r.productId === productId &&
                            r.status !== "Ditolak" &&
                            store.outstandingForRequest(r.id, r.productId) > 0,
                        )
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.id} · diminta {r.qty} · sisa {store.outstandingForRequest(r.id, r.productId)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span>Stok pusat</span>
                      <b>{avail.onHand}</b>
                    </div>
                    <div className="detail-row">
                      <span>Sudah direservasi</span>
                      <b>{avail.reserved}</b>
                    </div>
                    <div className="detail-row">
                      <span>Bisa dialokasikan</span>
                      <b>{avail.available}</b>
                    </div>
                    {req ? (
                      <div className="detail-row">
                        <span>Sisa pengajuan {req.id}</span>
                        <b>{outstanding}</b>
                      </div>
                    ) : null}
                  </div>
                  <label className="afield">
                    <span>Jumlah alokasi</span>
                    <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="cth. 4" />
                  </label>
                  <label className="afield">
                    <span>Catatan (opsional)</span>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. prioritas stok menipis" />
                  </label>
                  <div className="drawer-foot">
                    <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                      {busy ? "Memproses..." : "Simpan Alokasi"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}

      {detail ? (
        <div className="overlay" onClick={() => setDetailId(null)}>
          <div className="drawer" key={detail.id} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{detail.id}</h2>
                <div className="section-desc">
                  {detail.date} · oleh {detail.actor ?? "Alokasi awal"}
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setDetailId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="trace-summary-card">
              <div className="trace-summary-top">
                <div>
                  <b>
                    {detail.from} → {store.branches.find((b) => b.id === detail.branchId)?.name ?? detail.branchId}
                  </b>
                  <span>{detail.requestId ? `Ref Pengajuan ${detail.requestId}` : "Alokasi Distribusi Pusat"}</span>
                </div>
                <StatusPill label={detail.status} />
              </div>
              <div className="trace-summary-meta">
                <div className="trace-meta-item">
                  <span>Dialokasikan</span>
                  <b>{detailAlokasiTotal} unit</b>
                </div>
                <div className="trace-meta-item">
                  <span>Diterima</span>
                  <b>{detailDiterimaTotal} unit</b>
                </div>
                <div className="trace-meta-item">
                  <span>Progres</span>
                  <b>{detailPct}%</b>
                </div>
              </div>
            </div>

            <div className="trace-progress-box">
              <div className="trace-progress-head">
                <span>Progres Penerimaan Fisik</span>
                <b>
                  {detailDiterimaTotal} / {detailAlokasiTotal} unit
                </b>
              </div>
              <div className="top-bar">
                <span style={{ width: `${detailPct}%` }} />
              </div>
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <span>Asal → tujuan</span>
                <b>
                  {detail.from} → {store.branches.find((b) => b.id === detail.branchId)?.name ?? detail.branchId}
                </b>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <StatusPill label={detail.status} />
              </div>
              {detail.lines.map((l) => {
                const p = store.productOf(l.productId);
                return (
                  <div key={l.productId} className="detail-row">
                    <span>{p?.name}</span>
                    <b>
                      alokasi {l.qtyAlokasi} · diterima {l.qtyDiterima}
                    </b>
                  </div>
                );
              })}
              {detail.requestId ? (
                <div className="detail-row">
                  <span>Pengajuan</span>
                  <b>{detail.requestId}</b>
                </div>
              ) : null}
              {detail.note ? (
                <div className="detail-row">
                  <span>Catatan</span>
                  <b>{detail.note}</b>
                </div>
              ) : null}
            </div>
            <div className="notice">
              <Truck size={16} />
              Penerimaan barang dicatat oleh Admin cabang.
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
