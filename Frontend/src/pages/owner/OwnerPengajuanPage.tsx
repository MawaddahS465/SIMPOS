import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Truck } from "lucide-react";
import { ApiError, ownerStockFlowApi, type StockRequestRow } from "../../lib/api";
import { requestStateLabel, type RequestState } from "../../store/requestStatus";
import { PageHeader, SearchBox, StatCard, StatusPill, TableCols } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type StatusFilter = "Semua" | RequestState;

const STATUSES: StatusFilter[] = ["Semua", "Diajukan", "Sebagian", "Dialokasikan", "Selesai", "Ditolak"];

function formatRequestDate(value: string): string {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  const date = parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const time = parsed.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  return `${date}, ${time}`;
}

export default function OwnerPengajuanPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<StockRequestRow[]>([]);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("Semua");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page">
      <PageHeader title="Persetujuan Pengajuan" />
      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <StatCard label="Menunggu Tinjauan" value={String(waiting)} caption="Belum mendapat alokasi" icon={<Clock size={22} />} tone="amber" />
        <StatCard label="Sedang Dialokasikan" value={String(inProgress)} caption="Sebagian atau menunggu diterima" icon={<Truck size={22} />} tone="blue" />
        <StatCard label="Selesai Diterima" value={String(completed)} caption="Pengajuan sudah diterima cabang" icon={<CheckCircle2 size={22} />} tone="green" />
      </div>
      {error ? <div className="notice" role="alert">{error}<button className="btn btn-ghost" onClick={() => void loadRequests()}>Coba lagi</button></div> : null}

      <div className="toolbar">
        <SearchBox placeholder="" value={query} onChange={setQuery} />
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
        <table className="tt owner-table owner-table-dense owner-table-pengajuan">
          <TableCols widths={["15%", "13%", "16%", "7%", "10%", "8%", "5%", "17%", "9%"]} />
          <thead><tr><th>ID / WAKTU</th><th>CABANG</th><th>PRODUK</th><th className="tt-center">DIMINTA</th><th className="tt-center">DIALOKASIKAN</th><th className="tt-center">DITERIMA</th><th className="tt-center">SISA</th><th className="tt-center">STATUS</th><th className="tt-right">AKSI</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9}><div className="empty-note">Memuat pengajuan...</div></td></tr> : null}
            {!loading ? requests.map((request) => (
              <tr key={request.id_pengajuan}>
                <td><div className="tt-num">{request.kode_pengajuan}</div><div className="tt-sub tt-nowrap">{formatRequestDate(request.created_at)}</div></td>
                <td>{request.nama_cabang}</td>
                <td><div className="tt-num">{request.nama_barang}</div><div className="tt-sub">{request.jenis} · {request.kode_barang}</div></td>
                <td className="tt-center tt-money">{request.jumlah_diminta}</td>
                <td className="tt-center tt-money">{request.jumlah_dialokasikan}</td>
                <td className="tt-center tt-money">{request.jumlah_diterima}</td>
                <td className="tt-center tt-money">{request.sisa ?? Math.max(0, request.jumlah_diminta - request.jumlah_dialokasikan)}</td>
                <td className="tt-center"><StatusPill label={requestStateLabel(request.state as RequestState)} /></td>
                <td className="tt-right">
                  <div className="owner-row-actions">
                    {request.state !== "Ditolak" && (request.sisa ?? (request.jumlah_diminta - request.jumlah_dialokasikan)) > 0
                      ? <button className="link-action" onClick={() => navigate(`/owner/alokasi?requestId=${request.id_pengajuan}`)}>Alokasikan</button>
                      : null}
                  </div>
                </td>
              </tr>
            )) : null}
            {!loading && requests.length === 0 ? <tr><td colSpan={9}><div className="empty-note">Tidak ada pengajuan yang cocok.</div></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
