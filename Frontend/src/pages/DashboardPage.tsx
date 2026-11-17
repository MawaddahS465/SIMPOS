import { useEffect, useState } from "react";
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
import { useAuth } from "../store/auth";
import { formatIDR } from "../components/ui";
import { kasirApi, type ApiOrder, type ApiTransaction } from "../lib/api";
import { assetUrl } from "../lib/assets";
import "../styles/dashboard.css";

const MENU = [
  {
    to: "/transaksi-baru",
    icon: ShoppingCart,
    title: "Transaksi Baru",
  },
  {
    to: "/pemesanan",
    icon: ClipboardList,
    title: "Pemesanan (PO)",
  },
  {
    to: "/pelanggan",
    icon: Users,
    title: "Pelanggan",
  },
  {
    to: "/resep-mata",
    icon: Glasses,
    title: "Resep Mata",
  },
];

export default function DashboardPage() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [readyPo, setReadyPo] = useState<ApiOrder[]>([]);
  const [loadError, setLoadError] = useState("");
  const name = session?.name ?? "Kasir";
  const now = new Date();
  const todaySql = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    let active = true;
    Promise.all([kasirApi.transactions(), kasirApi.orders("sudah_datang")])
      .then(([transactionRows, orderRows]) => {
        if (!active) return;
        setTransactions(transactionRows);
        setReadyPo(orderRows);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Ringkasan kasir gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, []);

  const todayTrx = transactions.filter((transaction) =>
    transaction.tanggal_transaksi.startsWith(todaySql) && transaction.status === "selesai",
  );
  const todayTotal = todayTrx.reduce((sum, transaction) => sum + Number(transaction.total), 0);

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
          <img src={assetUrl("assets/hero-approved-right.jpg")} alt="" />
        </div>
      </section>

      {loadError ? <div className="notice" role="alert">{loadError}</div> : null}

      <section className="dash-metrics" aria-label="Ringkasan hari ini">
        <div className="dash-metric">
          <span className="dm-icon tone-violet">
            <ReceiptText size={20} />
          </span>
          <div>
            <span className="dm-label">Transaksi hari ini</span>
            <b>{todayTrx.length}</b>
          </div>
        </div>
        <div className="dash-metric">
          <span className="dm-icon tone-green">
            <Wallet size={20} />
          </span>
          <div>
            <span className="dm-label">Penerimaan hari ini</span>
            <b>{formatIDR(todayTotal)}</b>
          </div>
        </div>
        <Link className="dash-metric" to="/pemesanan">
          <span className="dm-icon tone-amber">
            <PackageCheck size={20} />
          </span>
          <div>
            <span className="dm-label">PO siap diambil</span>
            <b>{readyPo.length}</b>
          </div>
          <ArrowRight size={17} className="dm-arrow" />
        </Link>
      </section>

      <section>
        <div className="section-head">
          <h2>Menu Utama</h2>
        </div>

        <div className="menu-cards">
          {MENU.map((m) => (
            <Link key={m.to} to={m.to} className="menu-card">
              <span className="m-icon">
                <m.icon size={24} strokeWidth={2.1} />
              </span>
              <h3>{m.title}</h3>
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
        </div>
        <Link className="btn btn-ghost" to="/riwayat-transaksi">
          Buka
          <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
