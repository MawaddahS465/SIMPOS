import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ClipboardList, PackageCheck, PackagePlus } from "lucide-react";
import type { PoStatus } from "../../data/mock";
import { adminPoApi, ApiError } from "../../lib/api";
import { mapApiPo } from "../../lib/po";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { Avatar, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import AdminPagination from "../../components/AdminPagination";
import "../../styles/pages.css";
import "../../styles/admin.css";

type Filter = "Semua" | PoStatus;

const FILTERS: Filter[] = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai", "Dibatalkan"];

const FILTER_TO_API: Record<Exclude<Filter, "Semua">, string> = {
  Dipesan: "dipesan",
  Diproses: "diproses",
  "Sudah Datang": "sudah_datang",
  Selesai: "selesai",
  Dibatalkan: "dibatalkan",
};

function filterFromParam(value: string | null): Filter {
  if (!value) return "Semua";
  const match = (Object.entries(FILTER_TO_API) as Array<[Filter, string]>).find(([, api]) => api === value);
  return match ? match[0] : "Semua";
}

export default function AdminPemesananPage() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => filterFromParam(params.get("status")));
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<ReturnType<typeof mapApiPo>[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    adminPoApi.orders()
      .then((rows) => {
        if (active) setOrders(rows.map((order) => mapApiPo(order)));
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof ApiError ? requestError.message : "Daftar PO gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const debouncedQuery = useDebouncedValue(query);
  const rows = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === "Semua" || order.status === filter;
      const searchable = `${order.number} ${order.customer} ${order.phone} ${order.productLabel}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [orders, filter, debouncedQuery]);
  const stats = useMemo(() => ({
    baru: orders.filter((order) => order.status === "Dipesan").length,
    diproses: orders.filter((order) => order.status === "Diproses").length,
    datang: orders.filter((order) => order.status === "Sudah Datang").length,
  }), [orders]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedQuery]);
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const changeFilter = (value: Filter) => {
    setFilter(value);
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "Semua") next.delete("status");
      else next.set("status", FILTER_TO_API[value]);
      return next;
    }, { replace: true });
  };

  const { baru, diproses, datang } = stats;

  return (
    <div className="page">
      <PageHeader
        overline="OPERASIONAL — PEMESANAN"
        title="Pemesanan (PO)"
      />

      <div className="stat-row">
        <StatCard label="Pesanan Baru" value={loading || error ? "—" : String(baru)} caption="Menunggu pemrosesan admin" icon={<PackagePlus size={22} />} tone="violet" />
        <StatCard label="Sedang Diproses" value={loading || error ? "—" : String(diproses)} caption="Dalam penanganan cabang" icon={<ClipboardList size={22} />} tone="amber" />
        <StatCard label="Sudah Datang" value={loading || error ? "—" : String(datang)} caption="Siap diambil pelanggan" icon={<PackageCheck size={22} />} tone="green" />
      </div>
      {error ? (
        <div className="notice" role="alert">
          {error}{" "}
          <button className="btn btn-ghost" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Coba lagi
          </button>
        </div>
      ) : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Pemesanan</h2>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox placeholder="Cari nomor PO, nama pelanggan, atau nomor HP..." value={query} onChange={setQuery} />
          <div className="toolbar-chips">
            <select
              className="chip-select"
              aria-label="Filter Status"
              value={filter}
              onChange={(e) => changeFilter(e.target.value as Filter)}
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
                <th>NO. PO / TANGGAL</th>
                <th>PELANGGAN</th>
                <th>PRODUK DIPESAN</th>
                <th className="tt-center">STATUS PO</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="empty-note">Memuat daftar PO...</div></td></tr>
              ) : visibleRows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="tt-num">{o.number}</div>
                    <div className="tt-sub">{o.date}</div>
                  </td>
                  <td>
                    <div className="cell-person">
                      <Avatar initials={o.initials} size={40} />
                      <span>
                        <b>{o.customer}</b>
                        <span>{o.phone}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {o.productLabel}
                    </div>
                    <div className="tt-sub">{o.itemCount > 0 ? `${o.itemCount} jenis produk` : "Detail produk tersedia di PO"}</div>
                  </td>
                  <td className="tt-center">
                    <StatusPill label={o.status} />
                  </td>
                  <td className="tt-right">
                    <div className="row-actions">
                      {o.status === "Sudah Datang" ? (
                        <span className="tt-sub" style={{ marginTop: 0, fontWeight: 700 }}>
                          Menunggu pengambilan Kasir
                        </span>
                      ) : null}
                      <Link className="link-action" to={`/admin/pemesanan/${o.id}`}>
                        Lihat Detail
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-note">Tidak ada pesanan yang cocok dengan filter.</div>
                  </td>
                </tr>
              ) : null}
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
      </section>
    </div>
  );
}
