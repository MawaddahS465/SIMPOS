import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Check, Eye, Glasses, History, Package, Printer, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSharedStore } from "../store/sharedStore";
import { useAuth } from "../store/auth";
import { formatIDR } from "../components/ui";
import MRLogo from "../components/MRLogo";
import "../styles/pages.css";
import "../styles/admin.css";

function ProductIcon({ category }: { category: string }) {
  if (category === "Aksesoris") return <Package size={20} strokeWidth={1.7} />;
  if (category === "Lensa") return <Eye size={20} strokeWidth={1.7} />;
  return <Glasses size={20} strokeWidth={1.7} />;
}

export default function TransaksiBerhasilPage() {
  const cart = useCart();
  const shared = useSharedStore();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [strukOpen, setStrukOpen] = useState(false);
  const r = cart.receipt;

  if (!r) return <Navigate to="/riwayat-transaksi" replace />;

  const items = r.items;
  const subtotal = r.subtotal;
  const discount = r.discount;
  const total = r.total;
  const trxNo = r.no;
  const trxDate = r.date;
  const trxTime = r.time;
  const customerName = r.customer?.name ?? "Pelanggan Kasir";
  const method = r.method;
  const paid = method === "Tunai" ? r.paid : total;
  const change = method === "Tunai" ? r.change : 0;
  const linkedPo = r.poId ? shared.pos.find((p) => p.id === r.poId) : undefined;

  return (
    <div className="success page">
      <div className="success-hero">
        <span className="success-badge">
          <Check size={38} strokeWidth={3} />
        </span>
        <h1>Transaksi Berhasil</h1>
        <p>Pembayaran telah diproses dan pesanan berhasil disimpan.</p>
      </div>

      <div className="two-col">
        <section className="co-card">
          <div className="section-head">
            <h2>Informasi Transaksi</h2>
          </div>
          <div>
            <div className="info-row">
              <span>No. Transaksi</span>
              <b>{trxNo}</b>
            </div>
            <div className="info-row">
              <span>Tanggal &amp; Jam</span>
              <b>
                {trxDate}, {trxTime} WIB
              </b>
            </div>
            <div className="info-row">
              <span>Kasir</span>
              <b>{session?.name ?? "Kasir"}</b>
            </div>
            <div className="info-row">
              <span>Nama Pelanggan</span>
              <b>{customerName}</b>
            </div>
            {linkedPo ? (
              <div className="info-row">
                <span>Pengambilan PO</span>
                <b>{linkedPo.number}</b>
              </div>
            ) : null}
            <div className="info-row">
              <span>Metode Pembayaran</span>
              <b>{method}</b>
            </div>
            <div className="info-row">
              <span>Status</span>
              <span className="status-pill" style={{ background: "#e2f7ec", color: "#1f9d63" }}>
                <i style={{ background: "#1f9d63" }} />
                Lunas
              </span>
            </div>
          </div>
        </section>

        <section className="co-card">
          <div className="section-head">
            <h2>Produk yang Dibeli</h2>
          </div>
          <div>
            {items.map((i) => (
              <div key={i.id} className="receipt-line">
                <span className="rl-ico">
                  <ProductIcon category={i.category} />
                </span>
                <span className="rl-body">
                  <b>{i.name}</b>
                  <span>
                    {i.brand} · {i.category} · Qty: {i.qty}
                  </span>
                </span>
                <span className="tt-money">{formatIDR(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div className="section-head" style={{ marginTop: 6 }}>
            <h2>Ringkasan Pembayaran</h2>
          </div>
          <div>
            <div className="info-row">
              <span>Subtotal</span>
              <b>{formatIDR(subtotal)}</b>
            </div>
            <div className="info-row">
              <span>
                Diskon
                {r?.discountPercent ? ` (${r.discountPercent}%)` : ""}
              </span>
              <b>{formatIDR(discount)}</b>
            </div>
            <div className="info-row">
              <span>
                <b style={{ color: "var(--ink)" }}>Total Pembayaran</b>
              </span>
              <b>{formatIDR(total)}</b>
            </div>
            {method === "Tunai" ? (
              <>
                <div className="info-row">
                  <span>Jumlah Dibayar</span>
                  <b>{formatIDR(paid)}</b>
                </div>
                <div className="info-row">
                  <span>Kembalian</span>
                  <b style={{ color: "var(--ok-ink)" }}>{formatIDR(change)}</b>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>

      <div className="action-row success-actions">
        <div className="btn-group">
          <button className="btn btn-ghost" onClick={() => setStrukOpen(true)}>
            <Printer size={16} />
            Cetak Struk
          </button>
          <Link className="btn btn-ghost" to="/riwayat-transaksi">
            <History size={16} />
            Lihat Riwayat
          </Link>
          <button className="btn btn-primary" onClick={() => navigate("/transaksi-baru")}>
            Transaksi Baru
          </button>
        </div>
      </div>

      {strukOpen ? (
        <div className="overlay" onClick={() => setStrukOpen(false)}>
          <div className="drawer struk-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Struk Transaksi</h2>
                <div className="section-desc">{trxNo}</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setStrukOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="struk-print" id="struk-print">
              <div className="struk-brand">
                <div className="struk-logo">
                  <MRLogo size={44} />
                </div>
                <b>{shared.settings.storeName.split("—")[0].trim()}</b>
                <span>{session?.branch ?? "Cabang"} · {shared.settings.storePhone}</span>
                <span>{shared.settings.storeAddress}</span>
              </div>
              <div className="struk-meta">
                <div>
                  <span>No. Nota</span>
                  <b>{trxNo}</b>
                </div>
                <div>
                  <span>Tanggal</span>
                  <b>
                    {trxDate}, {trxTime}
                  </b>
                </div>
                <div>
                  <span>Kasir</span>
                  <b>{session?.name ?? "Kasir"}</b>
                </div>
                <div>
                  <span>Pelanggan</span>
                  <b>{customerName}</b>
                </div>
              </div>
              <div className="struk-items">
                {items.map((p) => (
                  <div className="struk-line" key={p.id}>
                    <span>
                      {p.name}
                      <small>
                        {p.qty} × {formatIDR(p.price)}
                      </small>
                    </span>
                    <b>{formatIDR(p.qty * p.price)}</b>
                  </div>
                ))}
              </div>
              <div className="struk-totals">
                <div>
                  <span>Subtotal</span>
                  <b>{formatIDR(subtotal)}</b>
                </div>
                <div>
                  <span>Diskon</span>
                  <b>{formatIDR(discount)}</b>
                </div>
                <div className="struk-grand">
                  <span>Total</span>
                  <b>{formatIDR(total)}</b>
                </div>
                {method === "Tunai" ? (
                  <>
                    <div>
                      <span>Tunai (Dibayar)</span>
                      <b>{formatIDR(paid)}</b>
                    </div>
                    <div>
                      <span>Kembalian</span>
                      <b>{formatIDR(change)}</b>
                    </div>
                  </>
                ) : null}
              </div>
              <div className="struk-foot">
                <span>Metode: {method}</span>
                <span>Status: Lunas</span>
                <span>Terima kasih · Barang yang sudah dibeli tidak dapat ditukar</span>
              </div>
            </div>

            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setStrukOpen(false)}>
                Tutup
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} />
                Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
