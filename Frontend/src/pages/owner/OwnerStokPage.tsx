import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import { useSharedStore, type ProductType } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type StockState = "Aman" | "Menipis" | "Habis";
type StockFilter = "Semua" | StockState;

function stockState(saldo: number, minimum: number): StockState {
  if (saldo <= 0) return "Habis";
  if (saldo <= minimum) return "Menipis";
  return "Aman";
}

export default function OwnerStokPage() {
  const store = useSharedStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [jenis, setJenis] = useState<"Semua" | ProductType>("Semua");
  const [filter, setFilter] = useState<StockFilter>("Semua");

  const locParam = params.get("loc") ?? "all";
  const loc = store.branches.some((b) => b.id === locParam) ? locParam : "all";

  const setLoc = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("loc");
    else next.set("loc", value);
    setParams(next, { replace: true });
  };

  const baseRows = useMemo(
    () =>
      store.branches
        .flatMap((b) => store.stockForBranch(b.id).map((s) => ({ ...s, loc: b.id })))
        .map(({ loc: l, ...s }) => ({ l, s, p: store.productOf(s.productId)! }))
        .filter(({ p }) => p && p.status === "Aktif")
        .filter(({ p }) => (jenis === "Semua" ? true : p.type === jenis))
        .filter(({ l }) => (loc === "all" ? true : l === loc)),
    [store, loc, jenis],
  );

  const rows = useMemo(
    () =>
      baseRows
        .filter(({ s }) =>
          filter === "Semua"
            ? true
            : filter === "Habis"
              ? s.saldo <= 0
              : filter === "Menipis"
                ? s.saldo > 0 && s.saldo <= s.minimum
                : s.saldo > s.minimum,
        )
        .filter(({ p }) => `${p.code} ${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())),
    [baseRows, filter, q],
  );

  const totalUnits = baseRows.reduce((a, { s }) => a + s.saldo, 0);
  const lowCount = baseRows.filter(({ s }) => s.saldo > 0 && s.saldo <= s.minimum).length;
  const outCount = baseRows.filter(({ s }) => s.saldo <= 0).length;
  const showLocation = loc === "all";

  return (
    <div className="page">
      <PageHeader
        overline="MONITORING — STOK"
        title="Monitoring Stok"
      />

      <div className="stat-row">
        <StatCard
          label="Total Unit"
          value={totalUnits.toLocaleString("id-ID")}
          caption={`${baseRows.length} baris stok`}
          tone="violet"
          icon={<Boxes size={22} />}
        />
        <StatCard
          label="Stok Menipis"
          value={String(lowCount)}
          caption="Saldo di bawah minimum"
          tone="amber"
          icon={<AlertTriangle size={22} />}
        />
        <StatCard
          label="Stok Habis"
          value={String(outCount)}
          caption="Saldo 0 unit"
          tone="neutral"
          icon={<PackageX size={22} />}
        />
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Cari kode, nama, atau merek produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <select
            className="chip-select"
            aria-label="Filter Status Stok"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "Semua" | StockState)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis</option>
            <option value="Habis">Habis</option>
          </select>
          <select className="chip-select" aria-label="Lokasi" value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="all">Semua Lokasi</option>
            {store.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select className="chip-select" aria-label="Jenis" value={jenis} onChange={(e) => setJenis(e.target.value as typeof jenis)}>
            <option value="Semua">Semua Jenis</option>
            <option value="Frame">Frame</option>
            <option value="Lensa">Lensa</option>
            <option value="Aksesoris">Aksesoris</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt stock-table">
          <colgroup>
            {showLocation ? <col style={{ width: "14%" }} /> : null}
            <col style={{ width: showLocation ? "38%" : "50%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: showLocation ? "16%" : "18%" }} />
          </colgroup>
          <thead>
            <tr>
              {showLocation ? <th>LOKASI</th> : null}
              <th>KODE / NAMA PRODUK</th>
              <th>JENIS</th>
              <th className="tt-right">STOK</th>
              <th className="tt-right">MINIMUM</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ l, s, p }) => {
              const state = stockState(s.saldo, s.minimum);
              const branchName = store.branches.find((b) => b.id === l)?.name ?? l;
              return (
                <tr key={`${l}-${p.id}`}>
                  {showLocation ? (
                    <td className="stock-loc">
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        {branchName}
                      </div>
                    </td>
                  ) : null}
                  <td className="stock-product">
                    <div className="tt-num">{p.name}</div>
                    <div className="tt-sub">
                      {p.code} · {p.brand}
                    </div>
                    <div className="tt-sub stock-mobile-meta">
                      {showLocation ? `${branchName} · ` : ""}
                      {p.type} · min {s.minimum}
                    </div>
                  </td>
                  <td className="stock-type">{p.type}</td>
                  <td className="tt-right tt-money stock-saldo">{s.saldo}</td>
                  <td className="tt-right tt-money stock-min">{s.minimum}</td>
                  <td className="stock-status">
                    <StatusPill
                      label={state === "Habis" ? "Stok Habis" : state === "Menipis" ? "Stok Menipis" : "Aman"}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showLocation ? 6 : 5}>
                  <div className="empty-note">Tidak ada stok yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Menampilkan {rows.length} dari {baseRows.length} baris stok.
          </span>
        </div>
      </div>
    </div>
  );
}
