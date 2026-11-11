import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CalendarDays,
  Truck,
} from "lucide-react";
import { useSharedStore, type Branch } from "../../store/sharedStore";
import { requestState, requestStateLabel } from "../../store/requestStatus";
import { PageHeader, StatusPill, formatIDR } from "../../components/ui";
import SalesBarChart from "../../components/SalesBarChart";
import "../../styles/pages.css";
import "../../styles/admin.css";

export type Scope = "all" | string;

export function scopeLabel(s: Scope, branches: Branch[]) {
  return s === "all" ? "Semua Lokasi" : branches.find((b) => b.id === s)?.name ?? s;
}

export function useOwnerScope(scope: Scope) {
  const store = useSharedStore();
  return useMemo(() => {
    const inScope = (branchId?: string) => scope === "all" || branchId === scope;
    const pusatOnly = scope === "pusat";
    const tx = store.transactions.filter((t) => t.status === "Selesai" && inScope(t.branchId ?? "cabang-padang"));
    const poActive = store.pos.filter((o) => (o.status === "Dipesan" || o.status === "Diproses") && (pusatOnly ? false : inScope(o.branchId)));
    const reqs = store.requests.filter((r) => (pusatOnly ? false : inScope(r.branchId)));
    const rows = store.branches
      .flatMap((b) => store.stockForBranch(b.id).map((s) => ({ ...s, loc: b.id })))
      .filter((s) => inScope(s.loc));
    const low = rows.filter((s) => {
      const p = store.productOf(s.productId);
      return p && p.status === "Aktif" && p.type !== "Aksesoris" && s.saldo <= s.minimum;
    });
    return { tx, poActive, reqs, rows, low };
  }, [store, scope]);
}

/* Tanggal transaksi disimpan sebagai "24 Okt 2026" (id-ID), jadi diparse manual. */
const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
  Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

function parseTrxDate(s: string): Date | null {
  const [d, m, y] = s.trim().split(/\s+/);
  const day = Number(d);
  const month = MONTH_IDX[m];
  const year = Number(y);
  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null;
  return new Date(year, month, day);
}

type PeriodKey = "30" | "90" | "180" | "all";

const PERIOD_META: Record<PeriodKey, { label: string; period: string; previous: string | null }> = {
  "30": { label: "30 hari", period: "30 hari terakhir", previous: "30 hari sebelumnya" },
  "90": { label: "90 hari", period: "90 hari terakhir", previous: "90 hari sebelumnya" },
  "180": { label: "180 hari", period: "180 hari terakhir", previous: "180 hari sebelumnya" },
  all: { label: "Semua", period: "semua waktu", previous: null },
};

const PERIOD_OPTIONS: PeriodKey[] = ["30", "90", "180", "all"];

type PeriodRange = {
  from: Date | null;
  to: Date | null;
  previousFrom: Date | null;
  previousTo: Date | null;
};

function buildRange(period: PeriodKey): PeriodRange {
  if (period === "all") {
    return { from: null, to: null, previousFrom: null, previousTo: null };
  }
  const days = Number(period);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - days + 1);
  previousFrom.setHours(0, 0, 0, 0);
  return { from, to, previousFrom, previousTo };
}

function inWindow(at: Date, from: Date | null, to: Date | null) {
  return from !== null && to !== null && at >= from && at <= to;
}

