import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ClipboardCheck, Glasses, ShoppingBag, TriangleAlert } from "lucide-react";
import { type PoStatus } from "../data/mock";
import { useCart } from "../context/CartContext";
import { ApiError, kasirApi } from "../lib/api";
import { mapApiPo, type KasirPo } from "../lib/po";
import { Avatar, PageHeader, StatusPill, formatIDR } from "../components/ui";
import type { Customer } from "../data/customers";
import "../styles/pages.css";
import "../styles/admin.css";

const FLOW: PoStatus[] = ["Dipesan", "Diproses", "Sudah Datang", "Selesai"];
const FLOW_DESC: Record<PoStatus, string> = {
  Dipesan: "Menunggu diproses Admin Cabang",
  Diproses: "Sedang disiapkan Admin Cabang",
  "Sudah Datang": "Barang tersedia & siap diambil pelanggan",
  Selesai: "Pesanan selesai & telah diambil pelanggan",
  Dibatalkan: "Dibatalkan oleh Admin Cabang",
};

export default function DetailPoPage() {
  const { id } = useParams();
  const cart = useCart();
  const navigate = useNavigate();
  const [pickError, setPickError] = useState<string | null>(null);
  const [order, setOrder] = useState<KasirPo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const orderId = Number(id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      setLoadError("Nomor PO tidak valid.");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    kasirApi.order(orderId)
      .then((result) => {
        if (active) setOrder(mapApiPo(result.order, result.items, result.timeline));
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof ApiError ? error.message : "Detail PO gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="page"><div className="empty-note">Memuat detail PO...</div></div>;
  }

  if (!order) {
    return (
      <div className="page">
        <PageHeader
          crumbs={
            <>
              <Link to="/dashboard">Kasir</Link> › <Link to="/pemesanan">Pemesanan (PO)</Link> › <b>Detail PO</b>
            </>
          }
          overline="DETAIL PEMESANAN"
          title="PO Tidak Ditemukan"
          actions={
            <Link className="btn btn-ghost" to="/pemesanan">
              <ArrowLeft size={16} />
              Daftar PO
            </Link>
          }
        />
        <div className="notice" role="alert">
          <TriangleAlert size={16} />
          {loadError || "PO tidak ditemukan atau sudah tidak tersedia."}
        </div>
      </div>
    );
  }

  const current = Math.max(0, FLOW.indexOf(order.status));
  const cancelled = order.status === "Dibatalkan";
  const resep = order.resepSnapshot;
  const linkedTrx = order.linkedTrx;
  const canPickup = order.status === "Sudah Datang" && !order.linkedTrx;

  const pickup = () => {
    if (order.items.length === 0 || !order.customerId) {
      setPickError("Data produk atau pelanggan pada PO tidak lengkap. Hubungi Admin Cabang.");
      return;
    }
    const customer: Customer = {
      id: String(order.customerId),
      code: `PLG-${String(order.customerId).padStart(4, "0")}`,
      name: order.customer,
      initials: order.initials,
      phone: order.phone,
      email: "",
      hasResep: Boolean(order.resep),
      poActive: 0,
      branch: "Cabang",
    };
    cart.clear();
    cart.setCustomer(customer);
    for (const item of order.items) {
      const productId = item.productId ?? "";
      cart.add({
        id: productId,
        name: item.name,
        brand: item.sub.split(" · ").slice(-1)[0] ?? "-",
        category: item.sub.split(" · ")[0] ?? "Frame",
        price: item.price ?? 0,
      });
      if (item.qty > 1) cart.setQty(productId, item.qty);
    }
    cart.setPoId(order.id);
    navigate("/checkout?step=confirm");
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/dashboard">Kasir</Link> › <Link to="/pemesanan">Pemesanan (PO)</Link> › <b>Detail PO</b>
          </>
        }
        overline="DETAIL PEMESANAN"
        title="Detail Pemesanan"
        actions={
          <>
            <Link className="btn btn-ghost" to="/pemesanan">
              <ArrowLeft size={16} />
              Daftar PO
            </Link>
            {canPickup ? (
              <button type="button" className="btn btn-primary" onClick={pickup}>
                <ShoppingBag size={16} />
                Proses Pengambilan
              </button>
            ) : null}
          </>
        }
      />

      {pickError ? (
        <div className="notice" role="alert">
          <TriangleAlert size={16} />
          {pickError}
        </div>
      ) : null}

      {canPickup ? (
        <div className="notice notice-ok" role="status">
          <ClipboardCheck size={16} />
          Barang sudah datang. Proses pengambilan akan membuka checkout dengan produk PO dan pelanggan terisi otomatis.
        </div>
      ) : null}

      {linkedTrx ? (
        <div className="notice notice-ok" role="status">
          <Check size={16} />
          PO ini diselesaikan oleh transaksi <b>{linkedTrx}</b>.
          <Link className="link-action" to="/riwayat-transaksi">
            Lihat riwayat
          </Link>
        </div>
      ) : null}

      <div className="po-status-card">
        <div>
          <div className="po-mini-label">NOMOR PEMESANAN</div>
          <div className="po-big-no">{order.number}</div>
          <div className="po-created">Dibuat {order.createdAt}</div>
        </div>
        <div className="po-status-right">
          <div className="po-mini-label">STATUS PESANAN</div>
          <StatusPill label={order.status} />
          <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>
            {FLOW_DESC[order.status]}
          </span>
        </div>
      </div>

      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="section-head">
          <div>
            <h2>Progres Pemesanan</h2>
            <div className="section-desc">Status diperbarui oleh Admin Cabang secara real-time</div>
          </div>
        </div>
        <div className="progress" style={{ opacity: cancelled ? 0.45 : 1 }}>
          {FLOW.map((step, i) => {
            const done = i < current || order.status === "Selesai";
            const stepLog = order.timeline.find((t) => t.to === step);
            return (
              <div
                key={step}
                className={`pnode ${done ? "done" : ""} ${i === current && order.status !== "Selesai" ? "current" : ""}`}
              >
                <span className="pdot">{done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                <b>{step}</b>
                <span>{stepLog?.at ?? (i === current ? order.createdAt : FLOW_DESC[step])}</span>
              </div>
            );
          })}
        </div>
        {cancelled ? (
          <div className="notice" role="status">
            PO ini dibatalkan oleh Admin Cabang.
            {order.timeline.find((t) => t.to === "Dibatalkan")?.note
              ? ` Alasan: ${order.timeline.find((t) => t.to === "Dibatalkan")?.note}`
              : ""}
          </div>
        ) : null}
      </section>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="co-card">
            <div className="section-head">
              <h2>Data Pelanggan</h2>
            </div>
            <div className="cust-card">
              <Avatar initials={order.initials} size={46} />
              <div className="cc-body">
                <b>{order.customer}</b>
                <div className="cc-meta">
                  <span>PLG-{String(order.customerId).padStart(4, "0")}</span>
                  <span>{order.phone}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="co-card">
            <div className="section-head">
              <h2>Produk yang Dipesan</h2>
              <div className="section-action">
                <span className="tag-mini">{order.items.length} item</span>
              </div>
            </div>
            {order.items.map((it) => (
              <div key={it.name} className="cart-line">
                <span className="cl-ico">
                  <Glasses size={20} strokeWidth={1.7} />
                </span>
                <span className="cl-body">
                  <b>{it.name}</b>
                  <span>{it.sub}</span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <b style={{ fontSize: 13.5 }}>×{it.qty}</b>
                  {it.price != null ? (
                    <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>
                      {formatIDR(it.price * it.qty)}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
            {order.total ? (
              <div className="simple-total-bar" style={{ marginTop: 12 }}>
                <span>Total Estimasi Pesanan</span>
                <b>{formatIDR(order.total)}</b>
              </div>
            ) : null}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="co-card">
            <div className="section-head">
              <h2>Resep Mata (Snapshot PO)</h2>
            </div>
            {resep ? (
              <>
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>MATA</th>
                      <th>SPH</th>
                      <th>CYL</th>
                      <th>AXIS</th>
                      <th>ADD</th>
                      <th>PD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>OD (Kanan)</td>
                      <td>{resep.od.sph}</td>
                      <td>{resep.od.cyl}</td>
                      <td>{resep.od.axis}</td>
                      <td>{resep.add ?? "-"}</td>
                      <td>{resep.pd}</td>
                    </tr>
                    <tr>
                      <td>OS (Kiri)</td>
                      <td>{resep.os.sph}</td>
                      <td>{resep.os.cyl}</td>
                      <td>{resep.os.axis}</td>
                      <td>{resep.add ?? "-"}</td>
                      <td>{resep.pd}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="tt-sub" style={{ fontWeight: 600 }}>
                  Ukuran lensa tersimpan pada detail PO ini ({resep.at}).
                </div>
              </>
            ) : (
              <div className="empty-note">PO ini tidak menyertakan resep mata.</div>
            )}
          </section>

          <section className="co-card">
            <div className="section-head">
              <h2>Catatan Pesanan</h2>
            </div>
            <div>
              <div className="note-line">
                <i />
                {order.note}
              </div>
              <div className="note-line">
                <i />
                Hubungi pelanggan ({order.phone}) saat pesanan berstatus Sudah Datang.
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="tt-sub" style={{ padding: "0 6px", fontWeight: 600 }}>
        Kasir mencatat pemesanan dan memantau status PO. Pemrosesan dan pembaruan status PO ditangani oleh Admin Cabang.
      </div>
    </div>
  );
}
