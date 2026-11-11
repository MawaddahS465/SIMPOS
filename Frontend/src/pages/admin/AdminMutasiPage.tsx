import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react";
import { adminStockFlowApi, ApiError, type StockMutation } from "../../lib/api";
import { formatDateTime } from "../../lib/po";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import AdminPagination from "../../components/AdminPagination";
import "../../styles/pages.css";
import "../../styles/admin.css";

type Direction = "Semua" | "IN" | "OUT";

export default function AdminMutasiPage() {
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<Direction>("Semua");
  const [source, setSource] = useState("Semua");
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const debouncedQuery = useDebouncedValue(query);

  const loadMutations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMutations(await adminStockFlowApi.mutations());
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Riwayat mutasi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [reloadKey]);

  useEffect(() => {
    void loadMutations();
  }, [loadMutations]);

  const rows = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return mutations.filter((mutation) => {
      const matchesDirection = direction === "Semua" || mutation.arah === direction;
      const matchesSource = source === "Semua" || mutation.sumber === source;
      const searchable = `${mutation.id_mutasi} ${mutation.referensi} ${mutation.kode_barang} ${mutation.nama_barang}`.toLowerCase();
      return matchesDirection && matchesSource && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [mutations, direction, source, debouncedQuery]);
  const totalIn = mutations.filter((mutation) => mutation.arah === "IN").reduce((total, mutation) => total + mutation.jumlah, 0);
  const totalOut = mutations.filter((mutation) => mutation.arah === "OUT").reduce((total, mutation) => total + mutation.jumlah, 0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [direction, source, debouncedQuery]);
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  return (
    <div className="page">
      <PageHeader overline="PERSEDIAAN — MUTASI" title="Riwayat Mutasi" />
      <div className="stat-row">
        <StatCard label="Total Barang Masuk" value={loading || error ? "—" : `+${totalIn}`} caption="Penerimaan & saldo awal" icon={<ArrowDownLeft size={22} />} tone="green" />
        <StatCard label="Total Barang Keluar" value={loading || error ? "—" : String(totalOut)} caption="Penjualan & pengambilan PO" icon={<ArrowUpRight size={22} />} tone="amber" />
        <StatCard label="Total Catatan Mutasi" value={loading || error ? "—" : String(mutations.length)} caption="Seluruh mutasi cabang" icon={<History size={22} />} tone="violet" />
      </div>
      {error ? <div className="notice" role="alert">{error}<button className="btn btn-ghost" onClick={() => setReloadKey((key) => key + 1)}>Coba lagi</button></div> : null}
      <div className="toolbar">
        <SearchBox placeholder="Cari ID mutasi, referensi, kode, atau nama produk..." value={query} onChange={setQuery} />
        <select className="select-pill" aria-label="Filter Jenis Mutasi" value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
          <option value="Semua">Semua Jenis</option><option value="IN">Masuk</option><option value="OUT">Keluar</option>
        </select>
        <select className="select-pill" aria-label="Filter Sumber" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="Semua">Semua Sumber</option><option value="Penerimaan">Penerimaan</option><option value="Penjualan">Penjualan</option><option value="Pengambilan PO">Pengambilan PO</option><option value="Pembatalan">Pembatalan</option><option value="Saldo Awal">Saldo Awal</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="tt">
          <thead><tr><th>WAKTU / ID</th><th>PRODUK</th><th className="tt-center">JENIS</th><th>SUMBER / REFERENSI</th><th className="tt-right">MUTASI STOK</th><th>PETUGAS</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6}><div className="empty-note">Memuat riwayat mutasi...</div></td></tr> : null}
            {!loading ? visibleRows.map((mutation) => (
              <tr key={mutation.id_mutasi}>
                <td><div className="tt-num">MUT-{mutation.id_mutasi}</div><div className="tt-sub">{formatDateTime(mutation.created_at)}</div></td>
                <td><div className="tt-num">{mutation.nama_barang}</div><div className="tt-sub">{mutation.kode_barang} · {mutation.jenis}</div></td>
                <td className="tt-center"><StatusPill label={mutation.arah === "IN" ? "Masuk" : "Keluar"} /></td>
                <td><div className="tt-num">{mutation.sumber}</div><div className="tt-sub">{mutation.referensi}</div></td>
                <td className="tt-right"><div className="tt-money" style={{ color: mutation.arah === "IN" ? "var(--ok-ink)" : "var(--danger-ink)" }}>{mutation.arah === "IN" ? "+" : "-"}{mutation.jumlah} unit</div><div className="tt-sub">Saldo: {mutation.saldo_sebelum} → <b style={{ color: "var(--ink)" }}>{mutation.saldo_sesudah}</b></div></td>
                <td><div className="tt-num">{mutation.petugas ?? "Sistem"}</div></td>
              </tr>
            )) : null}
            {!loading && rows.length === 0 ? <tr><td colSpan={6}><div className="empty-note">Tidak ada mutasi yang cocok dengan filter.</div></td></tr> : null}
          </tbody>
        </table>
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
