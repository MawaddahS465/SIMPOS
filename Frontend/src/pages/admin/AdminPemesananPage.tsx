import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ClipboardList, PackageCheck, PackagePlus } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import type { PoStatus } from "../../data/mock";
import { Avatar, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai", "Dibatalkan"];

export default function AdminPemesananPage() {
  const store = useSharedStore();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Semua");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      store.pos
        .filter((o) => (filter === "Semua" ? true : o.status === filter))
        .filter((o) =>
          `${o.number} ${o.customer} ${o.phone} ${o.productLabel}`.toLowerCase().includes(query.toLowerCase()),
        ),
    [store.pos, filter, query],
  );

  const baru = store.pos.filter((o) => o.status === "Dipesan").length;
  const diproses = store.pos.filter((o) => o.status === "Diproses").length;
  const datang = store.pos.filter((o) => o.status === "Sudah Datang").length;

  return (
    <div className="page">
      <PageHeader
        overline="OPERASIONAL — PEMESANAN"
        title="Pemesanan (PO)"
        desc={`Antrean PO dari Kasir ${DEMO_ADMIN.branch}. ${baru} PO baru menunggu diproses.`}
      />

      <div className="stat-row">
        <StatCard label="Pesanan Baru" value={String(baru).padStart(2, "0")} caption="Menunggu pemrosesan admin" icon={<PackagePlus size={22} />} tone="violet" />
        <StatCard label="Sedang Diproses" value={String(diproses).padStart(2, "0")} caption="Dalam penanganan cabang" icon={<ClipboardList size={22} />} tone="amber" />
        <StatCard label="Sudah Datang" value={String(datang).padStart(2, "0")} caption="Siap diambil pelanggan" icon={<PackageCheck size={22} />} tone="green" />
      </div>

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
              {rows.map((o) => (
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
                    <div className="tt-sub">{o.products[1]}</div>
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-note">Tidak ada pesanan yang cocok dengan filter.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="foot-note">Menampilkan {rows.length} dari {store.pos.length} pesanan</span>
          </div>
        </div>
      </section>
    </div>
  );
}
