import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, ClipboardList, FilePlus2, PackageCheck, Plus } from "lucide-react";
import { adminPoApi, ApiError, type AdminDashboardSummary } from "../../lib/api";
import { PageHeader, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setSummary(await adminPoApi.dashboard());
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Ringkasan dashboard gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const tindakLanjut = [
    ...(summary?.lowStock ?? []).map((product) => ({
      key: `stock-${product.id}`,
      title: `${product.kode_barang} — ${product.nama_barang}`,
      sub: `Stok ${product.stok} / minimum ${product.stok_minimum}`,
      status: product.stok === 0 ? "Stok Habis" : "Stok Menipis",
      to: "/admin/stok",
      aksi: "Lihat stok",
    })),
    ...(summary?.newOrders ?? []).map((order) => ({
      key: `po-${order.id_po}`,
      title: `${order.kode_po} — ${order.nama_pelanggan ?? "Pelanggan"}`,
      sub: order.produk_label || "Detail produk tersedia di PO",
      status: "Dipesan",
      to: `/admin/pemesanan/${order.id_po}`,
      aksi: "Proses",
    })),
  ].slice(0, 5);

  return (
    <div className="page dashboard-anim">
      <PageHeader
        overline="DASHBOARD ADMIN CABANG"
        title="Dashboard Admin Cabang"
        actions={summary ? <span className="branch-chip">{summary.branch}</span> : null}
      />

      {error ? (
        <div className="notice" role="alert">
          {error}{" "}
          <button className="btn btn-ghost" type="button" onClick={() => void loadSummary()}>
            Coba lagi
          </button>
        </div>
      ) : null}

      <div className="stat-row">
        <Link to="/admin/stok" className="stat-link">
          <StatCard
            label="Stok Menipis"
            value={loading || error ? "—" : String(summary?.stats.lowStock ?? 0)}
            caption="Saldo ≤ batas minimum"
            icon={<Boxes size={22} />}
            tone="amber"
          />
        </Link>
        <Link to="/admin/pemesanan?status=dipesan" className="stat-link">
          <StatCard
            label="PO Baru"
            value={loading || error ? "—" : String(summary?.stats.newOrders ?? 0)}
            caption="Menunggu diproses"
            icon={<ClipboardList size={22} />}
            tone="blue"
          />
        </Link>
        <Link to="/admin/pemesanan?status=diproses" className="stat-link">
          <StatCard
            label="PO Diproses"
            value={loading || error ? "—" : String(summary?.stats.processingOrders ?? 0)}
            caption="Sedang ditangani cabang"
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
            Konfirmasi Penerimaan
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
            <div className="section-desc">Stok minimum dan PO baru pada cabang ini</div>
          </div>
          <Link className="link-action" to="/admin/stok">
            Lihat stok
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="todo-list">
          {loading ? <div className="empty-note">Memuat ringkasan cabang...</div> : null}
          {!loading
            ? tindakLanjut.map((item) => (
                <Link key={item.key} to={item.to} className="todo-row">
                  <div className="todo-body">
                    <b>{item.title}</b>
                    <span>{item.sub}</span>
                  </div>
                  <StatusPill label={item.status} />
                  <span className="todo-aksi">{item.aksi}</span>
                </Link>
              ))
            : null}
          {!loading && !error && tindakLanjut.length === 0 ? (
            <div className="empty-note">Tidak ada tindakan mendesak hari ini.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
