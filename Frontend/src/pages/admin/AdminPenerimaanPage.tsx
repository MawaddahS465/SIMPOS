import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, PackageCheck, TriangleAlert, Truck, X } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminPenerimaanPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima">("Semua");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ distId: string; productId: string; qty: number } | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const dists = useMemo(
    () =>
      store.distributions
        .filter((d) => (filter === "Semua" ? true : d.status === filter))
        .filter((d) => {
          const hay = `${d.id} ${d.from} ${d.lines
            .map((l) => {
              const p = store.productOf(l.productId);
              return `${p?.code ?? ""} ${p?.name ?? ""}`;
            })
            .join(" ")}`.toLowerCase();
          return hay.includes(q.toLowerCase());
        }),
    [store, q, filter],
  );

  const menungguCount = store.distributions.filter((d) => d.status === "Menunggu Diterima").length;
  const sebagianCount = store.distributions.filter((d) => d.status === "Diterima Sebagian").length;
  const selesaiCount = store.distributions.filter((d) => d.status === "Diterima").length;

  const openConfirm = (distId: string, productId: string, sisa: number) => {
    const raw = (qty[`${distId}::${productId}`] ?? String(sisa)).trim();
    const v = /^[0-9]+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isInteger(v) || v <= 0) {
      setResult({ ok: false, msg: "Isi jumlah diterima aktual (bilangan bulat > 0, tanpa titik/koma/minus) dahulu." });
      return;
    }
    setResult(null);
    setConfirmError("");
    setConfirm({ distId, productId, qty: v });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!confirm) return;
    const r = store.confirmReceipt(confirm.distId, confirm.productId, confirm.qty, "");
    setResult(r);
    if (r.ok) {
      setQty((prev) => {
        const next = { ...prev };
        delete next[`${confirm.distId}::${confirm.productId}`];
        return next;
      });
      setConfirm(null);
      setConfirmError("");
    } else {
      setConfirmError(r.msg);
    }
  };

  const cProduct = confirm ? store.productOf(confirm.productId) : undefined;
  const cStock = confirm ? store.stockOf(confirm.productId) : undefined;

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — PENERIMAAN"
        title="Penerimaan Barang"
        desc={`Verifikasi dan catat barang pengiriman dari pusat yang diterima di ${DEMO_ADMIN.branch}.`}
      />

      <div className="stat-row">
        <StatCard
          label="Menunggu Diterima"
          value={String(menungguCount)}
          caption="Kiriman baru dari pusat"
          icon={<Truck size={22} />}
          tone="amber"
        />
        <StatCard
          label="Diterima Sebagian"
          value={String(sebagianCount)}
          caption="Masih ada sisa item belum masuk"
          icon={<Clock size={22} />}
          tone="violet"
        />
        <StatCard
          label="Selesai Diterima"
          value={String(selesaiCount)}
          caption="Seluruh alokasi telah diverifikasi"
          icon={<PackageCheck size={22} />}
          tone="green"
        />
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Cari ID distribusi, kode, atau nama produk..." value={q} onChange={setQ} />
        <select
          className="select-pill"
          aria-label="Filter Status Penerimaan"
          value={filter}
          onChange={(e) => setFilter(e.target.value as "Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima")}
        >
          <option value="Semua">Semua Status</option>
          <option value="Menunggu Diterima">Menunggu Diterima</option>
          <option value="Diterima Sebagian">Diterima Sebagian</option>
          <option value="Diterima">Diterima</option>
        </select>
      </div>

      {result ? (
        <div className={result.ok ? "notice notice-ok" : "notice"} role="status">
          {result.ok ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
          {result.msg}
        </div>
      ) : null}

      {dists.map((d) => {
        const totalAlokasi = d.lines.reduce((a, l) => a + l.qtyAlokasi, 0);
        const totalDiterima = d.lines.reduce((a, l) => a + l.qtyDiterima, 0);
        return (
        <section key={d.id} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-head">
            <div>
              <h2>
                {d.id} <span className="tt-sub" style={{ display: "inline" }}>· {d.date} · dari {d.from}</span>
              </h2>
              <div className="section-desc">
                {d.lines.length} produk · dikirim {totalAlokasi} unit · diterima {totalDiterima} unit
              </div>
            </div>
            <div className="section-action">
              <StatusPill label={d.status} />
            </div>
          </div>
          {d.lines.map((l) => {
            const p = store.productOf(l.productId);
            const s = store.stockOf(l.productId);
            const sisa = l.qtyAlokasi - l.qtyDiterima;
            const key = `${d.id}::${l.productId}`;
            const done = sisa <= 0;
            const inputVal = qty[key] ?? String(sisa);
            return (
              <div key={key} className="recv-line">
                <div className="recv-body">
                  <b>{p?.name}</b>
                  <span>
                    {p?.code} · {p?.type} · stok cabang: {s?.saldo ?? 0} unit
                  </span>
                </div>
                <div className="recv-alloc">
                  <span>Dikirim Pusat</span>
                  <b>{l.qtyAlokasi}</b>
                </div>
                <div className="recv-alloc">
                  <span>Sudah Diterima</span>
                  <b>{l.qtyDiterima}</b>
                </div>
                {done ? (
                  <StatusPill label="Diterima" dot={false} />
                ) : (
                  <span className="recv-input">
                    <input
                      inputMode="numeric"
                      aria-label={`Jumlah diterima ${p?.name}`}
                      title={`Maksimal ${sisa} unit`}
                      placeholder={`maks ${sisa}`}
                      value={inputVal}
                      onChange={(e) => setQty((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => openConfirm(d.id, l.productId, sisa)}>
                      <PackageCheck size={15} />
                      Konfirmasi
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </section>
        );
      })}
      {dists.length === 0 ? <div className="panel empty-note">Tidak ada distribusi yang cocok.</div> : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Riwayat Konfirmasi</h2>
            <div className="section-desc">Daftar penerimaan barang dari pusat yang telah dikonfirmasi</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>ID / WAKTU</th>
                <th>DISTRIBUSI</th>
                <th>PRODUK</th>
                <th className="tt-right">QTY</th>
                <th>AKTOR</th>
              </tr>
            </thead>
            <tbody>
              {store.receipts.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="tt-num">{r.id}</div>
                    <div className="tt-sub">{r.at}</div>
                  </td>
                  <td>{r.distributionId}</td>
                  <td>{store.productOf(r.productId)?.name}</td>
                  <td className="tt-right tt-money">+{r.qty}</td>
                  <td>{r.actor}</td>
                </tr>
              ))}
              {store.receipts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-note">
                      Belum ada penerimaan tercatat. Konfirmasi dari daftar di atas — hasilnya tampil di sini dan
                      di <Link className="link-action" to="/admin/mutasi">Riwayat Mutasi</Link>.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {confirm && cProduct && cStock ? (
        <div className="overlay" onClick={() => setConfirm(null)}>
          <div className="confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head" style={{ padding: 0 }}>
              <h2>Konfirmasi Penerimaan</h2>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="detail-rows">
              <div className="detail-row">
                <span>Produk</span>
                <b>{cProduct.name}</b>
              </div>
              <div className="detail-row">
                <span>Stok sebelum</span>
                <b>{cStock.saldo}</b>
              </div>
              <div className="detail-row">
                <span>Qty diterima</span>
                <b>+{confirm.qty}</b>
              </div>
              <div className="detail-row">
                <span>Stok sesudah</span>
                <b>{cStock.saldo + confirm.qty}</b>
              </div>
            </div>
            <form onSubmit={submit}>
              {confirmError ? (
                <div className="form-error" role="alert">
                  {confirmError}
                </div>
              ) : null}
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Ya, Catat Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
