import { Link } from "react-router-dom";
import { ArrowRight, Boxes, ClipboardList, FilePlus2, PackageCheck, Plus } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useAdminStore } from "../../store/sharedStore";
import { PageHeader, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminDashboardPage() {
  const store = useAdminStore();
  const poBaru = store.pos.filter((o) => o.status === "Dipesan");
  const menunggu = store.distributions.filter((d) => d.status !== "Diterima");

  const tindakLanjut = [
    ...store.lowStock.slice(0, 3).map((s) => ({
      key: s.product.id,
      title: `${s.product.code} — ${s.product.name}`,
      sub: `Stok ${s.saldo} / minimum ${s.minimum}`,
      status: "Stok Menipis",
      to: "/admin/stok",
      aksi: "Atur minimum",
    })),
    ...poBaru.slice(0, 2).map((o) => ({
      key: o.id,
      title: `${o.number} — ${o.customer}`,
      sub: o.productLabel,
      status: "Dipesan",
      to: `/admin/pemesanan/${o.id}`,
      aksi: "Proses",
    })),
  ].slice(0, 5);

  return (
    <div className="page dashboard-anim">
      <PageHeader
        overline="DASHBOARD ADMIN CABANG"
        title={`Dashboard Admin Cabang`}
        desc={`Ringkasan kebutuhan harian ${DEMO_ADMIN.branch}. Setiap angka menuju daftar sumbernya.`}
        actions={<span className="branch-chip">{DEMO_ADMIN.branch}</span>}
      />

      <div className="stat-row">
        <Link to="/admin/stok" className="stat-link">
          <StatCard
            label="Stok Menipis"
            value={String(store.lowStock.length)}
            caption="Saldo ≤ batas minimum"
            icon={<Boxes size={22} />}
            tone="amber"
          />
        </Link>
        <Link to="/admin/pemesanan" className="stat-link">
          <StatCard
            label="PO Baru"
            value={String(poBaru.length)}
            caption="Menunggu diproses"
            icon={<ClipboardList size={22} />}
            tone="blue"
          />
        </Link>
        <Link to="/admin/penerimaan" className="stat-link">
          <StatCard
            label="Menunggu Penerimaan"
            value={String(menunggu.length)}
            caption="Distribusi dari pusat"
            icon={<PackageCheck size={22} />}
            tone="violet"
          />
        </Link>
      </div>

      <div className="action-row">
        <div className="btn-group">
          <Link className="btn btn-primary" to="/admin/produk/frame?new=1">
            <Plus size={16} />
            Tambah Produk
          </Link>
          <Link className="btn btn-ghost" to="/admin/penerimaan">
            <PackageCheck size={16} />
            Catat Penerimaan
          </Link>
          <Link className="btn btn-ghost" to="/admin/pengajuan?new=1">
            <FilePlus2 size={16} />
            Ajukan Stok
          </Link>
        </div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Perlu Ditindaklanjuti</h2>
            <div className="section-desc">Maksimal 5 baris prioritas cabang ini</div>
          </div>
          <Link className="link-action" to="/admin/stok">
            Lihat stok
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="todo-list">
          {tindakLanjut.map((t) => (
            <div key={t.key} className="todo-row">
              <div className="todo-body">
                <b>{t.title}</b>
                <span>{t.sub}</span>
              </div>
              <StatusPill label={t.status} />
              <span className="todo-aksi">{t.aksi}</span>
            </div>
          ))}
          {tindakLanjut.length === 0 ? (
            <div className="empty-note">Tidak ada tindakan mendesak hari ini.</div>
          ) : null}
        </div>
      </section>

      <span className="foot-note">Seluruh data pada halaman ini adalah demo cabang {DEMO_ADMIN.branch}.</span>
    </div>
  );
}
