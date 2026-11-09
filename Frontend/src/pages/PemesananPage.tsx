import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ClipboardList, PackageCheck, PackagePlus, Plus } from "lucide-react";
import { type PoStatus } from "../data/mock";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import PoBuilderModal from "../components/PoBuilderModal";
import "../styles/pages.css";
import "../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai", "Dibatalkan"];

export default function PemesananPage() {
  const shared = useSharedStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Semua");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [prefillId, setPrefillId] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  // Buka otomatis modal Buat PO bila diarahkan dari Katalog/Checkout (?productId=...)
  useEffect(() => {
    const pid = searchParams.get("productId");
    if (pid) {
      setPrefillId(pid);
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // PO dibaca dari shared store — Kasir mencatat PO dan memantau status yang diperbarui Admin Cabang.
  const rows = shared.pos
    .filter((o) => (filter === "Semua" ? true : o.status === filter))
    .filter((o) => `${o.number} ${o.customer} ${o.phone} ${o.productLabel}`.toLowerCase().includes(query.toLowerCase()));

  const poBaru = shared.pos.filter((o) => o.status === "Dipesan").length;
  const diproses = shared.pos.filter((o) => o.status === "Diproses").length;
  const datang = shared.pos.filter((o) => o.status === "Sudah Datang").length;

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
                    <Link className="link-action" to={`/pemesanan/${o.id}`}>
                      Lihat Detail
                      <ChevronRight size={15} />
                    </Link>
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
            <span className="foot-note">Menampilkan {rows.length} dari {shared.pos.length} pesanan</span>
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
          }}
        />
      ) : null}
    </div>
  );
}
