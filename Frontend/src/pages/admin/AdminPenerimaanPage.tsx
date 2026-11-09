import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, PackageCheck, TriangleAlert, Truck, X } from "lucide-react";
import { adminStockFlowApi, ApiError, type StockDistribution, type StockReceipt } from "../../lib/api";
import { PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type DistributionFilter = "Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima";

export default function AdminPenerimaanPage() {
  const [distributions, setDistributions] = useState<StockDistribution[]>([]);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DistributionFilter>("Semua");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [confirm, setConfirm] = useState<{ detailId: number; distribution: string; product: string; stock: number; remaining: number; quantity: number; idempotencyKey: string } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminStockFlowApi.distributions();
      setDistributions(data.distributions);
      setReceipts(data.receipts);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Data penerimaan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const rows = useMemo(() => distributions
    .filter((item) => filter === "Semua" || item.status === filter)
    .filter((item) => {
      const text = `${item.kode_alokasi} ${item.nama_pemilik} ${item.items.map((line) => `${line.kode_barang} ${line.nama_barang}`).join(" ")}`;
      return text.toLowerCase().includes(query.trim().toLowerCase());
    }), [distributions, filter, query]);

  const waitingCount = distributions.filter((item) => item.status === "Menunggu Diterima").length;
  const partialCount = distributions.filter((item) => item.status === "Diterima Sebagian").length;
  const completeCount = distributions.filter((item) => item.status === "Diterima").length;

  const openConfirm = (distribution: StockDistribution, line: StockDistribution["items"][number]) => {
    const remaining = line.jumlah_dialokasikan - line.jumlah_diterima;
    const raw = (quantities[line.id_detail_alokasi] ?? String(remaining)).trim();
    const quantity = /^[0-9]+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > remaining) {
      setNotice({ ok: false, message: `Jumlah harus bilangan bulat antara 1 sampai ${remaining}.` });
      return;
    }
    setNotice(null);
    setConfirmError("");
    setConfirm({
      detailId: line.id_detail_alokasi,
      distribution: distribution.kode_alokasi,
      product: line.nama_barang,
      stock: line.stok ?? 0,
      remaining,
      quantity,
      idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!confirm || saving) return;
    setSaving(true);
    setConfirmError("");
    try {
      await adminStockFlowApi.receive(confirm.detailId, confirm.quantity, confirm.idempotencyKey);
      setQuantities((current) => {
        const next = { ...current };
        delete next[confirm.detailId];
        return next;
      });
      setConfirm(null);
      setNotice({ ok: true, message: `Penerimaan ${confirm.quantity} unit ${confirm.product} berhasil dicatat.` });
      await loadData();
    } catch (requestError) {
      setConfirmError(requestError instanceof ApiError ? requestError.message : "Penerimaan gagal dicatat.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader overline="PERSEDIAAN — PENERIMAAN" title="Penerimaan Barang" desc="Verifikasi kiriman alokasi dari Pemilik. Saldo cabang bertambah setelah penerimaan dicatat." />

      <div className="stat-row">
        <StatCard label="Menunggu Diterima" value={String(waitingCount)} caption="Kiriman baru dari pusat" icon={<Truck size={22} />} tone="amber" />
        <StatCard label="Diterima Sebagian" value={String(partialCount)} caption="Masih ada sisa item belum masuk" icon={<Clock size={22} />} tone="violet" />
        <StatCard label="Selesai Diterima" value={String(completeCount)} caption="Seluruh alokasi telah diverifikasi" icon={<PackageCheck size={22} />} tone="green" />
      </div>

      {error ? <div className="notice" role="alert">{error} <button className="btn btn-ghost" onClick={() => void loadData()}>Coba lagi</button></div> : null}
      {notice ? <div className={notice.ok ? "notice notice-ok" : "notice"} role="status">{notice.ok ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}{notice.message}</div> : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari ID alokasi, kode, atau nama produk..." value={query} onChange={setQuery} />
        <select className="select-pill" aria-label="Filter Status Penerimaan" value={filter} onChange={(event) => setFilter(event.target.value as DistributionFilter)}>
          <option value="Semua">Semua Status</option>
          <option value="Menunggu Diterima">Menunggu Diterima</option>
          <option value="Diterima Sebagian">Diterima Sebagian</option>
          <option value="Diterima">Diterima</option>
        </select>
      </div>

      {loading ? <div className="panel empty-note">Memuat distribusi...</div> : null}
      {!loading ? rows.map((distribution) => (
        <section key={distribution.id_alokasi} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-head">
            <div>
              <h2>{distribution.kode_alokasi} <span className="tt-sub" style={{ display: "inline" }}>· {distribution.tanggal} · dari Pemilik</span></h2>
              <div className="section-desc">{distribution.items.length} produk · dikirim {distribution.jumlah_dialokasikan} unit · diterima {distribution.jumlah_diterima} unit · {distribution.nama_pemilik}</div>
            </div>
            <StatusPill label={distribution.status} />
          </div>
          {distribution.items.map((line) => {
            const remaining = line.jumlah_dialokasikan - line.jumlah_diterima;
            return (
              <div key={line.id_detail_alokasi} className="recv-line">
                <div className="recv-body"><b>{line.nama_barang}</b><span>{line.kode_barang} · {line.jenis} · stok cabang: {line.stok ?? 0} unit</span></div>
                <div className="recv-alloc"><span>Dikirim</span><b>{line.jumlah_dialokasikan}</b></div>
                <div className="recv-alloc"><span>Diterima</span><b>{line.jumlah_diterima}</b></div>
                {remaining <= 0 ? <StatusPill label="Diterima" dot={false} /> : (
                  <span className="recv-input">
                    <input
                      inputMode="numeric"
                      aria-label={`Jumlah diterima ${line.nama_barang}`}
                      title={`Maksimal ${remaining} unit`}
                      value={quantities[line.id_detail_alokasi] ?? String(remaining)}
                      onChange={(event) => setQuantities((current) => ({ ...current, [line.id_detail_alokasi]: event.target.value }))}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => openConfirm(distribution, line)}><PackageCheck size={15} />Konfirmasi</button>
                  </span>
                )}
              </div>
            );
          })}
        </section>
      )) : null}
      {!loading && rows.length === 0 ? <div className="panel empty-note">Tidak ada distribusi yang cocok.</div> : null}

      <section className="section-block">
        <div className="section-head"><div><h2>Riwayat Konfirmasi</h2><div className="section-desc">Penerimaan barang yang sudah dicatat</div></div></div>
        <div className="table-wrap">
          <table className="tt">
            <thead><tr><th>ID / WAKTU</th><th>DISTRIBUSI</th><th>PRODUK</th><th className="tt-right">QTY</th><th>AKTOR</th></tr></thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id_penerimaan}>
                  <td><div className="tt-num">RCV-{receipt.id_penerimaan}</div><div className="tt-sub">{receipt.created_at}</div></td>
                  <td>{receipt.kode_alokasi}</td><td>{receipt.nama_barang} · {receipt.kode_barang}</td>
                  <td className="tt-right tt-money">+{receipt.jumlah}</td><td>{receipt.admin_nama}</td>
                </tr>
              ))}
              {receipts.length === 0 ? <tr><td colSpan={5}><div className="empty-note">Belum ada penerimaan tercatat. Setelah dikonfirmasi, catatan juga tampil di <Link className="link-action" to="/admin/mutasi">Riwayat Mutasi</Link>.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {confirm ? (
        <div className="overlay" onClick={() => !saving && setConfirm(null)}>
          <div className="confirm" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head" style={{ padding: 0 }}><h2>Konfirmasi Penerimaan</h2><button className="icon-pill" aria-label="Tutup" onClick={() => setConfirm(null)} disabled={saving}><X size={18} /></button></div>
            <div className="detail-rows">
              <div className="detail-row"><span>Distribusi</span><b>{confirm.distribution}</b></div>
              <div className="detail-row"><span>Produk</span><b>{confirm.product}</b></div>
              <div className="detail-row"><span>Stok sebelum</span><b>{confirm.stock}</b></div>
              <div className="detail-row"><span>Qty diterima</span><b>+{confirm.quantity}</b></div>
              <div className="detail-row"><span>Stok sesudah</span><b>{confirm.stock + confirm.quantity}</b></div>
              <div className="detail-row"><span>Sisa alokasi</span><b>{confirm.remaining - confirm.quantity}</b></div>
            </div>
            <form onSubmit={submit}>
              {confirmError ? <div className="form-error" role="alert">{confirmError}</div> : null}
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={saving}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Ya, Catat Penerimaan"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