function DeltaBadge({
  current,
  previous,
  hasComparison,
}: {
  current: number;
  previous: number;
  hasComparison: boolean;
}) {
  if (!hasComparison) return null;
  if (previous <= 0) {
    return (
      <span className={`dash-delta ${current > 0 ? "is-new" : "is-flat"}`}>
        {current > 0 ? "Baru" : "0%"}
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const tone = pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat";
  const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : null;
  return (
    <span className={`dash-delta is-${tone}`}>
      {Icon ? <Icon size={12} /> : null}
      {pct > 0 ? "+" : ""}
      {pct.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
    </span>
  );
}

export default function OwnerDashboardPage() {
  const store = useSharedStore();
  const [scope, setScope] = useState<Scope>("all");
  const [period, setPeriod] = useState<PeriodKey>("90");
  const { tx, poActive, reqs, rows } = useOwnerScope(scope);
  const totalStockUnits = rows.reduce((a, s) => a + s.saldo, 0);
  const activeSkuCount = new Set(rows.map((s) => s.productId)).size;

  const range = useMemo(() => buildRange(period), [period]);
  const hasComparison = period !== "all";
  const meta = PERIOD_META[period];

  const periodTx = useMemo(
    () =>
      tx.filter((t) => {
        if (period === "all") return true;
        const at = parseTrxDate(t.date);
        return at ? inWindow(at, range.from, range.to) : false;
      }),
    [tx, period, range],
  );

  const previousTx = useMemo(
    () =>
      hasComparison
        ? tx.filter((t) => {
            const at = parseTrxDate(t.date);
            return at ? inWindow(at, range.previousFrom, range.previousTo) : false;
          })
        : [],
    [tx, hasComparison, range],
  );

  const total = periodTx.reduce((a, t) => a + t.total, 0);
  const previousTotal = previousTx.reduce((a, t) => a + t.total, 0);
  const count = periodTx.length;
  const average = count > 0 ? Math.round(total / count) : 0;

  const requestRows = useMemo(
    () =>
      reqs
        .map((r) => {
          const allocated = store.allocatedForRequest(r.id, r.productId);
          const received = store.receivedForRequest(r.id, r.productId);
          return {
            r,
            product: store.productOf(r.productId),
            state: requestState(r, r.qty, allocated, received),
          };
        })
        .sort((a, b) => {
          const pa = a.state === "Diajukan" ? 0 : 1;
          const pb = b.state === "Diajukan" ? 0 : 1;
          return pa - pb || b.r.id.localeCompare(a.r.id);
        }),
    [reqs, store],
  );

  const reqsPending = requestRows.filter((row) => row.state === "Diajukan");
  const pendingBranches = new Set(reqsPending.map(({ r }) => r.branchId)).size;

  const activeDists = useMemo(
    () =>
      store.distributions.filter(
        (d) => d.status !== "Diterima" && (scope === "all" || scope === "pusat" || d.branchId === scope),
      ),
    [store.distributions, scope],
  );
  const transitUnits = useMemo(
    () =>
      activeDists.reduce(
        (sum, d) => sum + d.lines.reduce((a, l) => a + Math.max(0, l.qtyAlokasi - l.qtyDiterima), 0),
        0,
      ),
    [activeDists],
  );

  const cabangRows = useMemo(
    () =>
      store.branches
        .filter((b) => scope === "all" || b.id === scope)
        .map((b) => {
          const bTx = periodTx.filter((t) => (t.branchId ?? "cabang-padang") === b.id);
          const revenue = bTx.reduce((a, t) => a + t.total, 0);
          const bPo = poActive.filter((o) => o.branchId === b.id).length;
          const units = store.stockForBranch(b.id).reduce((a, s) => a + s.saldo, 0);
          return {
            b,
            units,
            sales: bTx.length,
            revenue,
            po: bPo,
            share: total > 0 ? revenue / total : 0,
          };
        })
        .sort((a, b) => (a.b.type === "Cabang" ? -1 : 1) - (b.b.type === "Cabang" ? -1 : 1) || b.revenue - a.revenue),
    [store, scope, periodTx, poActive, total],
  );

  /* Produk terlaris pada periode terpilih, dihitung dari baris produk transaksi selesai. */
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; brand: string; qty: number; revenue: number }>();
    for (const t of periodTx) {
      for (const p of t.products ?? []) {
        const key = `${p.name}::${p.brand}`;
        const cur = map.get(key) ?? { name: p.name, brand: p.brand, qty: 0, revenue: 0 };
        cur.qty += p.qty;
        cur.revenue += p.qty * p.price;
        map.set(key, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 5);
  }, [periodTx]);
  const topMax = Math.max(1, ...topProducts.map((p) => p.qty));

  const chart = useMemo(() => {
    const groupByDate = (rows: typeof periodTx) => {
      const map = new Map<string, { at: Date; date: string; value: number; count: number }>();
      for (const t of rows) {
        const at = parseTrxDate(t.date);
        if (!at) continue;
        const cur = map.get(t.date) ?? { at, date: t.date, value: 0, count: 0 };
        cur.value += t.total;
        cur.count += 1;
        map.set(t.date, cur);
      }
      return [...map.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
    };

    const current = groupByDate(periodTx);
    const before = groupByDate(previousTx);
    const points = current.map((p) => ({
      key: p.at.toISOString(),
      label: p.at.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      full: p.at.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
      value: p.value,
      count: p.count,
    }));
    /* Periode sebelumnya disejajarkan ke kanan, jadi titik terakhirnya sejajar dengan periode ini. */
    const previous: Array<number | null> = Array(points.length).fill(null);
    const aligned = before.slice(-points.length);
    const offset = points.length - aligned.length;
    aligned.forEach((p, i) => {
      previous[offset + i] = p.value;
    });
    return { points, previous };
  }, [periodTx, previousTx]);

  return (
    <div className="page dashboard-anim">
      <PageHeader
        overline="DASHBOARD PEMILIK"
        title="Dashboard Pemilik"
        actions={
          <div className="dash-toolbar-filters">
            <select
              className="select-pill"
              aria-label="Lokasi"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="all">Semua Lokasi</option>
              {store.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <label className="period-pill-select" title="Pilih periode">
              <CalendarDays size={15} />
              <select
                aria-label="Periode"
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              >
                {PERIOD_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {PERIOD_META[key].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      />

      <div className="dash-kpi-grid">
        <Link to="/owner/transaksi" className="dash-kpi dash-kpi-primary">
          <div className="dash-kpi-head">
            <span className="dash-kpi-label">Omzet Penjualan</span>
            <span className="dash-kpi-icon">
              <Banknote size={18} />
            </span>
          </div>
          <div className="dash-kpi-value">{formatIDR(total)}</div>
          <div className="dash-kpi-sub">
            {count} transaksi selesai · rata-rata {formatIDR(average)}
          </div>
          <div className="dash-kpi-foot">
            <DeltaBadge current={total} previous={previousTotal} hasComparison={hasComparison} />
            <span className="dash-kpi-compare">
              {hasComparison ? `vs ${meta.previous}` : "Semua waktu"}
            </span>
          </div>
        </Link>

        <Link to="/owner/stok" className="dash-kpi">
          <div className="dash-kpi-head">
            <span className="dash-kpi-label">Total Stok Lokasi</span>
            <span className="dash-kpi-icon">
              <Boxes size={18} />
            </span>
          </div>
          <div className="dash-kpi-value">{totalStockUnits} unit</div>
          <div className="dash-kpi-sub">
            {activeSkuCount} produk aktif · {scope === "all" ? `${store.branches.length} lokasi` : scopeLabel(scope, store.branches)}
          </div>
          <div className="dash-kpi-foot">
            <span className="dash-kpi-compare">Lihat rincian stok ›</span>
          </div>
        </Link>

        <Link to="/owner/alokasi" className="dash-kpi">
          <div className="dash-kpi-head">
            <span className="dash-kpi-label">Distribusi Berjalan</span>
            <span className="dash-kpi-icon">
              <Truck size={18} />
            </span>
          </div>
          <div className="dash-kpi-value">{activeDists.length}</div>
          <div className="dash-kpi-sub">
            {activeDists.length > 0
              ? `${transitUnits} unit menunggu diterima cabang`
              : "Seluruh kiriman telah diterima"}
          </div>
          <div className="dash-kpi-foot">
            <span className="dash-kpi-compare">Pantau alokasi distribusi ›</span>
          </div>
        </Link>
      </div>

      <div className="dash-charts">
        <section className="panel sales-chart">
          <div className="section-head">
            <div>
              <h2>Tren Penjualan</h2>
              <div className="section-desc">
                Transaksi selesai per tanggal aktif · {meta.period} · {scopeLabel(scope, store.branches)}
              </div>
            </div>
            {hasComparison ? (
              <div className="chart-legend">
                <span className="lg-item">
                  <i className="lg-bar" />
                  Periode ini
                </span>
                <span className="lg-item">
                  <i className="lg-bar is-prev" />
                  Periode sebelumnya
                </span>
              </div>
            ) : null}
          </div>

          {chart.points.length === 0 ? (
            <div className="empty-note">Belum ada transaksi selesai pada periode ini.</div>
          ) : (
            <SalesBarChart points={chart.points} previous={chart.previous} />
          )}
        </section>

        <section className="panel top-card">
          <div className="section-head">
            <div>
              <h2>Produk Terlaris</h2>
              <div className="section-desc">Transaksi selesai · {meta.period}</div>
            </div>
            <Link className="link-action" to="/owner/laporan">
              Lihat Laporan
              <ArrowRight size={15} />
            </Link>
          </div>
          {topProducts.length > 0 ? (
            <div className="top-list" key={`${scope}-${period}`}>
              {topProducts.map((p, i) => (
                <div className="top-row" key={`${p.name}-${p.brand}`}>
                  <span className="top-rank">{String(i + 1).padStart(2, "0")}</span>
                  <div className="top-main">
                    <div className="top-name" title={p.name}>
                      {p.name}
                    </div>
                    <div className="top-bar">
                      <span style={{ width: `${(p.qty / topMax) * 100}%` }} />
                    </div>
                  </div>
                  <div className="top-qty">
                    <b>{p.qty} unit</b>
                    <span>{formatIDR(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-note">Belum ada penjualan pada periode ini.</div>
          )}
        </section>
      </div>

      <div className="dash-lower">
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Pengajuan Masuk Terbaru</h2>
              <div className="section-desc">Kebutuhan stok dari cabang yang perlu ditinjau</div>
            </div>
            <Link className="link-action" to="/owner/pengajuan">
              Tinjau Semua
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="todo-list">
            {requestRows.slice(0, 5).map(({ r, product, state }) => (
              <div key={r.id} className="todo-row">
                <div className="todo-body">
                  <b>
                    {product?.name} × {r.qty} unit
                  </b>
                  <span>
                    {r.id} · {r.at}
                  </span>
                </div>
                <StatusPill label={requestStateLabel(state)} />
              </div>
            ))}
            {requestRows.length === 0 ? <div className="empty-note">Tidak ada pengajuan pada cakupan ini.</div> : null}
          </div>
        </section>

        <section className="panel dash-side-card">
          <div className="section-head">
            <div>
              <h2>Ringkasan Lokasi</h2>
              <div className="section-desc">Kinerja cabang &amp; ketersediaan stok · {meta.period}</div>
            </div>
            <Link className="link-action" to="/owner/cabang">
              Semua Lokasi
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="dash-branch-list">
            {cabangRows.slice(0, 5).map((row) => (
              <Link className="dash-branch-row" to={`/owner/cabang/${row.b.id}`} key={row.b.id}>
                <div className="dash-branch-line">
                  <span className="dash-branch-name">{row.b.name}</span>
                  <span className="dash-branch-value">
                    {row.b.type === "Pusat" ? `${row.units} unit stok` : formatIDR(row.revenue)}
                  </span>
                </div>
                <div className="dash-branch-bar">
                  <span
                    style={{
                      width: `${
                        row.b.type === "Pusat"
                          ? 100
                          : Math.max(0, Math.min(100, row.share * 100))
                      }%`,
                    }}
                  />
                </div>
                <div className="dash-branch-meta">
                  {row.b.type === "Pusat" ? (
                    <>
                      <span>Gudang distribusi utama</span>
                      <span>{activeDists.length} pengiriman berjalan</span>
                    </>
                  ) : (
                    <>
                      <span>{Math.round(row.share * 100)}% omzet</span>
                      <span>{row.sales} transaksi</span>
                      <span>{row.units} unit stok</span>
                      <span>{row.po} PO aktif</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
            {cabangRows.length === 0 ? <div className="empty-note">Tidak ada lokasi pada cakupan ini.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
