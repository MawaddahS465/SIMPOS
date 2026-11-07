import { Link } from "react-router-dom";
import {
  ShoppingCart,
  ClipboardList,
  Users,
  Glasses,
  ArrowRight,
  History,
  ReceiptText,
  PackageCheck,
  Wallet,
} from "lucide-react";
import { useSharedStore } from "../store/sharedStore";
import { useAuth } from "../store/auth";
import { formatIDR } from "../components/ui";
import "../styles/dashboard.css";

const MENU = [
  {
    to: "/transaksi-baru",
    icon: ShoppingCart,
    title: "Transaksi Baru",
    desc: "Pilih frame dan lensa untuk pelanggan baru",
    featured: true,
  },
  {
    to: "/pemesanan",
    icon: ClipboardList,
    title: "Pemesanan (PO)",
    desc: "Kelola pesanan barang yang belum tersedia",
  },
  {
    to: "/pelanggan",
    icon: Users,
    title: "Pelanggan",
    desc: "Cari, tambah, atau kelola data pelanggan",
  },
  {
    to: "/resep-mata",
    icon: Glasses,
    title: "Resep Mata",
    desc: "Kelola dan lihat riwayat resep pelanggan",
  },
];

export default function DashboardPage() {
  const shared = useSharedStore();
  const { session } = useAuth();
  const name = session?.name ?? "Kasir";
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const todayTrx = shared.transactions.filter((t) => t.date === today && t.status === "Selesai");
  const todayTotal = todayTrx.reduce((sum, t) => sum + t.total, 0);
  const readyPo = shared.pos.filter((o) => o.status === "Sudah Datang" && !o.linkedTrx);

  return (
    <div className="dash dashboard-anim">
      <section className="hero">
        <div className="hero-copy">
          <span className="overline">SELAMAT DATANG</span>
          <h1>{name}</h1>
          <p>Siap melayani pelanggan hari ini?</p>
          <Link className="btn btn-primary" to="/transaksi-baru">
            <ShoppingCart size={18} />
            Mulai Transaksi
          </Link>
        </div>
        <div className="hero-media" aria-hidden="true">
          <img src="/assets/hero-approved-right.jpg" alt="" />
        </div>
      </section>

      <section className="dash-metrics" aria-label="Ringkasan hari ini">
        <div className="dash-metric">
          <span className="dm-icon tone-violet">
            <ReceiptText size={20} />
          </span>
          <div>
            <span className="dm-label">Transaksi hari ini</span>
            <b>{todayTrx.length}</b>
            <span className="dm-caption">Transaksi lunas · {today}</span>
          </div>
        </div>
        <div className="dash-metric">
          <span className="dm-icon tone-green">
            <Wallet size={20} />
          </span>
          <div>
            <span className="dm-label">Penerimaan hari ini</span>
            <b>{formatIDR(todayTotal)}</b>
            <span className="dm-caption">Total pembayaran lunas</span>
          </div>
        </div>
        <Link className="dash-metric" to="/pemesanan">
          <span className="dm-icon tone-amber">
            <PackageCheck size={20} />
          </span>
          <div>
            <span className="dm-label">PO siap diambil</span>
            <b>{readyPo.length}</b>
            <span className="dm-caption">
              {readyPo.length > 0 ? "Barang sudah datang di cabang" : "Tidak ada PO menunggu pengambilan"}
            </span>
          </div>
          <ArrowRight size={17} className="dm-arrow" />
        </Link>
      </section>

      <section>
        <div className="section-head">
          <h2>Menu Utama</h2>
          <p>Pilih menu untuk memulai aktivitas</p>
        </div>

        <div className="menu-cards">
          {MENU.map((m) => (
            <Link key={m.to} to={m.to} className={`menu-card ${m.featured ? "featured" : ""}`}>
              <span className="m-icon">
                <m.icon size={24} strokeWidth={2.1} />
              </span>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className="m-arrow">
                <ArrowRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="history-strip">
        <span className="h-icon">
          <History size={24} strokeWidth={2.1} />
        </span>
        <div>
          <h3>Riwayat Transaksi</h3>
          <p>Lihat transaksi hari ini atau cari transaksi sebelumnya</p>
        </div>
        <Link className="btn btn-ghost" to="/riwayat-transaksi">
          Buka
          <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
