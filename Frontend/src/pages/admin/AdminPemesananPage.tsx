import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ClipboardList, PackageCheck, PackagePlus } from "lucide-react";
import type { PoStatus } from "../../data/mock";
import { adminPoApi, ApiError } from "../../lib/api";
import { mapApiPo } from "../../lib/po";
import { useAuth } from "../../store/auth";
import { Avatar, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai", "Dibatalkan"];

export default function AdminPemesananPage() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Semua");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<ReturnType<typeof mapApiPo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const status = filter === "Semua" ? "" : ({
      Dipesan: "dipesan",
      Diproses: "diproses",
      "Sudah Datang": "sudah_datang",
      Selesai: "selesai",
      Dibatalkan: "dibatalkan",
    } as const)[filter];
    adminPoApi.orders(status, query)
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
  }, [filter, query]);

  const rows = orders;

  const baru = orders.filter((o) => o.status === "Dipesan").length;
  const diproses = orders.filter((o) => o.status === "Diproses").length;
  const datang = orders.filter((o) => o.status === "Sudah Datang").length;

  return (
    <div className="page">
      <PageHeader
        overline="OPERASIONAL — PEMESANAN"
        title="Pemesanan (PO)"
        desc={`Antrean PO dari Kasir ${session?.branch ?? "cabang"}. ${baru} PO baru menunggu diproses.`}
      />

      <div className="stat-row">
        <StatCard label="Pesanan Baru" value={String(baru).padStart(2, "0")} caption="Menunggu pemrosesan admin" icon={<PackagePlus size={22} />} tone="violet" />
        <StatCard label="Sedang Diproses" value={String(diproses).padStart(2, "0")} caption="Dalam penanganan cabang" icon={<ClipboardList size={22} />} tone="amber" />
        <StatCard label="Sudah Datang" value={String(datang).padStart(2, "0")} caption="Siap diambil pelanggan" icon={<PackageCheck size={22} />} tone="green" />
      </div>
      {error ? <div className="notice" role="alert">{error}</div> : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Pemesanan</h2>
            <div className="section-desc">Informasi pesanan pelanggan dan status terbaru</div>
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
          <div className="table-foot">
            <span className="foot-note">Menampilkan {rows.length} pesanan</span>
          </div>
        </div>
      </section>
    </div>
  );
}
