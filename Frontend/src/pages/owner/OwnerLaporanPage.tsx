import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useSharedStore, type ProductType } from "../../store/sharedStore";
import { exportPdf, exportXlsx, inPeriod, periodRange, rp, stamp, type PeriodKey } from "../../store/reports";
import { Chip, PageHeader, SearchBox, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type Kind = "transaksi" | "stok" | "po" | "aktivitas";
const KINDS: Array<{ id: Kind; label: string }> = [
  { id: "transaksi", label: "Transaksi" },
  { id: "stok", label: "Stok" },
  { id: "po", label: "Pemesanan" },
  { id: "aktivitas", label: "Aktivitas Barang" },
];
const PERIODS: PeriodKey[] = ["semua", "hari", "mingguan", "bulanan", "tahunan", "custom"];
const PERIOD_LABEL: Record<PeriodKey, string> = {
  semua: "Semua waktu", hari: "Hari ini", mingguan: "Minggu ini", bulanan: "Bulan ini", tahunan: "Tahun ini", custom: "Rentang",
};
const PAGE = 10;

export default function OwnerLaporanPage() {
  const store = useSharedStore();
  const branchLabel = (id?: string) =>
    store.branches.find((b) => b.id === id)?.name ?? (id === "cabang-padang" ? "Cabang Padang" : id ?? "Cabang Padang");
  const [kind, setKind] = useState<Kind>("transaksi");
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [jenis, setJenis] = useState<"Semua" | ProductType>("Semua");
  const [period, setPeriod] = useState<PeriodKey>("semua");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const range = periodRange(period, cFrom, cTo);
  const resetAll = () => {
    setPage(1);
    setSaved(null);
  };

  const data = useMemo(() => {
    const inB = (b?: string, loc?: string) => {
      const v = b ?? loc ?? "cabang-padang";
      return branch === "all" ? true : v === branch;
    };
    const typeOfName = (name?: string) => store.products.find((p) => p.name === name)?.type;
    const inJenis = (type?: string) => jenis === "Semua" || type === jenis;
    if (kind === "transaksi") {
      const rows = store.transactions
        .filter((t) => inB(t.branchId))
        .filter((t) => jenis === "Semua" || (t.products ?? []).some((p) => typeOfName(p.name) === jenis))
        .filter((t) => inPeriod(`${t.date}${t.time ? `, ${t.time}` : ""}`, range.from, range.to))
        .filter((t) => `${t.no} ${t.customer}`.toLowerCase().includes(q.toLowerCase()));
      const ok = rows.filter((t) => t.status === "Selesai");
      return {
        head: ["No. Transaksi", "Tanggal", "Cabang", "Pelanggan", "Metode", "Status", "Total (Rp)"],
        body: rows.map((t) => [t.no, `${t.date}${t.time ? ` · ${t.time}` : ""}`, branchLabel(t.branchId), t.customer, t.method ?? "—", t.status, t.total]),
        total: ["", "", "", "", "", `${ok.length} sukses`, ok.reduce((a, t) => a + t.total, 0)] as Array<string | number>,
        summary: `${ok.length} sukses · ${formatIDR(ok.reduce((a, t) => a + t.total, 0))}`,
      };
    }
    if (kind === "stok") {
      const rows = store.branches
        .flatMap((b) => store.stockForBranch(b.id).map((s) => ({ ...s, loc: b.id })))
        .map(({ loc: l, ...s }) => ({ l, s, p: store.productOf(s.productId)! }))
        .filter(({ p }) => p && p.status === "Aktif")
        .filter(({ p }) => (jenis === "Semua" ? true : p.type === jenis))
        .filter(({ l }) => (branch === "all" ? true : l === branch))
        .filter(({ p }) => `${p.code} ${p.name}`.toLowerCase().includes(q.toLowerCase()));
      const low = rows.filter(({ s }) => s.saldo <= s.minimum).length;
      return {
        head: ["Lokasi", "Kode", "Produk", "Jenis", "Stok", "Minimum", "Status"],
        body: rows.map(({ l, s, p }) => [branchLabel(l), p.code, p.name, p.type, s.saldo, s.minimum, s.saldo <= s.minimum ? "Menipis" : "Aman"]),
        total: ["", "", "", "", rows.reduce((a, { s }) => a + s.saldo, 0), "", `${low} menipis`] as Array<string | number>,
        summary: `${rows.length} baris · ${low} menipis`,
      };
    }
    if (kind === "po") {
      const rows = store.pos
        .filter((o) => inB(o.branchId))
        .filter((o) => inJenis(typeOfName(o.productLabel)))
        .filter((o) => inPeriod(o.createdAt, range.from, range.to))
        .filter((o) => `${o.number} ${o.customer}`.toLowerCase().includes(q.toLowerCase()));
      return {
        head: ["No. PO", "Tanggal", "Cabang", "Pelanggan", "Produk", "Status"],
        body: rows.map((o) => [o.number, o.date, branchLabel(o.branchId), o.customer, `${o.productLabel} × ${o.items.reduce((a, i) => a + i.qty, 0)}`, o.status]),
        total: ["", "", "", "", `${rows.length} PO`, ""] as Array<string | number>,
        summary: `${rows.length} PO · Dipesan ${rows.filter((o) => o.status === "Dipesan").length} · Diproses ${rows.filter((o) => o.status === "Diproses").length} · Datang ${rows.filter((o) => o.status === "Sudah Datang").length} · Selesai ${rows.filter((o) => o.status === "Selesai").length}`,
      };
    }
    // aktivitas: fisik (mutasi) + workflow (alokasi/penerimaan) berlabel
    const mrows = store.mutations
      .filter((m) => inB(m.branchId))
      .filter((m) => inJenis(store.productOf(m.productId)?.type))
      .filter((m) => inPeriod(m.at, range.from, range.to))
      .map((m) => {
        const p = store.productOf(m.productId);
        return {
          sort: m.at,
          row: [m.at, m.id, "Mutasi fisik", p?.name ?? m.productId, branchLabel(m.branchId), m.qty, m.sumber, m.actor] as Array<string | number>,
          hay: `${m.id} ${m.ref} ${p?.name ?? ""}`,
        };
      });
    const rrows = store.receipts
      .filter((r) => inB(r.branchId))
      .filter((r) => inJenis(store.productOf(r.productId)?.type))
      .filter((r) => inPeriod(r.at, range.from, range.to))
      .map((r) => {
        const p = store.productOf(r.productId);
        return {
          sort: r.at,
          row: [r.at, r.id, "Penerimaan", p?.name ?? r.productId, branchLabel(r.branchId), `+${r.qty}`, r.distributionId, r.actor] as Array<string | number>,
          hay: `${r.id} ${r.distributionId} ${p?.name ?? ""}`,
        };
      });
    const drows = store.distributions
      .filter((d) => inB(d.branchId))
      .filter((d) => d.lines.some((l) => inJenis(store.productOf(l.productId)?.type)))
      .filter((d) => inPeriod(d.date, range.from, range.to))
      .flatMap((d) =>
        d.lines.filter((l) => inJenis(store.productOf(l.productId)?.type)).map((l) => {
          const p = store.productOf(l.productId);
          return {
            sort: d.date,
            row: [d.date, d.id, "Alokasi (reservasi)", p?.name ?? l.productId, branchLabel(d.branchId), l.qtyAlokasi, d.status, d.actor ?? "Sistem"] as Array<string | number>,
            hay: `${d.id} ${p?.name ?? ""}`,
          };
        }),
      );
    const all = [...mrows, ...rrows, ...drows].filter((r) => r.hay.toLowerCase().includes(q.toLowerCase()));
    return {
      head: ["Waktu", "Referensi", "Kejadian", "Produk", "Lokasi", "Qty", "Sumber/Status", "Aktor"],
      body: all.map((r) => r.row),
      total: ["", "", `${all.length} kejadian`, "", "", "", "", ""] as Array<string | number>,
      summary: `${all.length} kejadian · mutasi, penerimaan, dan alokasi`,
    };
  }, [store, kind, branch, jenis, range.from, range.to, q]);

  const pages = Math.max(1, Math.ceil(data.body.length / PAGE));
  const view = data.body.slice((page - 1) * PAGE, page * PAGE);
  const branchName = branch === "all" ? "Semua Cabang" : branchLabel(branch);
  const meta: Array<[string, string]> = [
    ["Cabang", branchName],
    ["Periode", range.label],
    ["Diekspor", new Date().toLocaleString("id-ID")],
    ["Baris", String(data.body.length)],
  ];
  const fileBase = `Laporan-${kind}-${branch}-${stamp()}`;

  const doExport = (fmt: "pdf" | "xlsx") => {
    if (busy) return;
    setBusy(fmt);
    setSaved(null);
    window.setTimeout(() => {
      try {
        const title = `Laporan ${KINDS.find((k) => k.id === kind)?.label} — Optik Mekar Jaya`;
        const name =
          fmt === "xlsx"
            ? exportXlsx(title, meta, data.head, data.body, data.total, `${fileBase}.xlsx`)
            : exportPdf(title, meta, data.head, data.body, data.total, `${fileBase}.pdf`);
        setSaved(`Tersimpan: ${name} (${data.body.length} baris).`);
      } catch (e) {
        setSaved(`Gagal mengekspor: ${e instanceof Error ? e.message : e}`);
      }
      setBusy(null);
    }, 60);
  };

  return (
    <div className="page">
      <PageHeader
        overline="PENGAWASAN — LAPORAN"
        title="Laporan Operasional"
        desc="Rekap transaksi, stok, pemesanan, dan aktivitas barang seluruh cabang. Filter berdasarkan cabang, jenis produk, dan periode, lalu ekspor ke Excel atau PDF."
      />

      <div className="toolbar">
        <div className="toolbar-chips">
          {KINDS.map((k) => (
            <Chip
              key={k.id}
              active={kind === k.id}
              onClick={() => {
                setKind(k.id);
                resetAll();
              }}
            >
              {k.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <SearchBox
          placeholder="Cari pada laporan..."
          value={q}
          onChange={(v) => {
            setQ(v);
            resetAll();
          }}
        />
        <div className="toolbar-chips">
          {PERIODS.map((k) => (
            <Chip
              key={k}
              active={period === k}
              onClick={() => {
                setPeriod(k);
                resetAll();
              }}
            >
              {PERIOD_LABEL[k]}
            </Chip>
          ))}
        </div>
        <select className="select-pill" aria-label="Cabang" value={branch} onChange={(e) => { setBranch(e.target.value); resetAll(); }}>
          <option value="all">Semua Cabang</option>
          {store.branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select className="select-pill" aria-label="Jenis" value={jenis} onChange={(e) => { setJenis(e.target.value as typeof jenis); resetAll(); }}>
          <option value="Semua">Semua jenis</option>
          <option value="Frame">Frame</option>
          <option value="Lensa">Lensa</option>
          <option value="Aksesoris">Aksesoris</option>
        </select>
      </div>

      {period === "custom" ? (
        <div className="toolbar">
          <label className="afield" style={{ minWidth: 170 }}>
            <span>Dari tanggal</span>
            <input type="date" value={cFrom} onChange={(e) => { setCFrom(e.target.value); resetAll(); }} />
          </label>
          <label className="afield" style={{ minWidth: 170 }}>
            <span>Sampai tanggal</span>
            <input type="date" value={cTo} onChange={(e) => { setCTo(e.target.value); resetAll(); }} />
          </label>
        </div>
      ) : null}

      <section className="panel panel-tight">
        <div className="section-head">
          <div>
            <h2>Ringkasan</h2>
            <div className="section-desc">{data.summary}</div>
          </div>
          <div className="section-action">
            <button className="btn btn-ghost btn-sm" disabled={busy !== null} onClick={() => doExport("xlsx")}>
              <FileSpreadsheet size={15} />
              {busy === "xlsx" ? "Mengekspor..." : "Ekspor XLSX"}
            </button>
            <button className="btn btn-ghost btn-sm" disabled={busy !== null} onClick={() => doExport("pdf")}>
              <FileText size={15} />
              {busy === "pdf" ? "Mengekspor..." : "Ekspor PDF"}
            </button>
          </div>
        </div>
        {saved ? (
          <div className="notice notice-ok" role="status" style={{ marginTop: 12 }}>
            <Download size={16} />
            {saved}
          </div>
        ) : null}
      </section>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              {data.head.map((h) => (
                <th key={h} className={/total|qty|stok|rp/i.test(h) ? "tt-center" : ""}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={typeof c === "number" ? "tt-center tt-money" : ""}>
                    {typeof c === "number" && /total/i.test(data.head[j]) ? rp(c) : String(c)}
                  </td>
                ))}
              </tr>
            ))}
            {view.length === 0 ? (
              <tr>
                <td colSpan={data.head.length}>
                  <div className="empty-note">Tidak ada data pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Halaman {page} dari {pages} · {data.body.length} baris</span>
          <div className="foot-actions">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
            <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
