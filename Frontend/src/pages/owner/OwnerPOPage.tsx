import { useMemo, useState } from "react";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import { useSharedStore } from "../../store/sharedStore";
import { inPeriod, periodRange, type PeriodKey } from "../../store/reports";
import type { PoStatus } from "../../data/mock";
import { Avatar, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const PAGE = 10;
const PERIODS: PeriodKey[] = ["semua", "hari", "mingguan", "bulanan", "tahunan", "custom"];
const PERIOD_LABEL: Record<PeriodKey, string> = {
  semua: "Semua waktu", hari: "Hari ini", mingguan: "Minggu ini", bulanan: "Bulan ini", tahunan: "Tahun ini", custom: "Rentang",
};
const STATUSES: PoStatus[] = ["Dipesan", "Diproses", "Sudah Datang", "Selesai"];
const FILTER_STATUSES: PoStatus[] = [...STATUSES, "Dibatalkan"];

export default function OwnerPOPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [period, setPeriod] = useState<PeriodKey>("semua");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [status, setStatus] = useState<"all" | PoStatus>("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const range = periodRange(period, cFrom, cTo);

  const rows = useMemo(
    () =>
      store.pos
        .filter((o) => (branch === "all" ? true : o.branchId === branch))
        .filter((o) => inPeriod(o.createdAt, range.from, range.to))
        .filter((o) => (status === "all" ? true : o.status === status))
        .filter((o) => `${o.number} ${o.customer}`.toLowerCase().includes(q.toLowerCase())),
    [store.pos, branch, range.from, range.to, status, q],
  );

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  const detail = detailId ? store.pos.find((o) => o.id === detailId) : undefined;
  const resetPage = () => setPage(1);

  return (
    <div className="page">
      <PageHeader
        overline="PENGAWASAN — PEMESANAN"
        title="Monitoring PO"
        desc="Seluruh PO dari Kasir di semua cabang. Perubahan status oleh Admin tampil otomatis."
      />

      <div className="toolbar">
        <SearchBox
          placeholder="Cari nomor PO atau pelanggan..."
          value={q}
          onChange={(v) => { setQ(v); resetPage(); }}
        />
        <select
          className="select-pill"
          aria-label="Periode"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value as PeriodKey);
            resetPage();
          }}
        >
          {PERIODS.map((k) => (
            <option key={k} value={k}>
              {PERIOD_LABEL[k]}
            </option>
          ))}
        </select>
        <select className="select-pill" aria-label="Cabang" value={branch} onChange={(e) => { setBranch(e.target.value); resetPage(); }}>
          <option value="all">Semua Cabang</option>
          {store.branches.filter((b) => b.type === "Cabang").map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select className="select-pill" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); resetPage(); }}>
          <option value="all">Semua Status</option>
          {FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {period === "custom" ? (
        <div className="toolbar">
          <label className="afield" style={{ minWidth: 170 }}>
            <span>Dari tanggal</span>
            <input type="date" value={cFrom} onChange={(e) => { setCFrom(e.target.value); resetPage(); }} />
          </label>
          <label className="afield" style={{ minWidth: 170 }}>
            <span>Sampai tanggal</span>
            <input type="date" value={cTo} onChange={(e) => { setCTo(e.target.value); resetPage(); }} />
          </label>
          <span className="tt-sub" style={{ fontWeight: 600 }}>Periode: {range.label}</span>
        </div>
      ) : null}

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <StatCard
          label="Semua PO"
          value={String(rows.length)}
          caption="Seluruh status pada filter ini"
          tone="violet"
        />
        <StatCard
          label="Dalam Proses"
          value={String(rows.filter((o) => o.status === "Dipesan" || o.status === "Diproses" || o.status === "Sudah Datang").length)}
          caption="Dipesan, Diproses, Sudah Datang"
          tone="blue"
        />
        <StatCard
          label="Selesai"
          value={String(rows.filter((o) => o.status === "Selesai").length)}
          caption="Sudah diambil pelanggan"
          tone="green"
        />
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>NO. PO / TANGGAL</th>
              <th>CABANG</th>
              <th>PELANGGAN</th>
              <th>PRODUK</th>
              <th className="tt-center">STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {view.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="tt-num">{o.number}</div>
                  <div className="tt-sub">{o.date}</div>
                </td>
                <td>{store.branches.find((b) => b.id === o.branchId)?.name ?? o.branchId}</td>
                <td>
                  <div className="cell-person">
                    <Avatar initials={o.initials} size={40} />
                    <span><b>{o.customer}</b><span>{o.phone}</span></span>
                  </div>
                </td>
                <td>
                  <div className="tt-num" style={{ fontSize: 13 }}>{o.productLabel}</div>
                  <div className="tt-sub">
                    {o.products.length > 1
                      ? o.products[1]
                      : `${o.items.reduce((a, i) => a + i.qty, 0)} unit`}
                  </div>
                </td>
                <td className="tt-center"><StatusPill label={o.status} /></td>
                <td className="tt-right">
                  <button className="link-action" onClick={() => setDetailId(o.id)}>
                    Detail<ArrowRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {view.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-note">Tidak ada PO pada filter ini.</div></td></tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Halaman {page} dari {pages} · {rows.length} PO</span>
          <div className="foot-actions">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
            <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Berikutnya</button>
          </div>
        </div>
      </div>

      {detail ? (
        <div className="overlay" onClick={() => setDetailId(null)}>
          <div className="drawer" key={detail.id} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{detail.number}</h2>
                <div className="section-desc">PO dikelola Kasir dan Admin cabang.</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setDetailId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="trace-summary-card">
              <div className="trace-summary-top">
                <div>
                  <b>{detail.customer}</b>
                  <span>{detail.createdAt}</span>
                </div>
                <StatusPill label={detail.status} />
              </div>
              <div className="trace-summary-meta">
                <div className="trace-meta-item">
                  <span>Produk</span>
                  <b>{detail.productLabel}</b>
                </div>
                <div className="trace-meta-item">
                  <span>Jumlah</span>
                  <b>{detail.items.reduce((a, i) => a + i.qty, 0)} unit</b>
                </div>
                <div className="trace-meta-item">
                  <span>Cabang</span>
                  <b>{store.branches.find((b) => b.id === detail.branchId)?.name ?? detail.branchId}</b>
                </div>
              </div>
            </div>

            <div className="mini-label">TIMELINE STATUS PO</div>
            <div className="trace-chain">
              {detail.timeline.map((t, i) => {
                const isLast = i === detail.timeline.length - 1;
                return (
                  <div key={i} className={`trace-step ${isLast ? "is-current" : "is-done"}`}>
                    <span className="trace-dot">
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                    <div className="trace-card">
                      <div className="trace-card-body">
                        <div className="trace-card-stage">TAHAP {i + 1}</div>
                        <b>
                          {t.from} → {t.to}
                        </b>
                        <span>
                          {t.at} · {t.actor}
                          {t.note ? ` · ${t.note}` : ""}
                        </span>
                      </div>
                      <StatusPill label={t.to} dot={false} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="notice">
              <Lock size={16} /> Rincian resep pelanggan tidak ditampilkan pada monitoring Pemilik.
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
