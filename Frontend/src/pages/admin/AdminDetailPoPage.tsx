import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Glasses, Lock, TriangleAlert } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import type { PoStatus } from "../../data/mock";
import { Avatar, PageHeader, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const FLOW: PoStatus[] = ["Dipesan", "Diproses", "Sudah Datang", "Selesai"];
const NEXT_LABEL: Record<string, string> = {
  Dipesan: "Proses menjadi Diproses",
  Diproses: "Tandai Sudah Datang",
};

export default function AdminDetailPoPage() {
  const { id } = useParams();
  const store = useSharedStore();
  const [note, setNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const order = store.pos.find((o) => o.id === id);
  if (!order) {
    return (
      <div className="page">
        <PageHeader
          crumbs={
            <>
              <Link to="/admin/dashboard">Admin</Link> › <Link to="/admin/pemesanan">Pemesanan (PO)</Link> › <b>Detail PO</b>
            </>
          }
          overline="OPERASIONAL — DETAIL PO"
          title="PO Tidak Ditemukan"
          desc={`Nomor PO "${id ?? "-"}" tidak ada. Periksa kembali daftar pemesanan.`}
          actions={
            <Link className="btn btn-ghost" to="/admin/pemesanan">
              <ArrowLeft size={16} />
              Daftar PO
            </Link>
          }
        />
        <div className="notice" role="alert">
          <TriangleAlert size={16} />
          PO tidak ditemukan.
        </div>
      </div>
    );
  }
  const current = Math.max(0, FLOW.indexOf(order.status));
  const cancelled = order.status === "Dibatalkan";
  const next: PoStatus | null =
    order.status === "Dipesan" ? "Diproses" : order.status === "Diproses" ? "Sudah Datang" : null;
  const canCancel = order.status === "Dipesan" || order.status === "Diproses";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!next) return;
    const defaultNote = next === "Sudah Datang" ? "Barang tersedia di cabang" : "Produk disiapkan";
    const r = store.transitionPO(order.id, next, note.trim() || defaultNote, DEMO_ADMIN.name);
    setResult(r);
    if (r.ok) setNote("");
  };

  const doCancel = (e: FormEvent) => {
    e.preventDefault();
    const r = store.cancelPO(order.id, cancelReason, DEMO_ADMIN.name);
    setResult(r);
    if (r.ok) setCancelReason("");
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/admin/dashboard">Admin</Link> › <Link to="/admin/pemesanan">Pemesanan (PO)</Link> › <b>Detail PO</b>
          </>
        }
        overline="OPERASIONAL — DETAIL PO"
        title="Detail Pemesanan"
        desc="Periksa frame/lensa dan snapshot resep. Aksi status tercatat beserta aktor dan waktu serta tersinkron ke Kasir."
        actions={
          <Link className="btn btn-ghost" to="/admin/pemesanan">
            <ArrowLeft size={16} />
            Daftar PO
          </Link>
        }
      />

      {result ? (
        <div className={result.ok ? "notice notice-ok" : "notice"} role="status">
          {result.ok ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
          {result.msg}
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
        </div>
      </div>

      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="section-head">
          <div>
            <h2>Progres Pemesanan</h2>
            <div className="section-desc">Timeline beserta aktor — tersimpan lintas reload &amp; tersinkron ke Kasir</div>
          </div>
        </div>
        <div className="progress" style={{ opacity: cancelled ? 0.45 : 1 }}>
          {FLOW.map((step, i) => {
            const done = i < current || order.status === "Selesai";
            return (
              <div key={step} className={`pnode ${done ? "done" : ""} ${i === current && order.status !== "Selesai" ? "current" : ""}`}>
                <span className="pdot">{done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                <b>{step}</b>
                <span>
                  {order.timeline.find((t) => t.to === step)?.at ?? (i === current ? order.createdAt : "—")}
                </span>
              </div>
            );
          })}
        </div>
        {cancelled ? (
          <div className="notice" role="status">
            <TriangleAlert size={16} />
            <span>
              PO dibatalkan — alur proses dihentikan.
              {order.timeline.find((t) => t.to === "Dibatalkan")?.note
                ? ` Alasan: ${order.timeline.find((t) => t.to === "Dibatalkan")?.note}`
                : ""}
            </span>
          </div>
        ) : null}
        <div className="todo-list">
          {order.timeline.map((t, i) => (
            <div key={i} className="todo-row">
              <div className="todo-body">
                <b>
                  {t.from} → {t.to}
                </b>
                <span>
                  {t.at} · {t.actor}
                  {t.note ? ` · ${t.note}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="co-card">
          <div className="section-head">
            <h2>Data Pelanggan</h2>
            <div className="section-action">
              <span className="tag-mini">Read-only</span>
            </div>
          </div>
          <div className="cust-card">
            <Avatar initials={order.initials} size={46} />
            <div className="cc-body">
              <b>{order.customer}</b>
              <div className="cc-meta">
                <span>{order.phone}</span>
              </div>
            </div>
          </div>

          <div className="section-head" style={{ marginTop: 4 }}>
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
              <b style={{ fontSize: 13.5 }}>×{it.qty}</b>
            </div>
          ))}
          {order.total ? (
            <div className="simple-total-bar" style={{ marginTop: 12 }}>
              <span>Total Estimasi Pesanan</span>
              <b>{formatIDR(order.total)}</b>
            </div>
          ) : null}

          <div className="section-head" style={{ marginTop: 4 }}>
            <h2>Snapshot Resep (OD/OS)</h2>
            <div className="section-action">
              <span className="tag-mini">
                <Lock size={11} style={{ display: "inline", verticalAlign: -1 }} /> Terkunci
              </span>
            </div>
          </div>
          {order.resepSnapshot ? (
            <>
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>MATA</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                    <th>ADD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OD (Kanan)</td>
                    <td>{order.resepSnapshot.od.sph}</td>
                    <td>{order.resepSnapshot.od.cyl}</td>
                    <td>{order.resepSnapshot.od.axis}</td>
                    <td>{order.resepSnapshot.add}</td>
                  </tr>
                  <tr>
                    <td>OS (Kiri)</td>
                    <td>{order.resepSnapshot.os.sph}</td>
                    <td>{order.resepSnapshot.os.cyl}</td>
                    <td>{order.resepSnapshot.os.axis}</td>
                    <td>{order.resepSnapshot.add}</td>
                  </tr>
                </tbody>
              </table>
              <div className="tt-sub" style={{ fontWeight: 600 }}>
                Disalin saat PO dibuat ({order.resepSnapshot.at}) — tidak berubah bila arsip resep pelanggan direvisi.
              </div>
            </>
          ) : (
            <div className="empty-note">PO ini tidak menyertakan resep.</div>
          )}
        </section>

        <section className="co-card">
          <div className="section-head">
            <h2>Aksi Status</h2>
          </div>
          {next ? (
            <>
              <form onSubmit={submit} className="drawer-form" noValidate>
                <div className="tt-sub" style={{ fontWeight: 600, marginTop: 0 }}>
                  Status saat ini: <b style={{ color: "var(--ink)" }}>{order.status}</b> → <b style={{ color: "var(--accent)" }}>{next}</b>
                </div>
                <label className="afield">
                  <span>Catatan proses (opsional)</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      next === "Sudah Datang"
                        ? "cth. barang sudah diterima di cabang"
                        : "cth. lensa selesai dipotong"
                    }
                  />
                </label>
                <button type="submit" className="btn btn-primary full">
                  {NEXT_LABEL[order.status]}
                  <ArrowRight size={16} />
                </button>
              </form>

              {canCancel ? (
                <>
                  <div className="section-head" style={{ marginTop: 8 }}>
                    <h2>Batalkan PO</h2>
                  </div>
                  <form onSubmit={doCancel} className="drawer-form" noValidate>
                    <div className="tt-sub" style={{ fontWeight: 600, marginTop: 0 }}>
                      Hanya bisa sebelum barang datang. Alasan tercatat di timeline &amp; audit.
                    </div>
                    <label className="afield">
                      <span>Alasan pembatalan (wajib)</span>
                      <input
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="cth. pelanggan membatalkan pesanan"
                      />
                    </label>
                    <button type="submit" className="btn btn-danger full" disabled={cancelReason.trim().length < 3}>
                      Batalkan PO
                    </button>
                  </form>
                </>
              ) : null}
            </>
          ) : (
            <div className={order.status === "Selesai" ? "notice notice-ok" : "notice"}>
              {order.status === "Selesai" ? <CheckCircle2 size={16} /> : <Lock size={16} />}
              {order.status === "Selesai"
                ? `PO selesai melalui transaksi pengambilan${order.linkedTrx ? ` ${order.linkedTrx}` : ""}.`
                : order.status === "Dibatalkan"
                  ? "PO sudah dibatalkan. Tidak ada aksi lanjutan."
                  : "Barang sudah datang dan siap diambil. PO diselesaikan oleh Kasir melalui transaksi pengambilan."}
            </div>
          )}
          <div className="section-head" style={{ marginTop: 8 }}>
            <h2>Catatan Pesanan</h2>
          </div>
          <div>
            <div className="note-line">
              <i />
              {order.note}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
