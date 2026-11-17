import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ClipboardList, PackageCheck, PackagePlus, Plus } from "lucide-react";
import { type PoStatus } from "../data/mock";
import { ApiError, kasirApi } from "../lib/api";
import { mapApiPo } from "../lib/po";
import { Avatar, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import PoBuilderModal from "../components/PoBuilderModal";
import "../styles/pages.css";
import "../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai", "Dibatalkan"];

export default function PemesananPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Semua");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [prefillId, setPrefillId] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [orders, setOrders] = useState<ReturnType<typeof mapApiPo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Buka otomatis modal Buat PO bila diarahkan dari Katalog/Checkout (?productId=...)
  useEffect(() => {
    const pid = searchParams.get("productId");
    if (pid) {
      setPrefillId(pid);
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = filter === "Semua" ? "" : Object.entries({
        dipesan: "Dipesan",
        diproses: "Diproses",
        sudah_datang: "Sudah Datang",
        selesai: "Selesai",
        dibatalkan: "Dibatalkan",
      }).find(([, label]) => label === filter)?.[0] ?? "";
      const results = await kasirApi.orders(status);
      setOrders(results.map((order) => mapApiPo(order)));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Daftar PO gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const rows = useMemo(
    () => orders.filter((order) =>
      `${order.number} ${order.customer} ${order.phone} ${order.productLabel}`.toLowerCase().includes(query.toLowerCase()),
    ),
    [orders, query],
  );

  const poBaru = orders.filter((o) => o.status === "Dipesan").length;
  const diproses = orders.filter((o) => o.status === "Diproses").length;
  const datang = orders.filter((o) => o.status === "Sudah Datang").length;

  const startCreate = () => {
    setPrefillId(null);
    setCreated(null);
    setOpen(true);
  };

  return (
    <div className="page">
      <PageHeader
        title="Pemesanan (PO)"
        actions={
          <button className="btn btn-primary" onClick={startCreate}>
            <Plus size={16} />
            Buat PO Baru
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Pesanan Baru" value={String(poBaru).padStart(2, "0")} caption="Menunggu pemrosesan admin" icon={<PackagePlus size={22} />} tone="violet" />
        <StatCard label="Sedang Diproses" value={String(diproses).padStart(2, "0")} caption="Dalam penanganan cabang" icon={<ClipboardList size={22} />} tone="amber" />
        <StatCard label="Sudah Datang" value={String(datang).padStart(2, "0")} caption="Siap diambil pelanggan" icon={<PackageCheck size={22} />} tone="green" />
      </div>

      {created ? (
        <div className="notice notice-ok" role="status">
          PO {created} berhasil dicatat dengan status <b>Dipesan</b> dan diteruskan ke Admin Cabang.{" "}
          <Link className="link-action" to={`/pemesanan/${created}`}>
            Lihat Detail
            <ChevronRight size={15} />
          </Link>
        </div>
      ) : null}
      {error ? <div className="notice" role="alert">{error}</div> : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Pemesanan</h2>
            <div className="section-desc">Informasi pesanan pelanggan dan status terbaru dari Admin Cabang</div>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox placeholder="Cari nomor PO, nama pelanggan, atau nomor HP..." value={query} onChange={setQuery} />
          <div className="toolbar-chips">
            <select
              className="chip-select"
              aria-label="Filter Status"
              value={filter}
              onChange={(e) => setFilter(e.target.value as "Semua" | PoStatus)}
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
              ) : rows.map((o) => (
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
                    <div className="tt-sub">{o.items.length ? `${o.items.length} jenis produk` : "Detail produk tersedia di PO"}</div>
                  </td>
                  <td className="tt-center">
                    <StatusPill label={o.status} />
                  </td>
                  <td className="tt-right">
                    <Link className="link-action" to={`/pemesanan/${o.id}`}>
                      Lihat Detail
                      <ChevronRight size={15} />
                    </Link>
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
          <div className="table-foot">
            <span className="foot-note">Menampilkan {rows.length} dari {orders.length} pesanan</span>
          </div>
        </div>
      </section>

      {open ? (
        <PoBuilderModal
          initialProductId={prefillId ?? undefined}
          onClose={() => setOpen(false)}
          onCreated={(id) => {
            setCreated(id);
            setOpen(false);
            setRefreshKey((key) => key + 1);
          }}
        />
      ) : null}
    </div>
  );
}
