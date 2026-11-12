import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, PackagePlus, Truck, X } from "lucide-react";
import { ApiError, ownerStockFlowApi, type OwnerAllocationOptions, type StockDistribution } from "../../lib/api";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type DistributionStatus = "Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima";

export default function OwnerAlokasiPage() {
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState<OwnerAllocationOptions | null>(null);
  const [allocations, setAllocations] = useState<StockDistribution[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DistributionStatus>("Semua");
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [allocationOptions, rows] = await Promise.all([
        ownerStockFlowApi.allocationOptions(),
        ownerStockFlowApi.allocations(),
      ]);
      setOptions(allocationOptions);
      setAllocations(rows);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Data alokasi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const linkedRequestId = params.get("requestId");
    if (!linkedRequestId || !options) return;
    const linked = options.requests.find((request) => String(request.id_pengajuan) === linkedRequestId);
    if (linked) {
      setBranchId(String(linked.cabang_id));
      setProductId(String(linked.barang_id));
      setRequestId(String(linked.id_pengajuan));
      setQuantity(String(linked.sisa ?? Math.max(0, linked.jumlah_diminta - linked.jumlah_dialokasikan)));
      setError("");
      setOpen(true);
    }
    setParams({}, { replace: true });
  }, [options, params, setParams]);

  const products = options?.products ?? [];
  const branches = options?.branches ?? [];
  const requests = options?.requests ?? [];
  const selectedProduct = products.find((product) => String(product.id) === productId);
  const eligibleRequests = requests.filter((request) =>
    String(request.cabang_id) === branchId
    && String(request.barang_id) === productId
    && (request.sisa ?? Math.max(0, request.jumlah_diminta - request.jumlah_dialokasikan)) > 0,
  );
  const selectedRequest = eligibleRequests.find((request) => String(request.id_pengajuan) === requestId);
  const selectedRequestRemaining = selectedRequest
    ? selectedRequest.sisa ?? Math.max(0, selectedRequest.jumlah_diminta - selectedRequest.jumlah_dialokasikan)
    : null;

  const rows = useMemo(() => allocations
    .filter((allocation) => filter === "Semua" || allocation.status === filter)
    .filter((allocation) => {
      const text = `${allocation.kode_alokasi} ${allocation.nama_cabang} ${allocation.items.map((item) => `${item.kode_barang} ${item.nama_barang}`).join(" ")}`;
      return text.toLowerCase().includes(query.trim().toLowerCase());
    }), [allocations, filter, query]);
  const pendingCount = allocations.filter((allocation) => allocation.status === "Menunggu Diterima").length;
  const partialCount = allocations.filter((allocation) => allocation.status === "Diterima Sebagian").length;
  const availableItems = products.filter((product) => product.available > 0).length;

  const start = () => {
    setBranchId(String(branches[0]?.id ?? ""));
    const firstProduct = products.find((product) => product.available > 0) ?? products[0];
    setProductId(String(firstProduct?.id ?? ""));
    setRequestId("");
    setQuantity("");
    setNote("");
    setError("");
    setNotice("");
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = /^[0-9]+$/.test(quantity.trim()) ? Number(quantity.trim()) : NaN;
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Jumlah alokasi harus bilangan bulat lebih dari 0.");
      return;
    }
    if (!branchId || !productId) {
      setError("Pilih cabang dan produk terlebih dahulu.");
      return;
    }
    if (selectedProduct && amount > selectedProduct.available) {
      setError(`Stok yang dapat dialokasikan hanya ${selectedProduct.available} unit.`);
      return;
    }
    if (selectedRequestRemaining !== null && amount > selectedRequestRemaining) {
      setError(`Sisa kebutuhan pengajuan ini ${selectedRequestRemaining} unit.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await ownerStockFlowApi.createAllocation({
        branchId: Number(branchId),
        productId: Number(productId),
        quantity: amount,
        ...(requestId ? { requestId: Number(requestId) } : {}),
        note: note.trim(),
        idempotencyKey,
      });
      setOpen(false);
      setNotice(`Alokasi ${result.kode_alokasi} berhasil dicatat dan menunggu penerimaan cabang.`);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Alokasi gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader overline="KEPUTUSAN — ALOKASI" title="Alokasi Distribusi" actions={<button className="btn btn-primary" onClick={start}><PackagePlus size={16} />Buat Alokasi</button>} />
      <div className="stat-row">
        <StatCard label="Menunggu Diterima" value={String(pendingCount)} caption="Kiriman belum diterima cabang" icon={<Truck size={22} />} tone="amber" />
        <StatCard label="Diterima Sebagian" value={String(partialCount)} caption="Masih ada sisa alokasi" icon={<PackagePlus size={22} />} tone="violet" />
        <StatCard label="Produk Bisa Dialokasikan" value={String(availableItems)} caption="Saldo pusat dikurangi reservasi" icon={<CheckCircle2 size={22} />} tone="green" />
      </div>
      <div className="notice" role="note">Saldo awal gudang pusat adalah 0. Alokasi hanya dapat dilakukan setelah saldo pusat diisi melalui proses stok pusat.</div>
      {notice ? <div className="notice notice-ok" role="status">{notice}</div> : null}
      {error && !open ? <div className="notice" role="alert">{error}<button className="btn btn-ghost" onClick={() => void loadData()}>Coba lagi</button></div> : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari ID alokasi, cabang, atau produk..." value={query} onChange={setQuery} />
        <select className="select-pill" aria-label="Filter Status Alokasi" value={filter} onChange={(event) => setFilter(event.target.value as DistributionStatus)}>
          <option value="Semua">Semua Status</option><option value="Menunggu Diterima">Menunggu Diterima</option><option value="Diterima Sebagian">Diterima Sebagian</option><option value="Diterima">Diterima</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="tt">
          <thead><tr><th>ID / WAKTU</th><th>CABANG TUJUAN</th><th>PRODUK</th><th className="tt-center">DIALOKASIKAN</th><th className="tt-center">DITERIMA</th><th>STATUS</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6}><div className="empty-note">Memuat alokasi...</div></td></tr> : null}
            {!loading ? rows.map((allocation) => (
              <tr key={allocation.id_alokasi}>
                <td><div className="tt-num">{allocation.kode_alokasi}</div><div className="tt-sub">{allocation.tanggal}</div></td>
                <td><div className="tt-num">{allocation.nama_cabang}</div><div className="tt-sub">{allocation.kode_pengajuan ?? "Alokasi tanpa pengajuan"}</div></td>
                <td>{allocation.items.map((item) => <div key={item.id_detail_alokasi} className="tt-num">{item.nama_barang} <span className="tt-sub">({item.kode_barang})</span></div>)}</td>
                <td className="tt-center tt-money">{allocation.jumlah_dialokasikan}</td><td className="tt-center tt-money">{allocation.jumlah_diterima}</td><td><StatusPill label={allocation.status} /></td>
              </tr>
            )) : null}
            {!loading && rows.length === 0 ? <tr><td colSpan={6}><div className="empty-note">Belum ada alokasi yang cocok.</div></td></tr> : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="overlay" onClick={() => !saving && setOpen(false)}>
          <div className="drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head"><div><h2>Buat Alokasi</h2><div className="section-desc">Alokasi stok pusat untuk cabang</div></div><button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)} disabled={saving}><X size={18} /></button></div>
            <form onSubmit={submit} className="drawer-form" noValidate>
              {error ? <div className="form-error" role="alert">{error}</div> : null}
              <label className="afield"><span>Cabang tujuan *</span><select value={branchId} onChange={(event) => { setBranchId(event.target.value); setRequestId(""); }} required>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.nama_cabang}</option>)}</select></label>
              <label className="afield"><span>Produk (Frame / Lensa) *</span><select value={productId} onChange={(event) => { setProductId(event.target.value); setRequestId(""); }} required>{products.map((product) => <option key={product.id} value={product.id}>{product.kode_barang} — {product.nama_barang} · tersedia {product.available} (pusat {product.stok_pusat})</option>)}</select></label>
              {selectedProduct && selectedProduct.available === 0 ? <div className="form-error">Stok pusat tersedia 0 unit. Tambahkan stok pusat sebelum membuat alokasi.</div> : null}
              <label className="afield"><span>Hubungkan ke pengajuan (opsional)</span><select value={requestId} onChange={(event) => { setRequestId(event.target.value); const selected = eligibleRequests.find((request) => String(request.id_pengajuan) === event.target.value); if (selected) setQuantity(String(selected.sisa ?? selected.jumlah_diminta - selected.jumlah_dialokasikan)); }}><option value="">Tanpa pengajuan</option>{eligibleRequests.map((request) => <option key={request.id_pengajuan} value={request.id_pengajuan}>{request.kode_pengajuan} · sisa {request.sisa}</option>)}</select></label>
              <label className="afield"><span>Jumlah dialokasikan *</span><input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
              <div className="section-desc">Tersedia di pusat: {selectedProduct?.available ?? 0} unit{selectedRequestRemaining !== null ? ` · sisa pengajuan: ${selectedRequestRemaining} unit` : ""}</div>
              <label className="afield"><span>Catatan (opsional)</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} /></label>
              <div className="drawer-foot"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Batal</button><button type="submit" className="btn btn-primary" disabled={saving || !products.length || !branches.length}>{saving ? "Menyimpan..." : "Simpan Alokasi"}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
