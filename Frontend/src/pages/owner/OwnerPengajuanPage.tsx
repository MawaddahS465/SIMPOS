import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Truck, X } from "lucide-react";
import { ApiError, ownerStockFlowApi, type StockRequestRow } from "../../lib/api";
import { requestStateLabel, type RequestState } from "../../store/requestStatus";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type StatusFilter = "Semua" | RequestState;

const STATUSES: StatusFilter[] = ["Semua", "Diajukan", "Sebagian", "Dialokasikan", "Selesai", "Ditolak"];

export default function OwnerPengajuanPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<StockRequestRow[]>([]);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("Semua");
  const [detail, setDetail] = useState<StockRequestRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await ownerStockFlowApi.requests(branch, status === "Semua" ? "" : status, query.trim()));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Pengajuan stok gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [branch, query, status]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const branches = useMemo(() => {
    const values = new Map<number, string>();
    requests.forEach((request) => values.set(request.cabang_id, request.nama_cabang));
    return [...values.entries()];
  }, [requests]);
  const waiting = requests.filter((request) => request.state === "Diajukan").length;
  const inProgress = requests.filter((request) => ["Sebagian", "Dialokasikan"].includes(request.state)).length;
  const completed = requests.filter((request) => request.state === "Selesai").length;

  const openDetail = (request: StockRequestRow) => {
    setDetail(request);
    setRejectReason("");
    setRejectError("");
  };

  const reject = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail || rejecting) return;
    setRejecting(true);
    setRejectError("");
    try {
      await ownerStockFlowApi.rejectRequest(detail.id_pengajuan, rejectReason.trim());
      setDetail(null);
      setRejectReason("");
      setNotice(`Pengajuan ${detail.kode_pengajuan} berhasil ditolak.`);
      await loadRequests();
    } catch (requestError) {
      setRejectError(requestError instanceof ApiError ? requestError.message : "Pengajuan gagal ditolak.");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader overline="KEPUTUSAN — PERSETUJUAN PENGAJUAN" title="Persetujuan Pengajuan" desc="Tinjau permintaan stok dari cabang. Alokasi dilakukan pada stok pusat yang tersedia; saldo pusat saat ini dimulai dari 0." />
      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <StatCard label="Menunggu Tinjauan" value={String(waiting)} caption="Belum mendapat alokasi" icon={<Clock size={22} />} tone="amber" />
        <StatCard label="Sedang Dialokasikan" value={String(inProgress)} caption="Sebagian atau menunggu diterima" icon={<Truck size={22} />} tone="blue" />
        <StatCard label="Selesai Diterima" value={String(completed)} caption="Pengajuan sudah diterima cabang" icon={<CheckCircle2 size={22} />} tone="green" />
      </div>
      {notice ? <div className="notice notice-ok" role="status">{notice}<button className="icon-pill" aria-label="Tutup" onClick={() => setNotice("")}><X size={14} /></button></div> : null}
      {error ? <div className="notice" role="alert">{error}<button className="btn btn-ghost" onClick={() => void loadRequests()}>Coba lagi</button></div> : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari ID pengajuan, produk, atau kode..." value={query} onChange={setQuery} />
        <div className="toolbar-chips">
          <select className="chip-select" aria-label="Filter Status Pengajuan" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            {STATUSES.map((value) => <option key={value} value={value}>{value === "Semua" ? "Semua Status" : requestStateLabel(value)}</option>)}
          </select>
          <select className="chip-select" aria-label="Filter Cabang" value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option value="all">Semua Cabang</option>
            {branches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead><tr><th>ID / WAKTU</th><th>CABANG</th><th>PRODUK</th><th className="tt-right">DIMINTA</th><th className="tt-right">DIALOKASIKAN</th><th className="tt-right">DITERIMA</th><th className="tt-right">SISA</th><th>STATUS</th><th className="tt-right">AKSI</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9}><div className="empty-note">Memuat pengajuan...</div></td></tr> : null}
            {!loading ? requests.map((request) => (
              <tr key={request.id_pengajuan}>
                <td><div className="tt-num">{request.kode_pengajuan}</div><div className="tt-sub">{request.created_at}</div></td>
                <td>{request.nama_cabang}</td>
                <td><div className="tt-num">{request.nama_barang}</div><div className="tt-sub">{request.jenis} · {request.kode_barang}</div></td>
                <td className="tt-right tt-money">{request.jumlah_diminta}</td>
                <td className="tt-right tt-money">{request.jumlah_dialokasikan}</td>
                <td className="tt-right tt-money">{request.jumlah_diterima}</td>
                <td className="tt-right tt-money">{request.sisa ?? Math.max(0, request.jumlah_diminta - request.jumlah_dialokasikan)}</td>
                <td><StatusPill label={requestStateLabel(request.state as RequestState)} /></td>
                <td className="tt-right">
                  {request.state !== "Ditolak" && (request.sisa ?? (request.jumlah_diminta - request.jumlah_dialokasikan)) > 0
                    ? <button className="link-action" onClick={() => navigate(`/owner/alokasi?requestId=${request.id_pengajuan}`)}>Alokasikan</button>
                    : null}
                  {request.state === "Diajukan" ? <button className="link-action" onClick={() => openDetail(request)}>Tolak</button> : null}
                </td>
              </tr>
            )) : null}
            {!loading && requests.length === 0 ? <tr><td colSpan={9}><div className="empty-note">Tidak ada pengajuan yang cocok.</div></td></tr> : null}
          </tbody>
        </table>
        <div className="table-foot"><span className="foot-note">Menampilkan {requests.length} pengajuan</span></div>
      </div>

      {detail ? (
        <div className="overlay" onClick={() => !rejecting && setDetail(null)}>
          <div className="confirm" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head" style={{ padding: 0 }}><div><h2>Tolak Pengajuan</h2><div className="section-desc">{detail.kode_pengajuan} · {detail.nama_cabang}</div></div><button className="icon-pill" aria-label="Tutup" onClick={() => setDetail(null)} disabled={rejecting}><X size={18} /></button></div>
            <form onSubmit={reject} className="drawer-form">
              <label className="afield"><span>Alasan penolakan (wajib)</span><textarea rows={4} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} maxLength={2000} required minLength={3} /></label>
              {rejectError ? <div className="form-error" role="alert">{rejectError}</div> : null}
              <div className="drawer-foot"><button type="button" className="btn btn-ghost" onClick={() => setDetail(null)} disabled={rejecting}>Batal</button><button type="submit" className="btn btn-primary" disabled={rejecting}>{rejecting ? "Menyimpan..." : "Tolak Pengajuan"}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
