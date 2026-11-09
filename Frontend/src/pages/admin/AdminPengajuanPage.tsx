import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, FilePlus2, FileText, X } from "lucide-react";
import { adminInventoryApi, adminStockFlowApi, ApiError, type AdminStockRow, type StockRequestRow } from "../../lib/api";
import { requestStateLabel, type RequestState } from "../../store/requestStatus";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type StatusFilter = "Semua" | RequestState;
type ProductOption = AdminStockRow;

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "Semua", label: "Semua Status" },
  { value: "Diajukan", label: "Menunggu" },
  { value: "Sebagian", label: "Sebagian" },
  { value: "Dialokasikan", label: "Menunggu Diterima" },
  { value: "Selesai", label: "Selesai" },
  { value: "Ditolak", label: "Ditolak" },
];

export default function AdminPengajuanPage() {
  const [params, setParams] = useSearchParams();
  const [requests, setRequests] = useState<StockRequestRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("Semua");
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const rows = await adminInventoryApi.stocks();
      const eligible = rows.filter((product) => ["frame", "lensa"].includes(product.jenis.toLowerCase()));
      setProducts(eligible);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Daftar produk gagal dimuat.");
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await adminStockFlowApi.requests(filter === "Semua" ? "" : filter, query.trim()));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Daftar pengajuan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const deepLinkProduct = params.get("product");
    const isNew = params.get("new") === "1";
    if (!deepLinkProduct && !isNew) return;
    if (products.length === 0) return;
    const selected = products.find((item) => String(item.id) === deepLinkProduct) ?? products[0];
    setProductId(String(selected.id));
    setQuantity("");
    setNote("");
    setError("");
    setOpen(true);
    setParams({}, { replace: true });
  }, [params, products, setParams]);

  const waiting = requests.filter((request) => request.state === "Diajukan").length;
  const lowStockCount = products.filter((product) => product.stok <= product.stok_minimum).length;
  const selectedProduct = products.find((product) => String(product.id) === productId);

  const start = () => {
    setProductId(products[0] ? String(products[0].id) : "");
    setQuantity("");
    setNote("");
    setError("");
    setNotice("");
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = /^[0-9]+$/.test(quantity.trim()) ? Number(quantity.trim()) : NaN;
    if (!productId) {
      setError("Pilih produk terlebih dahulu.");
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Jumlah harus bilangan bulat lebih dari 0.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await adminStockFlowApi.createRequest(Number(productId), amount, note.trim());
      setOpen(false);
      setNotice(`Pengajuan ${selectedProduct?.nama_barang ?? "stok"} sebanyak ${amount} unit berhasil dikirim ke Pemilik.`);
      await loadRequests();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Pengajuan stok gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — PENGAJUAN"
        title="Pengajuan Stok"
        desc="Ajukan kebutuhan stok ke Pemilik dan pantau jumlah yang dialokasikan hingga diterima."
        actions={<button className="btn btn-primary" onClick={start}><FilePlus2 size={16} />Ajukan Stok</button>}
      />

      <div className="stat-row">
        <StatCard label="Total Pengajuan" value={String(requests.length)} caption="Sesuai filter aktif" icon={<FileText size={22} />} tone="violet" />
        <StatCard label="Menunggu Tinjauan" value={String(waiting)} caption="Belum mendapat alokasi" icon={<Clock size={22} />} tone="amber" />
        <StatCard label="Produk Stok Menipis" value={String(lowStockCount)} caption="Saldo ≤ batas minimum" icon={<AlertTriangle size={22} />} tone="blue" />
      </div>

      {notice ? <div className="notice notice-ok" role="status"><CheckCircle2 size={16} />{notice}</div> : null}
      {error && !open ? <div className="notice" role="alert">{error} <button className="btn btn-ghost" onClick={() => void loadRequests()}>Coba lagi</button></div> : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari ID pengajuan, kode, atau nama produk..." value={query} onChange={setQuery} />
        <select className="chip-select" aria-label="Filter Status Pengajuan" value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)}>
          {FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead><tr>
            <th>NO. PENGAJUAN</th><th>PRODUK</th><th className="tt-center">SISA STOK CABANG</th>
            <th className="tt-center">DIMINTA</th><th className="tt-center">DIALOKASIKAN</th>
            <th className="tt-center">DITERIMA</th><th className="tt-center">STATUS</th><th>CATATAN</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8}><div className="empty-note">Memuat pengajuan...</div></td></tr> : null}
            {!loading ? requests.map((request) => (
              <tr key={request.id_pengajuan}>
                <td><div className="tt-num">{request.kode_pengajuan}</div><div className="tt-sub">{request.created_at}</div></td>
                <td><div className="tt-num">{request.nama_barang}</div><div className="tt-sub">{request.kode_barang} · {request.jenis}</div></td>
                <td className="tt-center tt-money">{request.stok ?? 0} / min. {request.stok_minimum}</td>
                <td className="tt-center tt-money">+{request.jumlah_diminta}</td>
                <td className="tt-center tt-money">{request.jumlah_dialokasikan}</td>
                <td className="tt-center tt-money">{request.jumlah_diterima}</td>
                <td className="tt-center"><StatusPill label={requestStateLabel(request.state as RequestState)} /></td>
                <td><span className="tt-sub">{request.catatan || "—"}</span></td>
              </tr>
            )) : null}
            {!loading && requests.length === 0 ? <tr><td colSpan={8}><div className="empty-note">Tidak ada pengajuan yang cocok.</div></td></tr> : null}
          </tbody>
        </table>
        <div className="table-foot"><span className="foot-note">Menampilkan {requests.length} pengajuan</span></div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => !saving && setOpen(false)}>
          <div className="drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div><h2>Ajukan Stok</h2><div className="section-desc">Permintaan penambahan stok ke Pemilik</div></div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)} disabled={saving}><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="drawer-form" noValidate>
              {error ? <div className="form-error" role="alert">{error}</div> : null}
              <label className="afield">
                <span>Produk (Frame / Lensa) *</span>
                <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.kode_barang} — {product.nama_barang} (stok {product.stok})</option>)}
                </select>
              </label>
              <label className="afield"><span>Jumlah dibutuhkan (unit) *</span><input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
              <label className="afield"><span>Keterangan / alasan (opsional)</span><input value={note} onChange={(event) => setNote(event.target.value)} /></label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving || products.length === 0}>{saving ? "Mengirim..." : "Kirim Pengajuan"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
